/**
 * What a month is worth, and how confident we are about that.
 *
 * Three sources, in order, and the answer says which one it used. B-8: a figure
 * that can't be traced is a figure the user has to take on faith, and income is
 * the number every other number on the home screen is measured against.
 *
 * When none of the three has a value the answer is `null` with source
 * `"unknown"`. Not zero. A forecast against an assumed income of nothing looks
 * like a confident statement and is in fact a fabrication.
 */
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { periods, incomeMonths, users } from "../schema";
import type { UserId } from "../auth";

export type IncomeSource = "month" | "period" | "default" | "unknown";

export interface PeriodIncome {
  periodId: number;
  amount: number | null;
  source: IncomeSource;
  /** True when the user typed the figure rather than Max reading it off a sheet. */
  setByUser: boolean;
}

export async function incomeForPeriod(userId: UserId, periodId: number): Promise<PeriodIncome> {
  const db = getDb();

  // One statement, three sources. The left joins mean an absent income_months
  // row or an absent default doesn't remove the period from the result — the
  // fallback is chosen here, in code the reader can see, not by the row simply
  // vanishing.
  const [row] = await db
    .select({
      periodIncome: periods.income,
      monthAmount: incomeMonths.amount,
      monthSetByUser: incomeMonths.setByUser,
      defaultAmount: users.defaultMonthlyIncome,
    })
    .from(periods)
    .innerJoin(users, eq(users.id, periods.userId))
    .leftJoin(
      incomeMonths,
      and(eq(incomeMonths.periodId, periods.id), eq(incomeMonths.userId, periods.userId))
    )
    .where(and(eq(periods.id, periodId), eq(periods.userId, userId)));

  if (!row) return { periodId, amount: null, source: "unknown", setByUser: false };

  if (row.monthAmount != null) {
    return {
      periodId,
      amount: Number(row.monthAmount),
      source: "month",
      setByUser: row.monthSetByUser ?? true,
    };
  }
  // What the import read for this specific month. More particular than a
  // standing default, so it outranks it.
  if (row.periodIncome != null) {
    return { periodId, amount: Number(row.periodIncome), source: "period", setByUser: false };
  }
  if (row.defaultAmount != null) {
    return { periodId, amount: Number(row.defaultAmount), source: "default", setByUser: true };
  }
  return { periodId, amount: null, source: "unknown", setByUser: false };
}
