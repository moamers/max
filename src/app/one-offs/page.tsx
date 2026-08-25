import { notFound } from "next/navigation";
import { formatDayMonth, formatMonth } from "@/components/money/format";
import { OneOffsView } from "@/components/money/OneOffsView";
import { resolveMoneyPeriodId, type MoneySearchParams } from "@/components/money/resolve-period";
import { monthOverview, oneOffsForPeriod } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function OneOffsPage({
  searchParams,
}: {
  searchParams: Promise<MoneySearchParams>;
}) {
  const user = await requireUser();
  const periodId = await resolveMoneyPeriodId(user.id, await searchParams);
  if (periodId === null) notFound();

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
