/**
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
import type { TransactionKind } from "./transactions";

export function periodHome(periodId: number): string {
  return `/?period=${periodId}`;
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
  return `/week/${weekNumber}?period=${periodId}${mark}`;
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
