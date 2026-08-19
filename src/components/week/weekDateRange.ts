/**
 * Weeks aren't stored with their own calendar dates — only a period's
 * start/end (from `periodWindow`) and an integer `week_number` per
 * transaction. Screen 03's title is a date range ("4 – 10 Aug"), so this
 * derives one: consecutive 7-day blocks from the period's start date,
 * clamped to the period's end.
 *
 * This is a display convenience, not stored fact — the last week of a
 * period that doesn't divide evenly by 7 is shorter than 7 days, and a week
 * number past the period's length returns null rather than inventing dates
 * beyond what the period actually covers.
 */

const DAY_MS = 86_400_000;

export interface WeekDateRange {
  start: Date;
  end: Date;
}

export function weekDateRange(periodStart: Date, periodEnd: Date, weekNumber: number): WeekDateRange | null {
  if (weekNumber < 1) return null;
  if (periodEnd.getTime() < periodStart.getTime()) return null;

  const start = new Date(periodStart.getTime() + (weekNumber - 1) * 7 * DAY_MS);
  if (start.getTime() > periodEnd.getTime()) return null;

  const end = new Date(Math.min(start.getTime() + 6 * DAY_MS, periodEnd.getTime()));
  return { start, end };
}

const DAY_MONTH = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const MONTH_ONLY = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });

/** "4 – 10 Aug" */
export function formatWeekRange(range: WeekDateRange): string {
  return `${range.start.getUTCDate()} – ${DAY_MONTH.format(range.end)}`;
}

/** "August" */
export function monthNameOf(d: Date): string {
  return MONTH_ONLY.format(d);
}
