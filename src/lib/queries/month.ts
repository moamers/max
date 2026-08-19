/**
 * The home screen's month: what has gone out so far, and where that lands by
 * the end of the month if the rest of it looks like the part already lived.
 *
 * The forecast rule, stated once so it can be argued with:
 *
 *   forecast = spent so far + (weekly run-rate x days remaining)
 *
 * Only *weekly* spend is projected forward. Recurring is the fixed floor — it
 * is charged once and projecting it would bill the user's rent twice — and
 * one-offs are by definition not a rate. Every input to the number is returned
 * alongside it (B-8), so the screen can show its working rather than assert a
 * total.
 *
 * When the period's dates can't be established there is no forecast: `forecast`
 * is null and the screen says so. A made-up denominator is worse than a gap.
 */
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "../db";
import { periods, transactions } from "../schema";
import type { UserId } from "../auth";
import type { TransactionKind } from "../transactions";
import { periodWindow, type PeriodWindow } from "./period-window";
import { incomeForPeriod, type PeriodIncome } from "./income";

export interface MonthTotals {
  weekly: number;
  recurring: number;
  oneOff: number;
  /** All three, which is the figure the screen calls "spent". */
  total: number;
  /** Included in the totals above, and reported separately because it may still change. */
  pending: number;
}

export interface MonthOverview {
  periodId: number;
  label: string;
  window: PeriodWindow | null;
  spent: MonthTotals;
  income: PeriodIncome;
  /** Projected total spend by the last day, or null when the dates aren't known. */
  forecast: number | null;
  /** The working behind `forecast`, so the number can be opened up. */
  forecastBasis: {
    weeklySpentSoFar: number;
    daysElapsed: number;
    daysRemaining: number;
    dailyWeeklyRate: number;
  } | null;
  /** income − forecast. Null whenever either side is unknown. */
  projectedLeft: number | null;
  /** income − spent. Null when income is unknown. */
  leftToday: number | null;
}

export async function monthOverview(
  userId: UserId,
  periodId: number,
  today: Date = new Date()
): Promise<MonthOverview | null> {
  const db = getDb();

  const [period] = await db
    .select({
      id: periods.id,
      label: periods.label,
      startDate: periods.startDate,
      endDate: periods.endDate,
    })
    .from(periods)
    .where(and(eq(periods.id, periodId), eq(periods.userId, userId)));

  // Not this user's period, or no such period. The caller cannot tell which,
  // which is the point.
  if (!period) return null;

  const rows = await db
    .select({
      kind: transactions.kind,
      total: sql<string>`sum(${transactions.amount})`,
      pending: sql<string>`sum(case when ${transactions.pending} then ${transactions.amount} else 0 end)`,
    })
    .from(transactions)
    .innerJoin(periods, eq(periods.id, transactions.periodId))
    .where(and(eq(transactions.periodId, periodId), eq(periods.userId, userId)))
    .groupBy(transactions.kind);

  const byKind = new Map<TransactionKind, number>();
  let pending = 0;
  for (const r of rows) {
    byKind.set(r.kind, Number(r.total ?? 0));
    pending += Number(r.pending ?? 0);
  }

  const weekly = byKind.get("weekly") ?? 0;
  const recurring = byKind.get("recurring") ?? 0;
  const oneOff = byKind.get("one_off") ?? 0;
  const spent: MonthTotals = { weekly, recurring, oneOff, total: weekly + recurring + oneOff, pending };

  const income = await incomeForPeriod(userId, periodId);
  const window = periodWindow(period, today);

  let forecast: number | null = null;
  let forecastBasis: MonthOverview["forecastBasis"] = null;

  if (window) {
    // Before the first day has finished there is no rate to extrapolate from,
    // so the forecast is just what has been spent — an honest "too early to say
    // more" rather than a division by zero dressed up as a projection.
    const dailyWeeklyRate = window.daysElapsed > 0 ? weekly / window.daysElapsed : 0;
    forecast = spent.total + dailyWeeklyRate * window.daysRemaining;
    forecastBasis = {
      weeklySpentSoFar: weekly,
      daysElapsed: window.daysElapsed,
      daysRemaining: window.daysRemaining,
      dailyWeeklyRate,
    };
  }

  return {
    periodId: period.id,
    label: period.label,
    window,
    spent,
    income,
    forecast,
    forecastBasis,
    projectedLeft: income.amount === null || forecast === null ? null : income.amount - forecast,
    leftToday: income.amount === null ? null : income.amount - spent.total,
  };
}
