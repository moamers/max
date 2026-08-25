"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { setIncomeForPeriod } from "@/lib/store";
import { moneyInputAmount } from "@/components/goals/logic";

/** Writes only to an owned period; store.ts returns false for a guessed id. */
export type SaveResult = { ok: true } | { ok: false; message: string };

export async function setIncomeForPeriodAction(periodId: number, rawAmount: number): Promise<SaveResult> {
  try {
    const user = await requireUser();
    if (!Number.isInteger(periodId) || periodId < 1) return { ok: false, message: "That month isn't available." };
    const saved = await setIncomeForPeriod(user.id, periodId, moneyInputAmount(rawAmount));
    if (!saved) return { ok: false, message: "That month isn't available." };
  // Only the home screen renders these figures. /goals and /income are
  // force-dynamic, so revalidating them bought nothing and cost a round trip.
    revalidatePath("/");
    return { ok: true };
  } catch (cause) {
    return { ok: false, message: cause instanceof Error ? cause.message : String(cause) };
  }
}
