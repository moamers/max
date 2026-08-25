"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { setIncomeForPeriod } from "@/lib/store";
import { moneyInputAmount } from "@/components/goals/logic";

/** Writes only to an owned period; store.ts returns false for a guessed id. */
/**
 * Next signals redirect() and notFound() by throwing a tagged error. Catching
 * everything turns an expired session into "I couldn't save that" and leaves
 * the user stuck on a screen that will never work — so those are re-thrown and
 * only genuine failures are reported.
 */
function rethrowControlFlow(cause: unknown): void {
  const digest = (cause as { digest?: unknown })?.digest;
  if (typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND")) {
    throw cause;
  }
}

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
    rethrowControlFlow(cause);
    return { ok: false, message: cause instanceof Error ? cause.message : String(cause) };
  }
}
