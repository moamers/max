/**
 * Carrying recurring bills from one month into the next.
 *
 * > "the recurring are technically amounts that happen every month. So when you
 * > open a new month they need to be replicated rather than start from 0 … By
 * > default they should be left pending state."
 *
 * The judgement in that sentence — *which* month to copy from, and what a copied
 * date means in a month of different length — lives here, pure, so it can be
 * read and tested without a database. `store.ts` owns the reading and writing;
 * this file owns the rules.
 *
 * Two things it deliberately does not do:
 *
 *  - It does not compute a template. Copied rows are ordinary independent rows,
 *    because the founder asked to amend a month "without affecting previous or
 *    future" — which is exactly what ordinary rows already do. A derived
 *    template would make per-month amendment the hard case.
 *  - It does not confirm anything. Every copied row lands `pending`: a bill Ravel
 *    has not seen leave the account is a prediction, and saying otherwise would
 *    be the app asserting a fact it does not have.
 */

const DAY_MS = 86_400_000;

export interface CarryCandidate {
  id: number;
  /** ISO date, or null for an imported period whose dates were never established. */
  startDate: string | null;
  sheetOrder: number;
  hasRecurring: boolean;
}

export interface CarryTarget {
  id: number;
  startDate: string | null;
}

function utcFromIso(value: string | null): number | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? date.getTime()
    : null;
}

function isoFromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Which month to copy from: **the most recent period before this one that
 * actually has recurring rows** — not simply the previous period, which may be
 * an empty month somebody started and never filled in.
 *
 * "Before" is by start date. Periods whose dates were never established sort
 * behind every dated one and are compared by the order they arrived in, which
 * is the only ordering an undated period has. That fallback is why a workbook
 * imported before period dates existed can still seed a new month.
 */
export function pickCarrySource(
  target: CarryTarget,
  candidates: readonly CarryCandidate[]
): CarryCandidate | null {
  const usable = candidates.filter((candidate) => candidate.hasRecurring && candidate.id !== target.id);
  const targetStart = utcFromIso(target.startDate);

  const dated = usable
    .map((candidate) => ({ candidate, start: utcFromIso(candidate.startDate) }))
    .filter((entry): entry is { candidate: CarryCandidate; start: number } =>
      entry.start !== null && (targetStart === null || entry.start < targetStart)
    );
  if (dated.length > 0) {
    return dated.reduce((best, entry) => {
      if (entry.start !== best.start) return entry.start > best.start ? entry : best;
      return entry.candidate.sheetOrder > best.candidate.sheetOrder ? entry : best;
    }).candidate;
  }

  const undated = usable.filter((candidate) => utcFromIso(candidate.startDate) === null);
  if (undated.length === 0) return null;
  return undated.reduce((best, candidate) =>
    candidate.sheetOrder > best.sheetOrder || (candidate.sheetOrder === best.sheetOrder && candidate.id > best.id)
      ? candidate
      : best
  );
}

/**
 * The day a copied bill lands on: the same distance into the new period as it
 * was into the old one.
 *
 * Returns null — no date at all — whenever that answer cannot be reached
 * honestly: no recorded day to shift, no dates on either period, or a day that
 * would fall outside the new month because it is a week shorter. `occurred_on`
 * is nullable precisely because "the sheet gives a week, not a day, and
 * inventing one would be a claim".
 */
export function shiftOccurredOn(
  occurredOn: string | null,
  sourceStart: string | null,
  targetStart: string | null,
  targetEnd: string | null
): string | null {
  const occurred = utcFromIso(occurredOn);
  const from = utcFromIso(sourceStart);
  const to = utcFromIso(targetStart);
  if (occurred === null || from === null || to === null) return null;

  const offset = occurred - from;
  if (offset < 0) return null;

  const landed = to + offset;
  const end = utcFromIso(targetEnd);
  if (end !== null && landed > end) return null;
  // A period is at most five weeks; an offset beyond that is not a shift, it is
  // a mis-recorded date, and moving it would be inventing one.
  if (end === null && offset > 35 * DAY_MS) return null;
  return isoFromUtc(landed);
}
