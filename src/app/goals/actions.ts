"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { setDefaultMonthlyIncome, setGoal } from "@/lib/store";
import { isWeeklyCategory, type WeeklyCategory } from "@/lib/transactions";
import { moneyInputAmount } from "@/components/goals/logic";

function refreshIncomeSurfaces() {
  revalidatePath("/");
  revalidatePath("/goals");
  revalidatePath("/income");
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
