import { and, eq, inArray, sql } from "drizzle-orm";
import type { UserId } from "../auth";
import { getDb } from "../db";
import { periods, transactions } from "../schema";
import type { TransactionKind } from "../transactions";
import { dominantMonth } from "../periods";
import { incomeForPeriod } from "./income";
import { monthOverview } from "./month";
import type { PeriodMeta } from "./period-meta";

/** Home's calendar-month tile; retained here as the canonical replacement for the old route-local helper. */
export interface MonthTile {
  monthIndex: number;
  periodId: number | null;
  net: number | null;
}

export interface YearData {
  year: number;
  months: MonthTile[];
  netPosition: number | null;
  sparkline: number[];
}

async function netForPeriod(userId: UserId, periodId: number): Promise<number | null> {
  const overview = await monthOverview(userId, periodId);
  if (!overview || overview.income.amount === null) return null;
  return overview.income.amount - overview.spent.total;
}

/**
 * Home screen year strip / month picker behavior, moved without changing its
 * existing one-period-per-calendar-month fallback (A-6 remains open).
 */
export async function buildYearData(
  userId: UserId,
  periodsMeta: PeriodMeta[],
  year: number
): Promise<YearData> {
  const inYear = periodsMeta.filter(
    (period): period is PeriodMeta & { window: NonNullable<PeriodMeta["window"]> } =>
      period.window !== null && period.window.start.getUTCFullYear() === year
  );
  const nets = await Promise.all(inYear.map((period) => netForPeriod(userId, period.id)));
  const months: MonthTile[] = Array.from({ length: 12 }, (_, monthIndex) => ({
    monthIndex,
    periodId: null,
    net: null,
  }));
  inYear.forEach((period, index) => {
    // Same rule the month bar uses, so a period cannot be July at the top of
    // the screen and June on the calendar tile.
    const monthIndex = dominantMonth(period.window.start, period.window.end).getUTCMonth();
    months[monthIndex] = { monthIndex, periodId: period.id, net: nets[index] };
  });
  const available = months.filter((month): month is MonthTile & { net: number } => month.net !== null);
  const netPosition = available.length > 0
    ? available.reduce((sum, month) => sum + month.net, 0)
    : null;
  let cumulative = 0;
  const sparkline = available.map((month) => (cumulative += month.net));
  return { year, months, netPosition, sparkline };
}

export function yearsWithData(periodsMeta: PeriodMeta[]): number[] {
  const years = new Set<number>();
  for (const period of periodsMeta) {
    if (period.window) years.add(period.window.start.getUTCFullYear());
  }
  return [...years].sort((a, b) => a - b);
}

export interface YearPeriodInput {
  periodId: number;
  label: string;
  monthIndex: number;
  income: number | null;
  weekly: number;
  recurring: number;
  oneOff: number;
}

export interface YearMonth {
  monthIndex: number;
  /**
   * False for a month with no imported period. It still appears in the table —
   * a year has twelve rows whether or not they are all filled — but its figures
   * are null rather than zero, and it is excluded from every average.
   *
   * Nothing recorded is not the same claim as nothing spent, and folding the
   * two together would quietly drag every average toward zero.
   */
  present: boolean;
  periodIds: number[];
  periodLabels: string[];
  income: number | null;
  weekly: number;
  recurring: number;
  oneOff: number;
  spent: number;
  position: number | null;
  cumulativePosition: number | null;
}

export interface YearShare {
  key: "recurring" | "weekly" | "oneOff" | "kept";
  label: string;
  amount: number | null;
  /** Percentage of known income. Null when income is unknown or zero. */
  incomePercent: number | null;
  /** Percentage of the stacked 100% share bar. */
  barPercent: number;
  monthlyAverage: number | null;
}

export interface YearKpis {
  best: YearMonth | null;
  worst: YearMonth | null;
  averagePosition: number | null;
  lowPoint: { monthIndex: number; amount: number } | null;
}

export interface YearOverview {
  year: number;
  periodCount: number;
  months: YearMonth[];
  income: number | null;
  spent: { weekly: number; recurring: number; oneOff: number; total: number };
  netPosition: number | null;
  keptPercent: number | null;
  shares: YearShare[];
  kpis: YearKpis;
}

export function hasEnoughYearData(periodCount: number): boolean {
  return periodCount >= 2;
}

