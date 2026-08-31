"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { addTransaction } from "@/lib/store";
import { pathsAffectedBy } from "@/lib/routes";
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
  occurredOn: string | null;
  pending: boolean;
  /**
   * The founder's sheet has an orange flag for "something here is wrong", and
   * that judgement is often made at the moment of writing the row down — an
   * unrecognised card charge, an amount that doesn't look right. The two states
   * are mutually exclusive (schema CHECK `transactions_one_state`).
   */
  needsAttention: boolean;
  attentionReason: string | null;
  rawImport: string | null;
}

function validDateOrNull(value: string | null): boolean {
  if (value === null) return true;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toISOString().slice(0, 10) === value;
}

/**
 * Screen 08's "Add it". Screenshot capture may supply a date that is visibly
 * present; otherwise `occurredOn` stays null rather than inventing a day from
 * the period or week.
 */
export async function createTransaction(input: CreateTransactionInput): Promise<{ id: number }> {
  const user = await requireUser();

  if (!(input.amount > 0)) throw new Error("Add an amount before saving.");
  if (!input.merchant.trim()) throw new Error("Add where this went.");
  if (!isValidKindCategory(input.kind, input.category)) throw new Error("Pick a category before saving.");
  if (!validDateOrNull(input.occurredOn)) throw new Error("Check the date before saving.");
  if (input.rawImport && input.rawImport.length > 2_000) throw new Error("The source text is longer than Ravel can keep.");
  if (input.attentionReason && input.attentionReason.length > 1_000) throw new Error("The note about this row is longer than Ravel can keep.");

  const id = await addTransaction(user.id, input.periodId, {
    kind: input.kind,
    category: input.category,
    weekNumber: input.kind === "weekly" ? input.weekNumber : null,
    // D-10: what the user or source wrote is stored verbatim. Validation may
    // inspect whitespace, but persistence does not rewrite their words.
    merchant: input.merchant,
    note: input.note.trim() || null,
    amount: input.amount,
    label: input.label || null,
    occurredOn: input.occurredOn,
    pending: input.needsAttention ? false : input.pending,
    needsAttention: input.needsAttention,
    attentionReason: input.needsAttention
      ? input.attentionReason ?? USER_ATTENTION_REASON
      : null,
    rawImport: input.rawImport,
  });

  if (id === null) throw new Error("Couldn't save — that period isn't yours.");

  for (const path of pathsAffectedBy(input.kind, input.weekNumber)) revalidatePath(path);
  return { id };
}
