/**
 * Period labels in the real spreadsheets are human shorthand — "Jun 30th - Aug 3rd"
 * — with no year. That's fine for someone who wrote it, and opaque to someone
 * reading a dashboard. This turns the label into real dates so the header can say
 * what timeframe you're actually looking at.
 *
 * T-2: pure and deterministic. Returns null rather than guessing when the label
 * doesn't parse — an unreadable label shows as-is instead of showing a wrong date.
 */

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const PART = /([A-Za-z]{3,9})\s*(\d{1,2})(?:st|nd|rd|th)?/;

export interface PeriodDates {
  start: Date;
  end: Date;
  /** Inclusive day count. */
  days: number;
}

function monthIndex(name: string): number | null {
  const m = MONTHS[name.toLowerCase()];
  return m === undefined ? null : m;
}

/**
 * Parses "Jun 30th - Aug 3rd" style labels. A year is needed to do date arithmetic
 * at all, so one is assumed from `referenceDate` — but it is used only to count days
 * and is never displayed, because the label doesn't actually say which year it is.
 */
export function parsePeriodLabel(label: string, referenceDate: Date = new Date()): PeriodDates | null {
  const halves = label.split(/\s*[-–—]\s*|\s+to\s+/i);
  if (halves.length < 2) return null;

  const a = PART.exec(halves[0]);
  const b = PART.exec(halves[1]);
  if (!a || !b) return null;

  const startMonth = monthIndex(a[1]);
  const endMonth = monthIndex(b[1]);
  if (startMonth === null || endMonth === null) return null;

  const startDay = Number(a[2]);
  const endDay = Number(b[2]);
  if (!startDay || !endDay || startDay > 31 || endDay > 31) return null;

  // Assume the period ends on or before the reference date; if that puts the
  // start in the future, it belongs to the previous year.
  let year = referenceDate.getUTCFullYear();
  let start = new Date(Date.UTC(year, startMonth, startDay));
  if (start.getTime() > referenceDate.getTime() + 86400000 * 45) {
    year -= 1;
    start = new Date(Date.UTC(year, startMonth, startDay));
  }

  const endYear = endMonth < startMonth ? year + 1 : year;
  const end = new Date(Date.UTC(endYear, endMonth, endDay));
  if (end.getTime() < start.getTime()) return null;

  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return { start, end, days };
}

const DAY_MONTH = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });

/**
 * "30 June – 3 August" — deliberately no year.
 *
 * The year is nowhere in the data. Inferring it from the upload date is wrong the
 * moment someone uploads an older sheet, which is exactly what happened on the first
 * real file: a 2025 workbook uploaded in 2026 was labelled 2026. A day and month the
 * user can check beats a year the app guessed. The year comes back when ingest
 * actually carries one.
 */
export function formatPeriodRange(d: PeriodDates): string {
  return `${DAY_MONTH.format(d.start)} – ${DAY_MONTH.format(d.end)}`;
}

/** "5 weeks" / "4 weeks and 2 days" — how long the period actually ran. */
export function formatPeriodLength(days: number, weekCount?: number): string {
  if (weekCount && weekCount > 0) return `${weekCount} ${weekCount === 1 ? "week" : "weeks"}`;
  const weeks = Math.floor(days / 7);
  const rem = days % 7;
  if (weeks === 0) return `${days} ${days === 1 ? "day" : "days"}`;
  const w = `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
  return rem === 0 ? w : `${w} and ${rem} ${rem === 1 ? "day" : "days"}`;
}

/** Everything the header needs, or null when the label can't be read. */
export function describePeriod(
  label: string,
  referenceDate: Date,
  weekCount?: number
): { range: string; length: string } | null {
  const dates = parsePeriodLabel(label, referenceDate);
  if (!dates) return null;
  return { range: formatPeriodRange(dates), length: formatPeriodLength(dates.days, weekCount) };
}
