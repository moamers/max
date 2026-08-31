import { requireUser } from "@/lib/session";
import { getDefaultMonthlyIncome } from "@/lib/store";
import {
  incomeForPeriod,
  listPeriodsMeta,
  pickCurrentPeriodId,
  type PeriodIncome,
  type PeriodMeta,
} from "@/lib/queries";
import { IncomeView, type IncomeMonthView } from "@/components/goals/IncomeView";

export const dynamic = "force-dynamic";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;

/**
 * A period can cross a calendar boundary. Ravel uses the period's start month
 * everywhere else (Home does too), so this is a stable label rather than an
 * invented calendar-month allocation.
 */
function periodForMonth(periods: PeriodMeta[], monthIndex: number): PeriodMeta | null {
  const matches = periods.filter((period) => period.window?.start.getUTCMonth() === monthIndex);
  return matches.length === 1 ? matches[0] : null;
}

function unavailableReason(periods: PeriodMeta[], monthIndex: number): string | null {
  const count = periods.filter((period) => period.window?.start.getUTCMonth() === monthIndex).length;
  if (count === 0) return "no pay period to set";
  if (count > 1) return "more than one pay period";
  return null;
}

export default async function IncomePage() {
  const user = await requireUser();
  const today = new Date();
  const [defaultIncome, periods] = await Promise.all([getDefaultMonthlyIncome(user.id), listPeriodsMeta(user.id, today)]);
  const currentPeriodId = pickCurrentPeriodId(periods);
  const currentPeriod = periods.find((period) => period.id === currentPeriodId) ?? null;
  const year = currentPeriod?.window?.start.getUTCFullYear() ?? today.getUTCFullYear();
  const yearPeriods = periods.filter((period) => period.window?.start.getUTCFullYear() === year);

  const incomeByPeriod = new Map<number, PeriodIncome>();
  await Promise.all(
    yearPeriods.map(async (period) => {
      incomeByPeriod.set(period.id, await incomeForPeriod(user.id, period.id));
    })
  );

  const months: IncomeMonthView[] = MONTHS.map((name, monthIndex) => {
    const period = periodForMonth(yearPeriods, monthIndex);
    const income = period ? incomeByPeriod.get(period.id) : undefined;
    return {
      monthIndex,
      name,
      periodId: period?.id ?? null,
      amount: income?.amount ?? defaultIncome,
      source: income?.source ?? (defaultIncome === null ? "unknown" : "default"),
      setByUser: income?.setByUser ?? defaultIncome !== null,
      unavailableReason: unavailableReason(yearPeriods, monthIndex),
    };
  });

  return <IncomeView year={year} defaultIncome={defaultIncome} months={months} />;
}
