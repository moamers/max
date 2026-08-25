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

export function transactionHome(
  kind: TransactionKind,
  periodId: number,
  weekNumber: number | null
): string {
  if (kind === "recurring") return `/recurring?period=${periodId}`;
  if (kind === "one_off") return `/one-offs?period=${periodId}`;
  // A weekly row with no week number has no week screen to go back to — the
  // month is still the right place to land, and it is still *their* month.
  if (weekNumber === null) return periodHome(periodId);
  return `/week/${weekNumber}?period=${periodId}`;
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
