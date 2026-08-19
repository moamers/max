"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { addTransaction } from "@/lib/store";
import { isValidKindCategory, type TransactionCategory, type TransactionKind } from "@/lib/transactions";

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
    pending: input.pending,
  });

  if (id === null) throw new Error("Couldn't save — that period isn't yours.");

  revalidatePath("/");
  if (input.kind === "weekly" && input.weekNumber !== null) {
    revalidatePath(`/week/${input.weekNumber}`);
  }
  return { id };
}
