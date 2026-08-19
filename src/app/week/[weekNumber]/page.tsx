import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { monthOverview, weeklyBreakdown, type WeekTotals } from "@/lib/queries";
import { lineItemsForPeriod, listGoals, listPeriodSummaries } from "@/lib/store";
import { WEEKLY_CATEGORIES, WEEKLY_CATEGORY_TITLES, type WeeklyCategory } from "@/lib/transactions";
import type { UserId } from "@/lib/auth";
import { weekDateRange, formatWeekRange, monthNameOf } from "@/components/week/weekDateRange";
import { WeekView, type WeekTransactionItem } from "./WeekView";

type SearchParams = { [key: string]: string | string[] | undefined };

/**
 * No "current period" concept exists yet anywhere in `src/lib` (Home, which
 * owns the month picker, isn't built out yet either). `?period=<id>` lets a
 * caller be explicit; absent that, this falls back to the most recently
 * created period for the user, via the same `listPeriodSummaries` ordering
 * the dashboard already trusts.
 */
async function resolvePeriodId(userId: UserId, searchParams: SearchParams): Promise<number | null> {
  const raw = searchParams.period;
  const str = Array.isArray(raw) ? raw[0] : raw;
  if (str) {
    const n = Number(str);
    if (Number.isFinite(n)) return n;
  }
  const summaries = await listPeriodSummaries(userId);
  if (summaries.length === 0) return null;
  return summaries[summaries.length - 1].periodId;
}

/** A week with no transactions yet doesn't appear in `weeklyBreakdown`'s output — this is its honest zero. */
function emptyWeek(weekNumber: number, goals: { category: WeeklyCategory; weeklyAmount: number }[]): WeekTotals {
  const goalFor = new Map(goals.map((g) => [g.category, g.weeklyAmount]));
  const categories = WEEKLY_CATEGORIES.map((category) => {
    const goal = goalFor.get(category) ?? null;
    return {
      category,
      title: WEEKLY_CATEGORY_TITLES[category],
      spent: 0,
      goal,
      remaining: goal === null ? null : goal,
      count: 0,
    };
  });
  const withGoals = categories.filter((c) => c.goal !== null);
  const goal = withGoals.length > 0 ? withGoals.reduce((sum, c) => sum + (c.goal ?? 0), 0) : null;
  return { weekNumber, spent: 0, goal, remaining: goal, categories };
}

export default async function WeekPage({
  params,
  searchParams,
}: {
  params: Promise<{ weekNumber: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const { weekNumber: weekNumberParam } = await params;
  const sp = await searchParams;

  const weekNumber = Number(weekNumberParam);
  if (!Number.isFinite(weekNumber) || weekNumber < 1) notFound();

  const periodId = await resolvePeriodId(user.id, sp);
  if (periodId === null) notFound();

  const [weeks, items, goals, overview] = await Promise.all([
    weeklyBreakdown(user.id, periodId),
    lineItemsForPeriod(user.id, periodId),
    listGoals(user.id),
    monthOverview(user.id, periodId),
  ]);

  if (!overview) notFound();

  const week = weeks.find((w) => w.weekNumber === weekNumber) ?? emptyWeek(weekNumber, goals);

  const transactionsByCategory: Record<string, WeekTransactionItem[]> = {};
  for (const category of WEEKLY_CATEGORIES) transactionsByCategory[category] = [];
  for (const item of items) {
    if (item.kind !== "weekly" || item.weekNumber !== weekNumber || !item.category) continue;
    const list = transactionsByCategory[item.category] ?? (transactionsByCategory[item.category] = []);
    list.push({ id: item.id, merchant: item.merchant, note: item.note, amount: item.amount, pending: item.pending });
  }

  const range = overview.window ? weekDateRange(overview.window.start, overview.window.end, weekNumber) : null;

  return (
    <WeekView
      weekNumber={weekNumber}
      periodId={periodId}
      monthName={range ? monthNameOf(range.start) : overview.label}
      rangeLabel={range ? formatWeekRange(range) : overview.label}
      week={week}
      transactionsByCategory={transactionsByCategory}
    />
  );
}
