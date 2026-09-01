"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { createPeriod } from "@/lib/store";
import { isWholeMondayToSundayPeriod, periodHasEnded, periodLabel, proposeFirstPeriod } from "@/lib/periods";
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
  /** How many recurring rows came across with the month, so the screen can say. */
  copied: number;
}

async function start(
  startDate: string,
  endDate: string,
  copyRecurring: boolean
): Promise<StartedPeriod> {
  const user = await requireUser();
  // Validated here rather than trusted from the client: these dates arrive as
  // two strings from the browser, and a period that is not whole weeks breaks
  // every week query downstream of it.
  if (!isWholeMondayToSundayPeriod(startDate, endDate)) {
    throw new Error("The period must be four or five whole Monday-to-Sunday weeks.");
  }
  // Never a month that is already over. Back-filling months nobody recorded
  // anything in renders a stretch of £0 spending as though it were real — a
  // number the user cannot trace back to anything they did.
  if (periodHasEnded(endDate)) {
    throw new Error("That month has already finished, so there is nothing to start.");
  }
  const { id, carried } = await createPeriod(
    user.id,
    {
      startDate,
      endDate,
      label: periodLabel(new Date(`${startDate}T00:00:00Z`), new Date(`${endDate}T00:00:00Z`)),
    },
    { copyRecurring }
  );
  // One revalidation of each affected route, not one per row written: /
  // re-runs the whole home screen's queries, and doing that in a loop is what
  // took production down before.
  revalidatePath("/");
  if (carried.copied > 0) {
    revalidatePath("/recurring");
    revalidatePath("/year");
  }
  return { ok: true, next: periodHome(id), copied: carried.copied };
}

/**
 * One write, on the button press. `copyRecurring` is the checkbox on the
 * proposal — checked by default, because choosing the recurring kind is already
 * the claim that these happen every month.
 */
export async function acceptRollover(
  startDate: string,
  endDate: string,
  copyRecurring: boolean
): Promise<StartedPeriod> {
  return start(startDate, endDate, copyRecurring);
}

/**
 * The first period for an account that has none (#46).
 *
 * The dates are recomputed here rather than taken from the client: the button
 * only says "do the thing you offered me", and a start date accepted from the
 * browser is a start date anyone can choose. One write, on the button press —
 * never on page load, so opening /add cannot create a month.
 *
 * No carry: this is the first month the account has, so there is no previous
 * one to copy from.
 */
export async function startFirstPeriod(): Promise<StartedPeriod> {
  const proposal = proposeFirstPeriod();
  return start(proposal.startDate, proposal.endDate, false);
}
