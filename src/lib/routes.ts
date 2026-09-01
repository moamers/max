/**
 * Every destination in the app, and the one rule they all obey: a link into a
 * screen says which period it means.
 *
 * The module started as "where a transaction lives" and now also answers where
 * the bottom nav's four items go, because those are the same question asked
 * twice. Building a URL by hand is how the period gets dropped; asking here is
 * how it doesn't. `period-travels-with-the-link.test.ts` enforces both ends —
 * screens must come here, and what comes back must name the period.
 *
 * ---
 *
 * Where a transaction lives.
 *
 * Adding, editing and deleting all used to end at `/` with no period, so a
 * change made inside July finished by showing you August. The month you were
 * working in was thrown away by the navigation, not by the data.
 *
 * The destination is derived from the transaction itself rather than from
 * browser history, so it survives a refresh and is still right after a delete,
 * when there is no "back" to return to. It also happens to be exactly where the
 * user came from: the three links into the transaction editor are the week
 * screen (weekly), Recurring and One-offs — the same three screens this
 * function returns.
 */
import type { PeriodWindow } from "./queries/period-window";
import type { TransactionKind } from "./transactions";

/**
 * The month view. Home *is* the month, so this is also the bottom nav's
 * "Month" destination.
 *
 * `null` is the empty account: no period exists to name. That is a different
 * fact from forgetting to name one, and it is the only case in which a
 * period-scoped link may leave the param off.
 */
export function periodHome(periodId: number | null): string {
  return periodId === null ? "/" : `/?period=${periodId}`;
}

/**
 * One week of one period. "Week 2" is week 2 of *something*, and the something
 * is never recoverable from the path alone — see the header of
 * `period-travels-with-the-link.test.ts` for what that cost.
 */
export function weekHome(weekNumber: number, periodId: number | null): string {
  return periodId === null ? `/week/${weekNumber}` : `/week/${weekNumber}?period=${periodId}`;
}

/**
 * The year round-up. It shows no single period's figures, so the period rides
 * along only as a return address: without it, the nav's Week and Month items
 * on that screen lead back to whichever month is current rather than the one
 * the user came from. That is #49 with a longer fuse — nothing looks wrong
 * until you navigate back.
 */
export function yearHome(periodId: number | null, year?: number): string {
  const params = [
    ...(year === undefined ? [] : [`year=${year}`]),
    ...(periodId === null ? [] : [`period=${periodId}`]),
  ];
  return params.length === 0 ? "/year" : `/year?${params.join("&")}`;
}

/**
 * Settings — the menu, now that it is a screen rather than a drawer over home.
 *
 * It carries `?period=` for the same single reason `/year` does: it renders
 * nothing that belongs to a period, but it is reached *from* a month and the
 * nav it carries offers Week and Month, so a trip through Settings would
 * otherwise re-pick the current month on the way out. The value is validated
 * against the user's own periods server-side, so a stale id falls back instead
 * of propagating.
 */
export function settingsHome(periodId: number | null): string {
  return periodId === null ? "/settings" : `/settings?period=${periodId}`;
}

/**
 * Which week of a period today falls in — the nav's "Week" target.
 *
 * "This week" is the current week of the *selected* period, never today's
 * calendar week: with July selected in September no week is live, and the
 * honest answer is that period's first week rather than a number borrowed from
 * the calendar. So week 1 is returned for a period that has ended, one that
 * has not started, and one whose dates could not be established at all.
 *
 * Agrees by construction with `buildWeekViews`' `isLive` flag while a period
 * is running: weeks are seven-day blocks measured from `window.start`, so the
 * live one is `ceil(daysElapsed / 7)`.
 */
export function currentWeekOf(window: PeriodWindow | null): number {
  if (!window) return 1;
  if (window.complete || window.daysElapsed <= 0) return 1;
  return Math.max(1, Math.ceil(window.daysElapsed / 7));
}

/**
 * `highlightId` names the row that was just written, so the screen can mark it.
 * Lists are ordered biggest-amount-first, so a saved row lands wherever its
 * amount falls — without this, "it worked" and "I can see it worked" are not
 * the same thing. Omitted after a delete: there is no row left to point at.
 */
export function transactionHome(
  kind: TransactionKind,
  periodId: number,
  weekNumber: number | null,
  highlightId?: number
): string {
  const mark = highlightId === undefined ? "" : `&highlight=${highlightId}`;
  if (kind === "recurring") return `/recurring?period=${periodId}${mark}`;
  if (kind === "one_off") return `/one-offs?period=${periodId}${mark}`;
  // A weekly row with no week number has no week screen to go back to — the
  // month is still the right place to land, and it is still *their* month.
  if (weekNumber === null) return `${periodHome(periodId)}${mark}`;
  return `${weekHome(weekNumber, periodId)}${mark}`;
}

/** Reads `?highlight=` back, ignoring anything that isn't a real row id. */
export function highlightIdFrom(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Every screen whose figures include this transaction. Revalidated together
 * after a write, so returning to any of them shows the change rather than a
 * cached total that disagrees with the row the user just edited.
 */
export function pathsAffectedBy(kind: TransactionKind, weekNumber: number | null): string[] {
  const paths = ["/", "/year"];
  if (kind === "recurring") paths.push("/recurring");
  else if (kind === "one_off") paths.push("/one-offs");
  else if (weekNumber !== null) paths.push(`/week/${weekNumber}`);
  return paths;
}

/**
 * What a sheet's back chevron means: dismiss to the screen this sheet opened
 * over — not "browser back".
 *
 * `router.back()` looked equivalent and mostly behaved, until a write landed a
 * second entry for the same screen on the stack (add from Recurring, save,
 * replace back onto Recurring) and Back started taking two presses to reach the
 * dashboard. History depth is not the product's concern; the parent screen is,
 * and it is always known:
 *
 *   week / recurring / one-offs  ->  the dashboard, in the same period
 *   a transaction                ->  the list it is filed in
 *   add                          ->  the screen the + was pressed on
 *
 * That is not a guess. These sheets have exactly one entry point each — the
 * dashboard links to the three lists, the three lists link to a transaction,
 * and + is pressed from a list — so the derived parent is also the real origin.
 */
export function sheetParent(periodId: number): string {
  return periodHome(periodId);
}
