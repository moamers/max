"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { createPeriod } from "@/lib/store";
import { isWholeMondayToSundayPeriod, periodLabel } from "@/lib/periods";

export async function acceptRollover(startDate: string, endDate: string): Promise<void> {
  const user = await requireUser();
  if (!isWholeMondayToSundayPeriod(startDate, endDate)) {
    throw new Error("The period must be four or five whole Monday-to-Sunday weeks.");
  }
  const id = await createPeriod(user.id, {
    startDate,
    endDate,
    label: periodLabel(new Date(`${startDate}T00:00:00Z`), new Date(`${endDate}T00:00:00Z`)),
  });
  revalidatePath("/");
  redirect(`/?period=${id}`);
}
