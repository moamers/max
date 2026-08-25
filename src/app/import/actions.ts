"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { updateTransaction } from "@/lib/store";

export type ImportPlacement = "everyday" | "weekend" | "one_off";

export async function resolveImportedAttention(
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
  if (!ok) throw new Error("Couldn't update this row — it may no longer exist.");
  revalidatePath("/");
  revalidatePath("/review");
  return { ok: true };
}
