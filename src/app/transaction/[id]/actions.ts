"use server";

import { redirect, RedirectType } from "next/navigation";
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
): Promise<never> {
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

  // `replace`, not the Server Action default of `push`: the editor we are
  // leaving must not stay on the history stack, or Back returns to a screen
  // for a row the user has finished with — and after a delete, to a row that
  // no longer exists, which renders as a bare 404.
  redirect(transactionHome(kind, periodId, weekNumber, id), RedirectType.replace);
}

export async function removeTransaction(id: number): Promise<never> {
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

  // See saveTransaction: Back must not land on the deleted row's page.
  redirect(transactionHome(detail.kind, detail.periodId, detail.weekNumber), RedirectType.replace);
}
