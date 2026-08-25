"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { updateTransaction, deleteTransaction } from "@/lib/store";
import { isValidKindCategory, type TransactionCategory, type TransactionKind } from "@/lib/transactions";

export interface SaveTransactionInput {
  merchant: string;
  occurredOn: string | null;
  category: TransactionCategory | null;
  label: string;
  note: string;
  amount: number;
  pending: boolean;
  needsAttention: boolean;
  attentionReason: string | null;
}

/**
 * Screen 04's Save. Every field is editable except `kind` — the design
 * only shows a category chip, and store.ts's own doc comment for
 * `updateTransaction` describes exactly this: re-filing within the
 * transaction's existing kind, not switching kinds.
 */
export async function saveTransaction(id: number, kind: TransactionKind, input: SaveTransactionInput): Promise<{ ok: true }> {
  const user = await requireUser();

  if (!(input.amount > 0)) throw new Error("Add an amount before saving.");
  if (!isValidKindCategory(kind, input.category)) throw new Error("Pick a category before saving.");

  const ok = await updateTransaction(user.id, id, {
    merchant: input.merchant.trim() || null,
    occurredOn: input.occurredOn,
    category: input.category,
    label: input.label.trim() || null,
    note: input.note.trim() || null,
    amount: input.amount,
    pending: input.pending,
    needsAttention: input.needsAttention,
    attentionReason: input.needsAttention
      ? input.attentionReason ?? "Marked for a look by you."
      : null,
  });

  if (!ok) throw new Error("Couldn't save this transaction — it may no longer exist.");

  revalidatePath(`/transaction/${id}`);
  return { ok: true };
}

export async function removeTransaction(id: number): Promise<void> {
  const user = await requireUser();
  const ok = await deleteTransaction(user.id, id);
  if (!ok) throw new Error("Couldn't delete this transaction — it may no longer exist.");
  redirect("/");
}
