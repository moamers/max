"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { setDefaultMonthlyIncome, setGoal } from "@/lib/store";
import { isWeeklyCategory, type WeeklyCategory } from "@/lib/transactions";
import { moneyInputAmount } from "@/components/goals/logic";

function refreshIncomeSurfaces() {
  // Only the home screen renders these figures. /goals and /income are
  // force-dynamic, so revalidating them bought nothing and cost a round trip.
  revalidatePath("/");
}

/**
 * These return a result rather than throwing.
 *
 * Next redacts server-action errors in production down to a digest, so a
 * failure reached the user as "I couldn't save that" and reached the logs as a
 * number — which left the actual cause un-diagnosable from outside. Returning
 * the reason means the screen can say what went wrong, and so can we.
 */
export type SaveResult = { ok: true } | { ok: false; message: string };

function failed(cause: unknown): SaveResult {
  const message = cause instanceof Error ? cause.message : String(cause);
  return { ok: false, message };
}

export async function setGoalAction(category: WeeklyCategory, rawAmount: number): Promise<SaveResult> {
  try {
    const user = await requireUser();
    if (!isWeeklyCategory(category)) return { ok: false, message: "That goal isn't available." };
    await setGoal(user.id, category, moneyInputAmount(rawAmount));
    refreshIncomeSurfaces();
    return { ok: true };
  } catch (cause) {
    return failed(cause);
  }
}

export async function setDefaultIncomeAction(rawAmount: number): Promise<SaveResult> {
  try {
    const user = await requireUser();
    await setDefaultMonthlyIncome(user.id, moneyInputAmount(rawAmount));
    refreshIncomeSurfaces();
    return { ok: true };
  } catch (cause) {
    return failed(cause);
  }
}
