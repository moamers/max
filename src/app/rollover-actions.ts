"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { createPeriod } from "@/lib/store";
import { isWholeMondayToSundayPeriod, periodLabel, proposeFirstPeriod } from "@/lib/periods";
import { periodHome } from "@/lib/routes";

/**
 * The destination, returned rather than redirected to.
 *
 * `redirect()` signals by throwing NEXT_REDIRECT. Both callers await this
 * inside a try/catch, so a redirect thrown here is caught by the button's own
 * error handler and rendered to the user as the literal text "next_redirect"
 * in red. The client navigates instead.
 */
export interface StartedPeriod {
  ok: true;
  next: string;
}

async function start(startDate: string, endDate: string): Promise<StartedPeriod> {
  const user = await requireUser();
  // Validated here rather than trusted from the client: these dates arrive as
  // two strings from the browser, and a period that is not whole weeks breaks
  // every week query downstream of it.
  if (!isWholeMondayToSundayPeriod(startDate, endDate)) {
    throw new Error("The period must be four or five whole Monday-to-Sunday weeks.");
  }
  const id = await createPeriod(user.id, {
    startDate,
    endDate,
    label: periodLabel(new Date(`${startDate}T00:00:00Z`), new Date(`${endDate}T00:00:00Z`)),
  });
  revalidatePath("/");
  return { ok: true, next: periodHome(id) };
}

/** One write, on the button press. */
export async function acceptRollover(startDate: string, endDate: string): Promise<StartedPeriod> {
  return start(startDate, endDate);
}

/**
 * The first period for an account that has none (#46).
 *
 * The dates are recomputed here rather than taken from the client: the button
 * only says "do the thing you offered me", and a start date accepted from the
 * browser is a start date anyone can choose. One write, on the button press —
 * never on page load, so opening /add cannot create a month.
 */
export async function startFirstPeriod(): Promise<StartedPeriod> {
  const proposal = proposeFirstPeriod();
  return start(proposal.startDate, proposal.endDate);
}
