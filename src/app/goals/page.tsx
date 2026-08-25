import { requireUser } from "@/lib/session";
import { getDefaultMonthlyIncome, listGoals } from "@/lib/store";
import { WEEKLY_CATEGORIES, type WeeklyCategory } from "@/lib/transactions";
import { GoalsView } from "@/components/goals/GoalsView";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const user = await requireUser();
  const [storedGoals, defaultIncome] = await Promise.all([listGoals(user.id), getDefaultMonthlyIncome(user.id)]);
  const initialGoals = Object.fromEntries(WEEKLY_CATEGORIES.map((category) => [category, 0])) as Record<WeeklyCategory, number>;
  for (const goal of storedGoals) initialGoals[goal.category] = goal.weeklyAmount;

  return <GoalsView initialGoals={initialGoals} initialDefaultIncome={defaultIncome} />;
}
