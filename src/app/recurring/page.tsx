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
import { recurringCarrySource } from "@/lib/store";

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

  // Only asked when the month is empty — a screen with rows on it has no use
  // for the answer, and this is a read either way. Reading is not copying:
  // nothing is written until the button is pressed.
  const carrySource = recurring.total === 0 && recurring.groups.every((group) => group.items.length === 0)
    ? await recurringCarrySource(user.id, periodId)
    : null;

  return (
    <RecurringView
      periodId={periodId}
      highlightId={highlightIdFrom(sp.highlight)}
      monthLabel={overview.window ? formatMonth(overview.window.start) : overview.label}
      recurring={recurring}
      carrySourceLabel={carrySource?.label ?? null}
    />
  );
}
