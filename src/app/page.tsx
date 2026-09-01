import { requireUser } from "@/lib/session";
import {
  monthOverview,
  weeklyBreakdown,
  recurringForPeriod,
  oneOffsForPeriod,
  listPeriodsMeta,
  pickCurrentPeriodId,
  findPeriod,
} from "@/lib/queries";
import { buildYearData, yearsWithData, type YearData } from "@/lib/queries/year";
import { userHasRecurring } from "@/lib/store";
import { HomeScreen } from "@/components/home/HomeScreen";
import { EmptyState } from "@/components/EmptyState";
import { buildWeekViews } from "@/components/home/derive";
import { dominantMonth, formatDayMonth, monthAbbr, monthName, weekCounterLabel } from "@/components/home/format";
import type { HomeData, MonthTileView, PeriodOptionView, YearView } from "@/components/home/types";
import { isoDate, proposeNextPeriod } from "@/lib/periods";

export const dynamic = "force-dynamic";

function toYearView(data: YearData, currentPeriodId: number, attentionByPeriod: ReadonlyMap<number, boolean>): YearView {
  const months: MonthTileView[] = data.months.map((m) => ({
    monthIndex: m.monthIndex,
    monthLabel: monthAbbr(m.monthIndex),
    periodId: m.periodId,
    net: m.net,
    isCurrent: m.periodId !== null && m.periodId === currentPeriodId,
    hasAttention: m.periodId !== null && (attentionByPeriod.get(m.periodId) ?? false),
  }));
  return { year: data.year, months, netPosition: data.netPosition, sparkline: data.sparkline };
}

export default async function HomePage(props: PageProps<"/">) {
  // Auth boundary: no valid session redirects to /login (README screen 02
  // is the app's base screen, so every render below is scoped to this user).
  const user = await requireUser();
  const today = new Date();

  const periodsMeta = await listPeriodsMeta(user.id, today);
  if (periodsMeta.length === 0) {
    return <EmptyState />;
  }

  const currentPeriodId = pickCurrentPeriodId(periodsMeta);
  if (currentPeriodId === null) {
    return <EmptyState />;
  }

  const searchParams = await props.searchParams;
  const requestedRaw = searchParams.period;
  const requestedId = typeof requestedRaw === "string" ? Number(requestedRaw) : NaN;
  const selected =
    findPeriod(periodsMeta, Number.isInteger(requestedId) ? requestedId : null) ??
    findPeriod(periodsMeta, currentPeriodId);

  // Only ever null if `currentPeriodId` itself weren't in `periodsMeta`, which
  // can't happen — it was picked from that same list.
  if (!selected) return <EmptyState />;

  const [overview, weeklyRows, recurring, oneOffs] = await Promise.all([
    monthOverview(user.id, selected.id, today),
    weeklyBreakdown(user.id, selected.id),
    recurringForPeriod(user.id, selected.id),
    oneOffsForPeriod(user.id, selected.id),
  ]);

  // A period this same query just listed for this same user failing to
  // resolve would mean the two reads disagreed mid-request — treat it the
  // same as "nothing to show" rather than crash on a null overview.
  if (!overview) return <EmptyState />;

  const window = overview.window;
  const { weeks, totalBudget, currentWeekNumber } = buildWeekViews(weeklyRows, window, today);

  const dataYears = yearsWithData(periodsMeta);
  const selectedYear = window ? window.start.getUTCFullYear() : today.getUTCFullYear();
  const yearSpan = new Set([...dataYears, selectedYear]);
  const minYear = Math.min(...yearSpan) - 1;
  const maxYear = Math.max(...yearSpan) + 1;

  const yearsByValue: Record<number, YearView> = {};
  const attentionByPeriod = new Map(periodsMeta.map((period) => [period.id, Boolean(period.hasAttention)]));
  for (let y = minYear; y <= maxYear; y++) {
    const yearData = await buildYearData(user.id, periodsMeta, y);
    yearsByValue[y] = toYearView(yearData, currentPeriodId, attentionByPeriod);
  }

  const periodOptions: PeriodOptionView[] = periodsMeta.map((p) => ({
    id: p.id,
    monthLabel: p.window ? monthName(dominantMonth(p.window.start, p.window.end)) : p.label,
  }));

  const monthLabel = window ? monthName(dominantMonth(window.start, window.end)) : selected.label;

  const latestDated = periodsMeta
    .filter((period) => period.window !== null)
    .reduce<typeof periodsMeta[number] | null>((latest, period) => {
      if (!period.window) return latest;
      if (!latest?.window || period.window.end > latest.window.end) return period;
      return latest;
    }, null);
  const next = latestDated?.window?.complete ? proposeNextPeriod(isoDate(latestDated.window.end)) : null;
  const nextStartMs = next ? new Date(`${next.startDate}T00:00:00Z`).getTime() : 0;
  // Only asked when a month is actually being offered, so the ordinary render
  // of Home costs nothing extra. The proposed month starts after every period
  // this account owns, so any recurring row anywhere is a row it could copy.
  const rollover = next
    ? {
        startDate: next.startDate,
        fourWeekEnd: isoDate(new Date(nextStartMs + 27 * 86_400_000)),
        fiveWeekEnd: isoDate(new Date(nextStartMs + 34 * 86_400_000)),
        proposedWeeks: next.weekCount,
        canCopyRecurring: await userHasRecurring(user.id),
      }
    : null;

  const data: HomeData = {
    monthLabel,
    todayLabel: formatDayMonth(today),
    weekCounter: weekCounterLabel(currentWeekNumber, weeks.length),
    hero: {
      monthName: monthLabel,
      forecastDetail: overview.forecastBasis
        ? { weeklyRemaining: overview.forecastBasis.weeklyRemaining, leftToday: overview.leftToday }
        : undefined,
      endOfMonthLabel: window ? formatDayMonth(window.end) : "",
      daysRemaining: window?.daysRemaining ?? 0,
      today: { spare: overview.leftToday, spend: overview.spent.total },
      forecast: { spare: overview.projectedLeft, spend: overview.forecast },
      income: overview.income.amount,
      spentByKind: {
        weekly: overview.spent.weekly,
        recurring: overview.spent.recurring,
        oneOff: overview.spent.oneOff,
      },
    },
    weeks,
    weeksSummary: {
      left: totalBudget === null ? null : totalBudget - overview.spent.weekly,
      spent: overview.spent.weekly,
      budget: totalBudget,
    },
    recurring,
    oneOffs,
    year: yearsByValue[selectedYear],
    yearsByValue,
    yearBounds: { min: minYear, max: maxYear },
    currentPeriodId,
    selectedPeriodId: selected.id,
    periodOptions,
    rollover,
  };

  // The brand preference is no longer read here: the theme switch moved to
  // `/settings` with the rest of the menu, and that route reads the cookies
  // itself. Home is the app's most-rendered screen, so a read it no longer
  // needs is a read it should not do.
  return <HomeScreen data={data} />;
}
