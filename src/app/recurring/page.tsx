import { notFound } from "next/navigation";
import { RecurringView } from "@/components/money/RecurringView";
import { formatMonth } from "@/components/money/format";
import { resolveMoneyPeriodId, type MoneySearchParams } from "@/components/money/resolve-period";
import { monthOverview, recurringForPeriod } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<MoneySearchParams>;
}) {
  const user = await requireUser();
  const periodId = await resolveMoneyPeriodId(user.id, await searchParams);
  if (periodId === null) notFound();

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
