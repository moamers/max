/**
 * Reads a single transaction by id, scoped to its owner.
 *
 * Nothing in `src/lib/queries` or `src/lib/store` does this: every existing
 * read is period-scoped (a list for one `periodId`), and `LineItemRow` (the
 * closest shape) omits `raw_import`, which screen 04 needs to show ("the
 * raw imported bank string in mono"). This mirrors, read-only, the exact
 * ownership join `updateTransaction`/`deleteTransaction` in `src/lib/store.ts`
 * already use — `transactions` -> `periods` -> `periods.user_id` — rather
 * than inventing a different scoping rule.
 */
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { periods, transactions } from "@/lib/schema";
import type { UserId } from "@/lib/auth";
import type { TransactionCategory, TransactionKind } from "@/lib/transactions";

export interface TransactionDetail {
  id: number;
  periodId: number;
  periodLabel: string;
  kind: TransactionKind;
  category: TransactionCategory | null;
  weekNumber: number | null;
  merchant: string | null;
  note: string | null;
  amount: number;
  label: string | null;
  occurredOn: string | null;
  pending: boolean;
  needsAttention: boolean;
  attentionReason: string | null;
  rawImport: string | null;
}

export async function getTransactionDetail(userId: UserId, id: number): Promise<TransactionDetail | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: transactions.id,
      periodId: transactions.periodId,
      periodLabel: periods.label,
      kind: transactions.kind,
      category: transactions.category,
      weekNumber: transactions.weekNumber,
      merchant: transactions.merchant,
      note: transactions.note,
      amount: transactions.amount,
      label: transactions.label,
      occurredOn: transactions.occurredOn,
      pending: transactions.pending,
      needsAttention: transactions.needsAttention,
      attentionReason: transactions.attentionReason,
      rawImport: transactions.rawImport,
    })
    .from(transactions)
    .innerJoin(periods, eq(periods.id, transactions.periodId))
    .where(and(eq(transactions.id, id), eq(periods.userId, userId)));

  if (!row) return null;
  return { ...row, amount: Number(row.amount) };
}
