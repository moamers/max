import { parsePeriodLabel } from "./period-dates";

const DAY_MS = 86_400_000;

export interface PeriodDateProposal {
  startDate: string;
  endDate: string;
  /** False means the year was not in the user's file and must be shown before saving. */
  yearWasExplicit: boolean;
}

export interface NextPeriodProposal {
  startDate: string;
  endDate: string;
  weekCount: 4 | 5;
  label: string;
}

function utcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * DAY_MS);
}

function validIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? date
    : null;
}

/**
 * Suggest dates from a human period label. A yearless suggestion is never safe
 * to persist silently (G-1), so callers must show it and receive confirmation.
 */
export function proposeImportedPeriodDates(
  label: string,
  referenceDate: Date = new Date()
): PeriodDateProposal | null {
  const parsed = parsePeriodLabel(label, referenceDate);
  if (!parsed) return null;

  const years = label.match(/\b(?:19|20)\d{2}\b/g) ?? [];
  let start = parsed.start;
  let end = parsed.end;
  if (years.length > 0) {
    const startYear = Number(years[0]);
    const endYear = years.length > 1
      ? Number(years[1])
      : startYear + (parsed.end.getUTCMonth() < parsed.start.getUTCMonth() ? 1 : 0);
    start = new Date(Date.UTC(startYear, parsed.start.getUTCMonth(), parsed.start.getUTCDate()));
    end = new Date(Date.UTC(endYear, parsed.end.getUTCMonth(), parsed.end.getUTCDate()));
  }
  return {
    startDate: isoDate(start),
    endDate: isoDate(end),
    yearWasExplicit: years.length > 0,
  };
}

/** Prefilled fallback for the one file-level date question when its label is unreadable. */
export function proposePeriodAroundDate(
  referenceDate: Date = new Date(),
  weekCount: 4 | 5 = 4
): PeriodDateProposal {
  const reference = utcDay(referenceDate);
  const daysSinceMonday = (reference.getUTCDay() + 6) % 7;
  const start = addDays(reference, -daysSinceMonday);
  const end = addDays(start, weekCount * 7 - 1);
  return { startDate: isoDate(start), endDate: isoDate(end), yearWasExplicit: false };
}

/** The end candidate's distance from the closest calendar-month boundary. */
function distanceToNearestFirst(candidate: Date): number {
  const firstThisMonth = new Date(Date.UTC(candidate.getUTCFullYear(), candidate.getUTCMonth(), 1));
  const firstNextMonth = new Date(Date.UTC(candidate.getUTCFullYear(), candidate.getUTCMonth() + 1, 1));
  return Math.min(
    Math.abs(candidate.getTime() - firstThisMonth.getTime()),
    Math.abs(firstNextMonth.getTime() - candidate.getTime())
  );
}

const MONTH_SHORT = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });

function ordinal(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  if (day % 10 === 1) return `${day}st`;
  if (day % 10 === 2) return `${day}nd`;
  if (day % 10 === 3) return `${day}rd`;
  return `${day}th`;
}

export function periodLabel(start: Date, end: Date): string {
  return `${MONTH_SHORT.format(start)} ${ordinal(start.getUTCDate())} – ${MONTH_SHORT.format(end)} ${ordinal(end.getUTCDate())}`;
}

/**
 * B-9: proposal only. The caller shows this end date and lets the user switch
 * to the other whole-week length before it is persisted.
 */
export function proposeNextPeriod(previousEndIso: string): NextPeriodProposal | null {
  const previousEnd = validIsoDate(previousEndIso);
  if (!previousEnd) return null;

  const start = addDays(previousEnd, 1);
  if (start.getUTCDay() !== 1) return null;

  const fourWeekEnd = addDays(start, 27);
  const fiveWeekEnd = addDays(start, 34);
  const weekCount: 4 | 5 =
    distanceToNearestFirst(fourWeekEnd) <= distanceToNearestFirst(fiveWeekEnd) ? 4 : 5;
  const end = weekCount === 4 ? fourWeekEnd : fiveWeekEnd;

  return {
    startDate: isoDate(start),
    endDate: isoDate(end),
    weekCount,
    label: periodLabel(start, end),
  };
}

export function periodHasEnded(endDateIso: string, today: Date = new Date()): boolean {
  const end = validIsoDate(endDateIso);
  return end !== null && utcDay(today).getTime() > end.getTime();
}

export function isWholeMondayToSundayPeriod(startDateIso: string, endDateIso: string): boolean {
  const start = validIsoDate(startDateIso);
  const end = validIsoDate(endDateIso);
  if (!start || !end || start.getUTCDay() !== 1 || end.getUTCDay() !== 0) return false;
  const days = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  return days === 28 || days === 35;
}

/**
 * The month a period actually belongs to — the one holding most of its days,
 * not the one it happens to start in.
 *
 * "Jun 29th - Aug 2nd" starts in June and spends two days there; the other
 * thirty-three are July and August. Naming it June put "July" in the month bar
 * and "Jun" on the calendar tile for the same period, because the two were
 * asking the question differently.
 *
 * Periods here are pay periods. They cross month boundaries by design, so the
 * start date is not a name — and every surface that names a period must use
 * this one function, or they will disagree again.
 */
export function dominantMonth(start: Date, end: Date): Date {
  const days = new Map<string, { count: number; date: Date }>();
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  while (cursor.getTime() <= end.getTime()) {
    const key = `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}`;
    const seen = days.get(key);
    if (seen) seen.count += 1;
    else days.set(key, { count: 1, date: new Date(cursor.getTime()) });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  let best: { count: number; date: Date } | null = null;
  for (const entry of days.values()) {
    // Ties go to the earlier month, so a period split exactly in half is named
    // by where it began rather than by iteration order.
    if (!best || entry.count > best.count) best = entry;
  }
  return best ? best.date : start;
}
