/**
 * The home screen's year strip and the Change month grid (09) both need a
 * net position per calendar month. `monthOverview` already computes
 * exactly that for one period; this just fans it out across every period
 * that falls in a given year (by each period's own window, from
 * `period-meta.ts`) and adds them up. No new aggregation rule — the only
 * arithmetic here is "sum the numbers `monthOverview` already returned".
 */
import type { UserId } from "@/lib/auth";
import { monthOverview } from "@/lib/queries";
import type { PeriodMeta } from "./period-meta";

export interface MonthTile {
  monthIndex: number; // 0-11, calendar month
  periodId: number | null;
  /** income − spent for the period in this month. Null when there's no period, or its income is unknown. */
  net: number | null;
}

export interface YearData {
  year: number;
  /** Always 12 entries, Jan..Dec. */
  months: MonthTile[];
  /** Sum of the available months' net. Null when no month in the year has one. */
  netPosition: number | null;
  /** Cumulative net across available months, in calendar order — the year strip's sparkline. */
  sparkline: number[];
}

async function netForPeriod(userId: UserId, periodId: number): Promise<number | null> {
  const overview = await monthOverview(userId, periodId);
  if (!overview || overview.income.amount === null) return null;
  return overview.income.amount - overview.spent.total;
}

export async function buildYearData(userId: UserId, periodsMeta: PeriodMeta[], year: number): Promise<YearData> {
  const inYear = periodsMeta.filter(
    (p): p is PeriodMeta & { window: NonNullable<PeriodMeta["window"]> } =>
      p.window !== null && p.window.start.getUTCFullYear() === year
  );

  const nets = await Promise.all(inYear.map((p) => netForPeriod(userId, p.id)));

  const months: MonthTile[] = Array.from({ length: 12 }, (_, i) => ({ monthIndex: i, periodId: null, net: null }));
  inYear.forEach((p, idx) => {
    months[p.window.start.getUTCMonth()] = { monthIndex: p.window.start.getUTCMonth(), periodId: p.id, net: nets[idx] };
  });

  const available = months.filter((m): m is MonthTile & { net: number } => m.net !== null);
  const netPosition = available.length > 0 ? available.reduce((sum, m) => sum + m.net, 0) : null;

  let cumulative = 0;
  const sparkline = available.map((m) => (cumulative += m.net));

  return { year, months, netPosition, sparkline };
}

/** Every calendar year at least one period's window touches — the range the year stepper can move across. */
export function yearsWithData(periodsMeta: PeriodMeta[]): number[] {
  const years = new Set<number>();
  for (const p of periodsMeta) {
    if (p.window) years.add(p.window.start.getUTCFullYear());
  }
  return [...years].sort((a, b) => a - b);
}
