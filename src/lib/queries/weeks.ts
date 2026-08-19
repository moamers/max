/**
 * The week screen (03): each week of the month, what went on Everyday, Weekend
 * and Transport, and how that sits against the target the user set.
 *
 * Only `weekly` transactions appear here. Recurring and one-offs are not part
 * of a week's rhythm — the whole point of the three kinds is that a week is
 * judged against how weeks usually go, not against the month's rent landing in
 * it (D-2).
 *
 * A category with no goal returns `goal: null`, and `remaining` is null with
 * it. Comparing spend against a target of zero would show every user who hasn't
 * set one as catastrophically over.
 */
import { eq, and, asc, sql } from "drizzle-orm";
import { getDb } from "../db";
import { periods, transactions, goals } from "../schema";
import type { UserId } from "../auth";
import {
  WEEKLY_CATEGORIES,
  WEEKLY_CATEGORY_TITLES,
  type WeeklyCategory,
} from "../transactions";

export interface WeeklyCategoryTotal {
  category: WeeklyCategory;
  /** The design's wording for this category (screens 03, 11). */
  title: string;
  spent: number;
  goal: number | null;
  /** goal − spent. Negative means over. Null when there is no goal to be over. */
  remaining: number | null;
  count: number;
}

export interface WeekTotals {
  weekNumber: number;
  spent: number;
  /** Sum of the goals that exist, or null when none are set. */
  goal: number | null;
  remaining: number | null;
  categories: WeeklyCategoryTotal[];
}

export async function weeklyBreakdown(
  userId: UserId,
  periodId: number
): Promise<WeekTotals[]> {
  const db = getDb();

  const rows = await db
    .select({
      weekNumber: transactions.weekNumber,
      category: transactions.category,
      total: sql<string>`sum(${transactions.amount})`,
      count: sql<number>`count(*)`,
    })
    .from(transactions)
    .innerJoin(periods, eq(periods.id, transactions.periodId))
    .where(
      and(
        eq(transactions.periodId, periodId),
        eq(periods.userId, userId),
        eq(transactions.kind, "weekly")
      )
    )
    .groupBy(transactions.weekNumber, transactions.category)
    .orderBy(asc(transactions.weekNumber));

  const goalRows = await db
    .select({ category: goals.category, weeklyAmount: goals.weeklyAmount })
    .from(goals)
    .where(eq(goals.userId, userId));

  const goalFor = new Map<WeeklyCategory, number>(
    goalRows.map((g) => [g.category, Number(g.weeklyAmount)])
  );

  // A weekly row with no week number can't be placed in a week. It is not
  // dropped — it is reported under week 0 — because a total that silently
  // omits rows is exactly the failure this product exists to avoid.
  const weeks = new Map<number, Map<WeeklyCategory, { spent: number; count: number }>>();
  for (const r of rows) {
    const week = r.weekNumber ?? 0;
    const category = r.category as WeeklyCategory | null;
    if (category === null) continue;
    const byCategory = weeks.get(week) ?? new Map();
    const acc = byCategory.get(category) ?? { spent: 0, count: 0 };
    acc.spent += Number(r.total ?? 0);
    acc.count += Number(r.count ?? 0);
    byCategory.set(category, acc);
    weeks.set(week, byCategory);
  }

  return [...weeks.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([weekNumber, byCategory]) => {
      const categories: WeeklyCategoryTotal[] = WEEKLY_CATEGORIES.map((category) => {
        const acc = byCategory.get(category) ?? { spent: 0, count: 0 };
        const goal = goalFor.get(category) ?? null;
        return {
          category,
          title: WEEKLY_CATEGORY_TITLES[category],
          spent: acc.spent,
          goal,
          remaining: goal === null ? null : goal - acc.spent,
          count: acc.count,
        };
      });

      const spent = categories.reduce((sum, c) => sum + c.spent, 0);
      const withGoals = categories.filter((c) => c.goal !== null);
      const goal = withGoals.length > 0 ? withGoals.reduce((sum, c) => sum + (c.goal ?? 0), 0) : null;

      return { weekNumber, spent, goal, remaining: goal === null ? null : goal - spent, categories };
    });
}
