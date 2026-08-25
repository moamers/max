/**
 * Pure formatting/derivation helpers for the home screen and its sheets.
 * No React, no fetching — kept separate so the "which word, which colour"
 * rules (the one piece of real logic these screens have, per the README's
 * chart-grammar and week-row rules) are unit-testable on their own.
 */
import type { PeriodWindow, WeekTotals } from "@/lib/queries";

const GBP_WHOLE = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

/** "£703", "£2,975" — the whole-pound style used everywhere in the design. */
export function formatGBP(amount: number): string {
  return GBP_WHOLE.format(amount);
}

/** "+£1,108" / "-£240" — the year strip's signed net position. */
export function formatSignedGBP(amount: number): string {
  const sign = amount < 0 ? "-" : "+";
  return `${sign}${GBP_WHOLE.format(Math.abs(amount))}`;
}

const MONTH_SHORT = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });
const MONTH_LONG = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });
const DAY_MONTH_SHORT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** "18 Aug" — the month bar's mono "today" date. */
export function formatDayMonth(d: Date): string {
  return DAY_MONTH_SHORT.format(d);
}

/** "August" — the month bar's title, and the hero sentence's month name. */
export function monthName(d: Date): string {
  return MONTH_LONG.format(d);
}

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** "Jan".."Dec" by calendar index (0-11) — the Change month grid's tile labels. */
export function monthAbbr(index: number): string {
  return MONTH_ABBR[index];
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

/** "4 – 10 Aug" / "28 Jul – 3 Aug" — a week's date range, short-month style. */
export function formatWeekRange(start: Date, end: Date): string {
  const sameMonth = start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear();
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  if (sameMonth) return `${startDay} – ${endDay} ${MONTH_SHORT.format(end)}`;
  return `${DAY_MONTH_SHORT.format(start)} – ${DAY_MONTH_SHORT.format(end)}`;
}

export interface WeekDates {
  start: Date;
  end: Date;
  isLive: boolean;
  isFuture: boolean;
}

/**
 * `weeklyBreakdown` groups by `weekNumber` but carries no dates — weeks are
 * assumed to be consecutive 7-day spans from the period's start, which is
 * how the import assigns `week_number` in the first place. Clamped to the
 * period's own end so the last week doesn't run past it.
 */
export function weekDates(weekNumber: number, window: PeriodWindow, today: Date): WeekDates {
  const start = addDays(window.start, (weekNumber - 1) * 7);
  const rawEnd = addDays(start, 6);
  const end = rawEnd.getTime() > window.end.getTime() ? window.end : rawEnd;
  const t = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return {
    start,
    end,
    isLive: t.getTime() >= start.getTime() && t.getTime() <= end.getTime(),
    isFuture: t.getTime() < start.getTime(),
  };
}

/** "wk 4 of 5" — the month bar's mono week counter. */
export function weekCounterLabel(currentWeek: number, totalWeeks: number): string {
  return `wk ${currentWeek} of ${totalWeeks}`;
}

export type MoneyWord = "left" | "over" | "budget" | "spent";
export type MoneyTone = "lime" | "over" | "muted" | "primary";

export interface MoneyState {
  /** The number to show — always non-negative; the word carries the sign. */
  amount: number;
  word: MoneyWord;
  tone: MoneyTone;
}

/**
 * The week/category headline rule (README 02.3): lime "left" while under
 * budget, red "over" once spend passes it, grey "budget" for a week that
 * hasn't started yet (nothing to be "left" of), and a plain "spent" total
 * when there is no goal to measure against at all.
 */
/**
 * The month a period actually belongs to — the one holding most of its days,
 * not the one it happens to start in.
 *
 * "Jun 30th - Aug 3rd" starts in June and spends one day there; the other
 * thirty-four are July and August. Naming it "June" made the home screen say
 * June above a list of July weeks. Periods here are pay periods, so they cross
 * month boundaries by design and the start date is not a label.
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

export function moneyState(spent: number, goal: number | null, remaining: number | null, isFuture: boolean): MoneyState {
  if (goal === null || remaining === null) {
    return { amount: spent, word: "spent", tone: "muted" };
  }
  if (isFuture) {
    return { amount: goal, word: "budget", tone: "muted" };
  }
  if (remaining < 0) {
    return { amount: -remaining, word: "over", tone: "over" };
  }
  return { amount: remaining, word: "left", tone: "lime" };
}

/** The CSS colour token for a `MoneyState`'s tone — lime "left", red "over", muted "budget"/"spent". */
export function moneyToneColor(tone: MoneyTone): string {
  if (tone === "lime") return "var(--lime-ink)";
  if (tone === "over") return "var(--bar-over)";
  if (tone === "muted") return "var(--text-tertiary)";
  return "var(--text-primary)";
}

/** "left of £190" / "over £150" / "budget £80" — the category row's mono footer. */
export function categoryFooter(goal: number | null, state: MoneyState): string {
  if (goal === null) return "no target set";
  if (state.word === "left") return `left of ${formatGBP(goal)}`;
  if (state.word === "over") return `over ${formatGBP(goal)}`;
  if (state.word === "budget") return `budget ${formatGBP(goal)}`;
  return `of ${formatGBP(goal)}`;
}

/** How many whole weeks (rounded up) are left in the period — the hero sentences count in weeks, not days. */
export function weeksRemaining(daysRemaining: number): number {
  return Math.max(0, Math.ceil(daysRemaining / 7));
}

/**
 * The hero card's one sentence of explanation (docs/design/handoff/Max App
 * v1.dc.html, the forecast and today hero blocks) — copy is final, only
 * the week count and month name are live.
 */
export function heroForecastSentence(
  daysRemaining: number,
  month: string,
  /** Weekly allowance not yet spent, and what is left after everything else. */
  detail?: { weeklyRemaining: number; leftToday: number | null }
): string {
  const weeks = weeksRemaining(daysRemaining);
  if (weeks <= 0) return `This is where ${month} lands.`;
  const noun = weeks === 1 ? "week" : "weeks";
  const base = `${weeks} ${noun} to go. Spend the weekly budget that's left and this is where ${month} lands.`;

  // When spending the whole allowance would take them under, say by how much
  // and what would keep them level — a shortfall the user can't act on is just
  // bad news.
  if (detail && detail.leftToday !== null && detail.weeklyRemaining > detail.leftToday) {
    return `${base} There's ${formatGBP(detail.weeklyRemaining)} of weekly budget left, and ${formatGBP(
      detail.leftToday
    )} of room — so ${formatGBP(detail.weeklyRemaining - detail.leftToday)} of it would come from somewhere else.`;
  }
  return base;
}

export function heroTodaySentence(daysRemaining: number): string {
  const weeks = weeksRemaining(daysRemaining);
  if (weeks <= 0) return "True, but the month isn't over yet.";
  const noun = weeks === 1 ? "week" : "weeks";
  return `True, but ${weeks} ${noun} of ordinary life hasn't happened yet.`;
}

/** Total weekly-category budget across every week the month has — the Weeks card's "of £2,100 this month". */
export function totalWeeklyBudget(weeks: WeekTotals[]): number | null {
  const withGoals = weeks.filter((w) => w.goal !== null);
  if (withGoals.length === 0) return null;
  return withGoals.reduce((sum, w) => sum + (w.goal ?? 0), 0);
}

export function totalWeeklySpent(weeks: WeekTotals[]): number {
  return weeks.reduce((sum, w) => sum + w.spent, 0);
}
