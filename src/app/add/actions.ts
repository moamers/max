"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { addTransaction } from "@/lib/store";
import {
  isValidKindCategory,
  USER_ATTENTION_REASON,
  type TransactionCategory,
  type TransactionKind,
} from "@/lib/transactions";

export interface CreateTransactionInput {
  periodId: number;
  kind: TransactionKind;
  category: TransactionCategory | null;
  weekNumber: number | null;
  merchant: string;
  label: string;
  note: string;
  amount: number;
  pending: boolean;
  /**
   * The founder's sheet has an orange flag for "something here is wrong", and
   * that judgement is often made at the moment of writing the row down — an
   * unrecognised card charge, an amount that doesn't look right. The two states
   * are mutually exclusive (schema CHECK `transactions_one_state`).
   */
  needsAttention: boolean;
}

/**
 * Screen 08's "Add it". No `occurredOn` is collected here — the add sheet
 * has no "when" field (only the transaction editor, screen 04, does) — and
 * `transactions.occurred_on` is nullable precisely so a day isn't invented
 * where the product only ever knew a week (schema.ts's own comment).
 */
export async function createTransaction(input: CreateTransactionInput): Promise<{ id: number }> {
  const user = await requireUser();

  if (!(input.amount > 0)) throw new Error("Add an amount before saving.");
  if (!input.merchant.trim()) throw new Error("Add where this went.");
  if (!isValidKindCategory(input.kind, input.category)) throw new Error("Pick a category before saving.");

  const id = await addTransaction(user.id, input.periodId, {
    kind: input.kind,
    category: input.category,
    weekNumber: input.kind === "weekly" ? input.weekNumber : null,
    merchant: input.merchant.trim(),
    note: input.note.trim() || null,
    amount: input.amount,
    label: input.label.trim() || null,
    occurredOn: null,
    pending: input.needsAttention ? false : input.pending,
    needsAttention: input.needsAttention,
    attentionReason: input.needsAttention ? USER_ATTENTION_REASON : null,
  });

  if (id === null) throw new Error("Couldn't save — that period isn't yours.");

  revalidatePath("/");
  if (input.kind === "weekly" && input.weekNumber !== null) {
    revalidatePath(`/week/${input.weekNumber}`);
  }
  return { id };
}
