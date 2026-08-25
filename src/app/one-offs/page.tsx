import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { formatDayMonth, formatMonth } from "@/components/money/format";
import { OneOffsView } from "@/components/money/OneOffsView";
import {
  listPeriodsMeta,
  monthOverview,
  oneOffsForPeriod,
  periodParamValue,
  resolvePeriodId,
  type PeriodSearchParams,
} from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function OneOffsPage({
  searchParams,
}: {
  searchParams: Promise<PeriodSearchParams>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const periodId = await resolvePeriodId(user.id, sp);
  if (periodId === null) {
    const periods = await listPeriodsMeta(user.id);
    if (periods.length === 0 && !periodParamValue(sp)) return <EmptyState />;
    notFound();
  }

  const [overview, oneOffs] = await Promise.all([
    monthOverview(user.id, periodId),
    oneOffsForPeriod(user.id, periodId),
  ]);
  if (!overview) notFound();

  return (
    <OneOffsView
      periodId={periodId}
      monthLabel={overview.window ? formatMonth(overview.window.start) : overview.label}
      oneOffs={oneOffs}
      spare={{
        amount: overview.projectedLeft,
        spend: overview.forecast,
        income: overview.income.amount,
        endLabel: overview.window ? formatDayMonth(overview.window.end) : null,
      }}
    />
  );
}
