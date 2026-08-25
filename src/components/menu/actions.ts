"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { clearUserPeriods } from "@/lib/store";

/** R-19: the destructive boundary is the authenticated user's period tree. */
export async function clearDataAction(): Promise<{ deletedPeriods: number }> {
  const user = await requireUser();
  const deletedPeriods = await clearUserPeriods(user.id);
  revalidatePath("/");
  return { deletedPeriods };
}
