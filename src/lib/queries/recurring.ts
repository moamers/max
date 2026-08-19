/**
 * Screens 05 (recurring) and 06 (one-offs) — the two halves of the month that
 * aren't a week's rhythm.
 *
 * Recurring comes back grouped into the four categories the design shows. In
 * V1 an imported month puts every bill in `bills`, because the founder's sheet
 * keeps one flat list and splitting it by merchant name would be a guess made
 * on the user's behalf (the shape of F-3). The other three groups fill up as
 * the user re-files from the transaction editor — so this query returns all
 * four, including the empty ones, rather than hiding the fact that the filing
 * hasn't been done.
 */
import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "../db";
import { periods, transactions } from "../schema";
import type { UserId } from "../auth";
import {
  RECURRING_CATEGORIES,
  RECURRING_CATEGORY_TITLES,
  type RecurringCategory,
} from "../transactions";

export interface TransactionRow {
  id: number;
  merchant: string | null;
  note: string | null;
  label: string | null;
  amount: number;
  occurredOn: string | null;
  weekNumber: number | null;
  pending: boolean;
}

export interface RecurringGroup {
  category: RecurringCategory;
  /** The design's wording (screen 05). */
  title: string;
  total: number;
  items: TransactionRow[];
}

export interface RecurringBreakdown {
  total: number;
  groups: RecurringGroup[];
}

async function itemsOfKind(
  userId: UserId,
  periodId: number,
  kind: "recurring" | "one_off"
) {
  const db = getDb();
  return db
    .select({
      id: transactions.id,
      category: transactions.category,
      merchant: transactions.merchant,
      note: transactions.note,
      label: transactions.label,
      amount: transactions.amount,
      occurredOn: transactions.occurredOn,
      weekNumber: transactions.weekNumber,
      pending: transactions.pending,
    })
    .from(transactions)
    // The join to periods is the ownership check; the period id on its own
    // grants nothing.
    .innerJoin(periods, eq(periods.id, transactions.periodId))
    .where(
      and(
        eq(transactions.periodId, periodId),
        eq(periods.userId, userId),
        eq(transactions.kind, kind)
      )
    )
    .orderBy(desc(transactions.amount));
}

function toRow(r: {
  id: number;
  merchant: string | null;
  note: string | null;
  label: string | null;
  amount: string;
  occurredOn: string | null;
  weekNumber: number | null;
  pending: boolean;
}): TransactionRow {
  return { ...r, amount: Number(r.amount) };
}

export async function recurringForPeriod(
  userId: UserId,
  periodId: number
): Promise<RecurringBreakdown> {
  const rows = await itemsOfKind(userId, periodId, "recurring");

  const byCategory = new Map<RecurringCategory, TransactionRow[]>();
  for (const r of rows) {
    const category = r.category as RecurringCategory;
    const list = byCategory.get(category) ?? [];
    list.push(toRow(r));
    byCategory.set(category, list);
  }

  const groups: RecurringGroup[] = RECURRING_CATEGORIES.map((category) => {
    const items = byCategory.get(category) ?? [];
    return {
      category,
      title: RECURRING_CATEGORY_TITLES[category],
      total: items.reduce((sum, i) => sum + i.amount, 0),
      items,
    };
  });

  return { total: groups.reduce((sum, g) => sum + g.total, 0), groups };
}

export interface OneOffs {
  total: number;
  items: TransactionRow[];
}

/** Screen 06. No categories by design — a one-off that fitted a group wouldn't be one. */
export async function oneOffsForPeriod(userId: UserId, periodId: number): Promise<OneOffs> {
  const rows = await itemsOfKind(userId, periodId, "one_off");
  const items = rows.map(toRow);
  return { total: items.reduce((sum, i) => sum + i.amount, 0), items };
}

/** Cross-month view of what a recurring group costs, for the recurring screen's header. */
export async function recurringTotalsByCategory(
  userId: UserId,
  periodId: number
): Promise<{ category: RecurringCategory; total: number }[]> {
  const db = getDb();
  const rows = await db
    .select({ category: transactions.category, total: sql<string>`sum(${transactions.amount})` })
    .from(transactions)
    .innerJoin(periods, eq(periods.id, transactions.periodId))
    .where(
      and(
        eq(transactions.periodId, periodId),
        eq(periods.userId, userId),
        eq(transactions.kind, "recurring")
      )
    )
    .groupBy(transactions.category);

  return rows.map((r) => ({ category: r.category as RecurringCategory, total: Number(r.total ?? 0) }));
}
