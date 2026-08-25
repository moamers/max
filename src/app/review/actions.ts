"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { confirmAttentionTransaction, updateTransaction } from "@/lib/store";
import type { ImportPlacement } from "@/app/import/actions";

export async function confirmPlacement(transactionId: number): Promise<{ ok: true }> {
  const user = await requireUser();
  const ok = await confirmAttentionTransaction(user.id, transactionId);
  if (!ok) throw new Error("Couldn't confirm this row — it may no longer exist.");
  revalidatePath("/");
  revalidatePath("/review");
  return { ok: true };
}

export async function changePlacement(
  transactionId: number,
  placement: ImportPlacement
): Promise<{ ok: true }> {
  const user = await requireUser();
  const weekly = placement !== "one_off";
  const ok = await updateTransaction(user.id, transactionId, {
    kind: weekly ? "weekly" : "one_off",
    category: placement === "everyday" ? "everyday" : placement === "weekend" ? "weekend" : null,
    weekNumber: weekly ? 1 : null,
    needsAttention: false,
    attentionReason: null,
  });
  if (!ok) throw new Error("Couldn't change this row — it may no longer exist.");
  revalidatePath("/");
  revalidatePath("/review");
  return { ok: true };
}
