/**
 * Where "today" falls inside a pay period.
 *
 * Every forward-looking number on the home screen depends on this and on
 * nothing else, so it is one small pure function rather than a calculation
 * repeated in three queries with three slightly different answers.
 *
 * The window comes from `periods.start_date` / `end_date` when they are
 * populated, and otherwise from parsing the label the user wrote. When neither
 * yields dates the answer is `null` — the screens then have to say they don't
 * know how far through the month we are, which is correct, rather than assume
 * a 30-day month and quietly forecast against it.
 */
import { parsePeriodLabel } from "../period-dates";

export interface PeriodWindow {
  start: Date;
  end: Date;
  /** Inclusive length of the period, in days. */
  totalDays: number;
  /** Days from the start up to and including `today`, clamped to the window. */
  daysElapsed: number;
  /** Days after `today` up to and including the last day. */
  daysRemaining: number;
  /** True once `today` is past the end — the period is history, not a forecast. */
  complete: boolean;
}

const DAY_MS = 86_400_000;

function parseIsoDate(value: string | null): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function periodWindow(
  period: { label: string; startDate: string | null; endDate: string | null },
  today: Date = new Date()
): PeriodWindow | null {
  let start = parseIsoDate(period.startDate);
  let end = parseIsoDate(period.endDate);

  if (!start || !end) {
    // The label is the user's own text ("Jun 30th - Aug 3rd"); it carries no
    // year, so `parsePeriodLabel` infers one from today. Only the length and
    // the position within it are used here, never a displayed year.
    const parsed = parsePeriodLabel(period.label, today);
    if (!parsed) return null;
    start = start ?? startOfUtcDay(parsed.start);
    end = end ?? startOfUtcDay(parsed.end);
  }

  if (end < start) return null;

  const now = startOfUtcDay(today);
  const totalDays = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  const rawElapsed = Math.round((now.getTime() - start.getTime()) / DAY_MS) + 1;
  const daysElapsed = Math.min(Math.max(rawElapsed, 0), totalDays);

  return {
    start,
    end,
    totalDays,
    daysElapsed,
    daysRemaining: totalDays - daysElapsed,
    complete: now > end,
  };
}