/** Year-wide reporting only uses a persisted date; an inferred label year is not provenance (G-1). */
export function periodsInRecordedYear(periodMeta: PeriodMeta[], year: number): PeriodMeta[] {
  return periodMeta.filter(
    (period) => period.recordedStart !== null && period.recordedStart.getUTCFullYear() === year
  );
}

export function yearsWithRecordedData(periodMeta: PeriodMeta[]): number[] {
  return [...new Set(
    periodMeta.flatMap((period) => period.recordedStart ? [period.recordedStart.getUTCFullYear()] : [])
  )].sort((a, b) => a - b);
}

/** Keep stale or guessed query-string years from trapping the year picker on an empty year. */
export function pickRecordedYear(
  requested: string | undefined,
  availableYears: number[],
  fallbackYear: number
): number {
  const parsed = requested === undefined ? Number.NaN : Number(requested);
  if (Number.isInteger(parsed) && availableYears.includes(parsed)) return parsed;
  return availableYears.at(-1) ?? fallbackYear;
}

const SHARE_LABELS: Record<YearShare["key"], string> = {
  recurring: "Recurring",
  weekly: "All weekly",
  oneOff: "One-off",
  kept: "Kept",
};

/**
 * Deterministic year arithmetic, separate from SQL so every stated number can
 * be tested from inspectable period inputs (T-11, B-8).
 */
export function deriveYearOverview(year: number, rows: YearPeriodInput[]): YearOverview {
  const byMonth = new Map<number, YearPeriodInput[]>();
  for (const row of rows) {
    const bucket = byMonth.get(row.monthIndex) ?? [];
    bucket.push(row);
    byMonth.set(row.monthIndex, bucket);
  }

  let cumulative = 0;
  let cumulativeKnown = true;
  const months: YearMonth[] = [...byMonth.entries()]
    .sort(([a], [b]) => a - b)
    .map(([monthIndex, monthRows]) => {
      const weekly = monthRows.reduce((sum, row) => sum + row.weekly, 0);
      const recurring = monthRows.reduce((sum, row) => sum + row.recurring, 0);
      const oneOff = monthRows.reduce((sum, row) => sum + row.oneOff, 0);
      const spent = weekly + recurring + oneOff;
      const incomeKnown = monthRows.every((row) => row.income !== null);
      const income = incomeKnown
        ? monthRows.reduce((sum, row) => sum + (row.income ?? 0), 0)
        : null;
      const position = income === null ? null : income - spent;
      if (position === null) cumulativeKnown = false;
      if (cumulativeKnown) cumulative += position ?? 0;
      return {
        monthIndex,
        present: true,
        periodIds: monthRows.map((row) => row.periodId),
        periodLabels: monthRows.map((row) => row.label),
        income,
        weekly,
        recurring,
        oneOff,
        spent,
        position,
        // A gap cannot be silently jumped: every later cumulative point is unknown.
        cumulativePosition: cumulativeKnown ? cumulative : null,
      };
    });

  // Pad to a full calendar year. The founder's aggregates sheet has a row per
  // period whether or not it is filled in, and an empty row is information —
  // it says "nothing imported for this month", which a missing row does not.
  const byIndex = new Map(months.map((month) => [month.monthIndex, month]));
  const allMonths: YearMonth[] = Array.from({ length: 12 }, (_, monthIndex) =>
    byIndex.get(monthIndex) ?? {
      monthIndex,
      present: false,
      periodIds: [],
      periodLabels: [],
      income: null,
      weekly: 0,
      recurring: 0,
      oneOff: 0,
      spent: 0,
      position: null,
      cumulativePosition: null,
    }
  );

  const weekly = rows.reduce((sum, row) => sum + row.weekly, 0);
  const recurring = rows.reduce((sum, row) => sum + row.recurring, 0);
  const oneOff = rows.reduce((sum, row) => sum + row.oneOff, 0);
  const total = weekly + recurring + oneOff;
  const incomeKnown = rows.length > 0 && rows.every((row) => row.income !== null);
  const income = incomeKnown ? rows.reduce((sum, row) => sum + (row.income ?? 0), 0) : null;
  const netPosition = income === null ? null : income - total;
  const keptPercent = income !== null && income > 0 && netPosition !== null
    ? (netPosition / income) * 100
    : null;

  const amounts: Record<YearShare["key"], number | null> = {
    recurring,
    weekly,
    oneOff,
    kept: netPosition,
  };
  const barAmounts = {
    recurring: Math.max(0, recurring),
    weekly: Math.max(0, weekly),
    oneOff: Math.max(0, oneOff),
    kept: Math.max(0, netPosition ?? 0),
  };
  // When spending is above income there is no positive "kept" segment. The
  // expenditure categories still fill the proportional share bar rather than
  // overflowing it like a budget bar would.
  const barDenominator = Object.values(barAmounts).reduce((sum, amount) => sum + amount, 0);
  // Averages divide by months with data, never by twelve — an unrecorded
  // month is not a month of zero spending.
  const monthCount = Math.max(1, months.length);
  const shares = (Object.keys(SHARE_LABELS) as YearShare["key"][]).map((key) => {
    const amount = amounts[key];
    return {
      key,
      label: SHARE_LABELS[key],
      amount,
      incomePercent: amount !== null && income !== null && income > 0 ? (amount / income) * 100 : null,
      barPercent: barDenominator > 0 ? (barAmounts[key] / barDenominator) * 100 : 0,
      monthlyAverage: amount === null ? null : amount / monthCount,
    };
  });

  const positioned = months.filter((month): month is YearMonth & { position: number } => month.position !== null);
  const best = incomeKnown && positioned.length > 0
    ? positioned.reduce((winner, month) => month.position > winner.position ? month : winner)
    : null;
  const worst = incomeKnown && positioned.length > 0
    ? positioned.reduce((loser, month) => month.position < loser.position ? month : loser)
    : null;
  const averagePosition = incomeKnown && positioned.length > 0
    ? positioned.reduce((sum, month) => sum + month.position, 0) / positioned.length
    : null;
  const cumulativeMonths = months.filter(
    (month): month is YearMonth & { cumulativePosition: number } => month.cumulativePosition !== null
  );
  const lowMonth = incomeKnown && cumulativeMonths.length > 0
    ? cumulativeMonths.reduce((lowest, month) =>
        month.cumulativePosition < lowest.cumulativePosition ? month : lowest)
    : null;

  return {
    year,
    periodCount: rows.length,
    months: allMonths,
    income,
    spent: { weekly, recurring, oneOff, total },
    netPosition,
    keptPercent,
    shares,
    kpis: {
      best,
      worst,
      averagePosition,
      lowPoint: lowMonth
        ? { monthIndex: lowMonth.monthIndex, amount: lowMonth.cumulativePosition }
        : null,
    },
  };
}

