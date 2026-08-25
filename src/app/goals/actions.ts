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

export async function setGoalAction(category: WeeklyCategory, rawAmount: number): Promise<void> {
  const user = await requireUser();
  if (!isWeeklyCategory(category)) throw new Error("That goal isn't available.");
  await setGoal(user.id, category, moneyInputAmount(rawAmount));
  refreshIncomeSurfaces();
}

export async function setDefaultIncomeAction(rawAmount: number): Promise<void> {
  const user = await requireUser();
  await setDefaultMonthlyIncome(user.id, moneyInputAmount(rawAmount));
  refreshIncomeSurfaces();
}
