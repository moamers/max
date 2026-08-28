import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { resolvePeriodId } from "@/lib/queries";
import {
  isTransactionKind,
  isRecurringCategory,
  isWeeklyCategory,
  type TransactionCategory,
  type TransactionKind,
} from "@/lib/transactions";
import { AddView } from "./AddView";
import { resolveInitialAmount } from "./prefill";

type SearchParams = { [key: string]: string | string[] | undefined };

function single(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function resolveKind(searchParams: SearchParams): TransactionKind {
  const raw = single(searchParams.kind);
  if (raw && isTransactionKind(raw)) return raw;
  // A `week` param with no explicit kind implies weekly (the only kind that carries one).
  if (single(searchParams.week)) return "weekly";
  return "weekly";
}

function resolveCategory(kind: TransactionKind, searchParams: SearchParams): TransactionCategory | null {
  const raw = single(searchParams.category);
  if (!raw) return null;
  if (kind === "weekly" && isWeeklyCategory(raw)) return raw;
  if (kind === "recurring" && isRecurringCategory(raw)) return raw;
  return null;
}

function resolveWeekNumber(searchParams: SearchParams): number | null {
  const raw = single(searchParams.week);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

export default async function AddPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;

  const periodId = await resolvePeriodId(user.id, sp);
  if (periodId === null) notFound();

  const kind = resolveKind(sp);

  return (
    <AddView
      periodId={periodId}
      initialKind={kind}
      initialCategory={resolveCategory(kind, sp)}
      initialWeekNumber={resolveWeekNumber(sp)}
      initialWhere={single(sp.where) ?? ""}
      initialLabel={single(sp.label) ?? ""}
      initialAmount={resolveInitialAmount(sp)}
    />
  );
}
