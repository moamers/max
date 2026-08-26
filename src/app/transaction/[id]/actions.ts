"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { updateTransaction, deleteTransaction } from "@/lib/store";
import { pathsAffectedBy, transactionHome } from "@/lib/routes";
import { getTransactionDetail } from "./data";
import {
  isValidKindCategory,
  USER_ATTENTION_REASON,
  type TransactionCategory,
  type TransactionKind,
} from "@/lib/transactions";

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
 * Where the caller should go once the write has landed.
 *
 * These actions used to call `redirect()` themselves. A redirect is signalled
 * by throwing NEXT_REDIRECT, and the view awaits the action inside a try/catch
 * — so its own error handler caught the signal and printed "next_redirect" in
 * red above the Save button, a moment before the navigation it was reporting
 * actually happened. Returning the destination keeps the catch for real
 * failures and leaves navigation to the client, which is what Add already did.
 */
export interface WriteResult {
  ok: true;
  /** Navigate here with `router.replace` — see `transactionHome`. */
  next: string;
}

/**
 * Screen 04's Save. Every field is editable except `kind` — the design
 * only shows a category chip, and store.ts's own doc comment for
 * `updateTransaction` describes exactly this: re-filing within the
 * transaction's existing kind, not switching kinds.
 */
export async function saveTransaction(
  id: number,
  kind: TransactionKind,
  periodId: number,
  weekNumber: number | null,
  input: SaveTransactionInput
): Promise<WriteResult> {
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
      ? input.attentionReason ?? USER_ATTENTION_REASON
      : null,
  });

  if (!ok) throw new Error("Couldn't save this transaction — it may no longer exist.");

  // Only the transaction's own page was revalidated before, so a corrected
  // amount left every total that included it stale until something else
  // happened to refresh them.
  revalidatePath(`/transaction/${id}`);
  for (const path of pathsAffectedBy(kind, weekNumber)) revalidatePath(path);

  return { ok: true, next: transactionHome(kind, periodId, weekNumber, id) };
}

export async function removeTransaction(id: number): Promise<WriteResult> {
  const user = await requireUser();

  // Read the row's home *before* deleting it: afterwards there is no period,
  // kind or week to derive one from, which is why this used to fall back to `/`
  // and drop the user into whatever month happened to be current.
  const detail = await getTransactionDetail(user.id, id);
  if (!detail) throw new Error("Couldn't delete this transaction — it may no longer exist.");

  const ok = await deleteTransaction(user.id, id);
  if (!ok) throw new Error("Couldn't delete this transaction — it may no longer exist.");

  revalidatePath(`/transaction/${id}`);
  for (const path of pathsAffectedBy(detail.kind, detail.weekNumber)) revalidatePath(path);

  // No highlight: the row is gone, so there is nothing left to point at.
  return { ok: true, next: transactionHome(detail.kind, detail.periodId, detail.weekNumber) };
}
