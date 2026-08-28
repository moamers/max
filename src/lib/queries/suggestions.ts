"use server";

import { and, eq, isNotNull, sql } from "drizzle-orm";
import type { UserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { periods, transactions } from "@/lib/schema";
import { getSessionUser } from "@/lib/session";

export interface SuggestionEntry {
  /** D-10: returned exactly as stored; casing and punctuation are user-owned. */
  value: string;
  count: number;
  /** ISO timestamp of the latest transaction/period in which this exact value appeared. */
  mostRecent: string;
}

export interface SuggestionHistory {
  merchants: SuggestionEntry[];
  labels: SuggestionEntry[];
}

/**
 * The model has no transaction-created timestamp. Prefer the transaction's
 * own date, then its period dates, and use the period creation timestamp only
 * when the import supplied no calendar date. These are ISO strings, so their
 * lexical maximum is also their chronological maximum without casting old
 * nullable text columns.
 */
const MOST_RECENT_VALUE = sql<string>`max(coalesce(
  ${transactions.occurredOn}::text,
  ${periods.endDate},
  ${periods.startDate},
  to_char(${periods.createdAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
))`;

async function suggestionsForUser(userId: UserId): Promise<SuggestionHistory> {
  const db = getDb();

  // Two grouped reads inside one Server Action request. Each reaches the
  // transaction through periods.user_id, which is the ownership boundary.
  const [merchantRows, labelRows] = await Promise.all([
    db
      .select({
        value: transactions.merchant,
        count: sql<number>`count(*)::int`,
        mostRecent: MOST_RECENT_VALUE,
      })
      .from(transactions)
      .innerJoin(periods, eq(periods.id, transactions.periodId))
      .where(
        and(
          eq(periods.userId, userId),
          isNotNull(transactions.merchant),
          sql`${transactions.merchant} <> ''`
        )
      )
      .groupBy(transactions.merchant),
    db
      .select({
        value: transactions.label,
        count: sql<number>`count(*)::int`,
        mostRecent: MOST_RECENT_VALUE,
      })
      .from(transactions)
      .innerJoin(periods, eq(periods.id, transactions.periodId))
      .where(
        and(
          eq(periods.userId, userId),
          isNotNull(transactions.label),
          sql`${transactions.label} <> ''`
        )
      )
      .groupBy(transactions.label),
  ]);

  const mapRows = (
    rows: Array<{ value: string | null; count: number; mostRecent: string }>
  ): SuggestionEntry[] =>
    rows.flatMap((row) =>
      row.value === null
        ? []
        : [{
            value: row.value,
            count: Number(row.count),
            mostRecent: /^\d{4}-\d{2}-\d{2}$/.test(row.mostRecent)
              ? `${row.mostRecent}T00:00:00Z`
              : row.mostRecent,
          }]
    );

  return { merchants: mapRows(merchantRows), labels: mapRows(labelRows) };
}

/**
 * Read-only Server Action used by the two client fields. The caller supplies
 * no identity: every invocation re-derives the authenticated UserId from its
 * HttpOnly session before the scoped query runs.
 */
export async function loadSuggestionHistoryAction(): Promise<SuggestionHistory> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");
  return suggestionsForUser(user.id);
}
