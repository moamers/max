"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { copyRecurringFromLastMonth } from "@/lib/store";

export type CopyRecurringResult =
  | { ok: true; copied: number; sourceLabel: string | null }
  | { ok: false; message: string };

/**
 * Next signals redirect() and notFound() by throwing a tagged error. Catching
 * everything turns an expired session into "I couldn't do that" and leaves the
 * user on a screen that will never work, so those are re-thrown.
 */
function rethrowControlFlow(cause: unknown): void {
  const digest = (cause as { digest?: unknown })?.digest;
  if (typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND")) {
    throw cause;
  }
}

/**
 * "Copy from last month" on an empty recurring screen.
 *
 * **One press. One server action. One database transaction. One multi-row
 * insert**, however many bills there are — never one insert per row. The write
 * happens here, on the press, and nowhere near a render.
 *
 * Idempotent: the copy is refused outright for a month that already holds a
 * recurring row, so a double press cannot double the bills.
 */
export async function copyRecurringAction(periodId: number): Promise<CopyRecurringResult> {
  try {
    const user = await requireUser();
    if (!Number.isInteger(periodId) || periodId <= 0) {
      return { ok: false, message: "That month isn't one I can find." };
    }
    const carried = await copyRecurringFromLastMonth(user.id, periodId);
    if (carried.copied > 0) {
      // Each affected route once, not once per row: revalidating "/" re-runs
      // the whole home screen's queries.
      for (const path of ["/", "/recurring", "/year"]) revalidatePath(path);
    }
    return { ok: true, copied: carried.copied, sourceLabel: carried.sourceLabel };
  } catch (cause) {
    rethrowControlFlow(cause);
    return { ok: false, message: cause instanceof Error ? cause.message : String(cause) };
  }
}
