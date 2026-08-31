/**
 * Screen 04's "short line of Ravel's reasoning" ("Saturday night, so I filed
 * it under Weekend"). There's no stored rationale for a categorisation
 * anywhere in the schema — `transactions` carries `kind`/`category` and
 * nothing that explains why. Rather than fabricate a reason for every
 * transaction (B-8: a claim with no real basis), this only speaks for the
 * one case the example itself demonstrates and that's actually checkable
 * from data the row already has: a weekly transaction filed under Weekend
 * that is in fact dated on a Saturday or Sunday. Every other combination —
 * no date, a different category, a weekday date — says nothing rather than
 * inventing a justification.
 */
import { WEEKLY_CATEGORY_TITLES, type TransactionCategory, type TransactionKind } from "@/lib/transactions";

export function reasoningFor(kind: TransactionKind, category: TransactionCategory | null, occurredOn: string | null): string | null {
  if (kind !== "weekly" || category !== "weekend" || !occurredOn) return null;

  const date = new Date(`${occurredOn}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;

  const day = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
  if (day !== 0 && day !== 6) return null;

  const dayName = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(date);
  return `${dayName}, so I filed it under ${WEEKLY_CATEGORY_TITLES[category]}.`;
}
