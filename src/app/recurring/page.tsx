import { notFound } from "next/navigation";
import { RecurringView } from "@/components/money/RecurringView";
import { formatMonth } from "@/components/money/format";
import { EmptyState } from "@/components/EmptyState";
import {
  listPeriodsMeta,
  monthOverview,
  periodParamValue,
  recurringForPeriod,
  resolvePeriodId,
  type PeriodSearchParams,
} from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function RecurringPage({
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

  const [overview, recurring] = await Promise.all([
    monthOverview(user.id, periodId),
    recurringForPeriod(user.id, periodId),
  ]);
  if (!overview) notFound();

  return (
    <RecurringView
      periodId={periodId}
      monthLabel={overview.window ? formatMonth(overview.window.start) : overview.label}
      recurring={recurring}
    />
  );
}
