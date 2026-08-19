/**
 * Turns `weeklyBreakdown`'s rows into the full run of week cards the design
 * shows (README 02.3: "one roomy row per week (5 rows)").
 *
 * `weeklyBreakdown` only returns a week bucket when at least one transaction
 * landed in it (src/lib/queries/weeks.ts: "a weekly row with no week number
 * can't be placed... reported under week 0" — by the same logic, a week with
 * *no rows at all* never gets a bucket). A week that hasn't started yet is
 * exactly that case, and the design still needs to draw it (grey "budget").
 * So this fills in the weeks the period's own length implies but the query
 * has nothing to report for, using the *same* per-category goals every real
 * week already carries (goals are per-category, not per-week, so any
 * present week's goal is every week's goal) — no new target is invented.
 */
import type { PeriodWindow, WeekTotals, WeeklyCategoryTotal } from "@/lib/queries";
import { WEEKLY_CATEGORIES, WEEKLY_CATEGORY_TITLES, type WeeklyCategory } from "@/lib/transactions";
import { categoryFooter, formatWeekRange, moneyState, weekDates } from "./format";
import type { CategoryView, WeekView } from "./types";

type GoalTemplate = Record<WeeklyCategory, { title: string; goal: number | null }>;

function goalTemplateFrom(weeks: WeekTotals[]): GoalTemplate {
  const source: WeeklyCategoryTotal[] = weeks[0]?.categories ?? [];
  const byCategory = new Map(source.map((c) => [c.category, c]));
  const template = {} as GoalTemplate;
  for (const category of WEEKLY_CATEGORIES) {
    const found = byCategory.get(category);
    template[category] = { title: found?.title ?? WEEKLY_CATEGORY_TITLES[category], goal: found?.goal ?? null };
  }
  return template;
}

function totalBudgetPerWeek(template: GoalTemplate): number | null {
  const set = WEEKLY_CATEGORIES.map((c) => template[c].goal).filter((g): g is number => g !== null);
  return set.length > 0 ? set.reduce((sum, g) => sum + g, 0) : null;
}

/** How many weeks the period spans, regardless of which ones have transactions. */
export function weekCountForWindow(window: PeriodWindow | null, weeksWithData: WeekTotals[]): number {
  const fromRows = Math.max(0, ...weeksWithData.map((w) => w.weekNumber));
  if (window) return Math.max(1, Math.ceil(window.totalDays / 7), fromRows);
  return Math.max(1, fromRows);
}

export interface WeeksResult {
  weeks: WeekView[];
  /** Sum of every real category goal, once per week the period spans (null when no goals are set at all). */
  totalBudget: number | null;
  currentWeekNumber: number;
}

export function buildWeekViews(
  weeksWithData: WeekTotals[],
  window: PeriodWindow | null,
  today: Date
): WeeksResult {
  const template = goalTemplateFrom(weeksWithData);
  const perWeekBudget = totalBudgetPerWeek(template);
  const weekCount = weekCountForWindow(window, weeksWithData);
  const byNumber = new Map(weeksWithData.map((w) => [w.weekNumber, w]));

  let currentWeekNumber = 1;
  const weeks: WeekView[] = [];

  for (let n = 1; n <= weekCount; n++) {
    const found = byNumber.get(n);
    const dates = window ? weekDates(n, window, today) : null;
    const isFuture = dates?.isFuture ?? false;
    const isLive = dates?.isLive ?? false;
    if (isLive) currentWeekNumber = n;

    const categories: CategoryView[] = WEEKLY_CATEGORIES.map((category) => {
      const foundCat = found?.categories.find((c) => c.category === category);
      const spent = foundCat?.spent ?? 0;
      const goal = foundCat?.goal ?? template[category].goal;
      const remaining = goal === null ? null : goal - spent;
      const state = moneyState(spent, goal, remaining, isFuture);
      return {
        category,
        title: template[category].title,
        spent,
        goal,
        state,
        footer: categoryFooter(goal, state),
      };
    });

    const spent = found?.spent ?? 0;
    const goal = found?.goal ?? perWeekBudget;
    const remaining = goal === null ? null : goal - spent;

    weeks.push({
      weekNumber: n,
      range: dates ? formatWeekRange(dates.start, dates.end) : `Week ${n}`,
      isLive,
      spent,
      goal,
      state: moneyState(spent, goal, remaining, isFuture),
      categories,
    });
  }

  if (!weeks.some((w) => w.isLive) && window) {
    currentWeekNumber = Math.min(weekCount, Math.max(1, Math.ceil(window.daysElapsed / 7)));
  }

  return { weeks, totalBudget: perWeekBudget === null ? null : perWeekBudget * weekCount, currentWeekNumber };
}
