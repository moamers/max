import { notFound } from "next/navigation";
import { RecurringView } from "@/components/money/RecurringView";
import { formatMonth } from "@/components/money/format";
import { highlightIdFrom } from "@/lib/routes";
import { EmptyState } from "@/components/EmptyState";
import {
  monthOverview,
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
  // `resolvePeriodId` returns null only when the account owns no periods at
  // all — an unrecognised ?period= falls back to the current one rather than
  // failing. So this is "nothing here yet", never "wrong id", and a stale
  // ?period=5 in a bookmark no longer 404s an empty account (#46).
  if (periodId === null) return <EmptyState />;

  const [overview, recurring] = await Promise.all([
    monthOverview(user.id, periodId),
    recurringForPeriod(user.id, periodId),
  ]);
  if (!overview) notFound();

  return (
    <RecurringView
      periodId={periodId}
      highlightId={highlightIdFrom(sp.highlight)}
      monthLabel={overview.window ? formatMonth(overview.window.start) : overview.label}
      recurring={recurring}
    />
  );
}