/**
 * Screen 07 data. Period membership comes from the canonical metadata query;
 * this function only aggregates owned transactions and income for that set.
 */
export async function yearOverview(
  userId: UserId,
  periodMeta: PeriodMeta[],
  year: number
): Promise<YearOverview> {
  const inYear = periodsInRecordedYear(periodMeta, year);
  const ids = inYear.map((period) => period.id);
  if (ids.length === 0) return deriveYearOverview(year, []);

  const db = getDb();
  const totals = await db
    .select({
      periodId: transactions.periodId,
      kind: transactions.kind,
      total: sql<string>`sum(${transactions.amount})`,
    })
    .from(transactions)
    .innerJoin(periods, eq(periods.id, transactions.periodId))
    .where(and(inArray(transactions.periodId, ids), eq(periods.userId, userId)))
    .groupBy(transactions.periodId, transactions.kind);

  const totalsByPeriod = new Map<number, Map<TransactionKind, number>>();
  for (const total of totals) {
    const kinds = totalsByPeriod.get(total.periodId) ?? new Map<TransactionKind, number>();
    kinds.set(total.kind, Number(total.total ?? 0));
    totalsByPeriod.set(total.periodId, kinds);
  }

  const incomes = await Promise.all(inYear.map((period) => incomeForPeriod(userId, period.id)));
  return deriveYearOverview(
    year,
    inYear.map((period, index) => {
      const kinds = totalsByPeriod.get(period.id);
      return {
        periodId: period.id,
        label: period.label,
        monthIndex: (period.window
          ? dominantMonth(period.window.start, period.window.end)
          : period.recordedStart!
        ).getUTCMonth(),
        income: incomes[index].amount,
        weekly: kinds?.get("weekly") ?? 0,
        recurring: kinds?.get("recurring") ?? 0,
        oneOff: kinds?.get("one_off") ?? 0,
      };
    })
  );
}
