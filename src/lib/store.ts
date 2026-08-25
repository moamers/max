/**
 * Every read and write of financial data goes through this module, and every
 * exported function takes a `UserId` as its first argument. That is the whole
 * isolation model:
 *
 *  - `periods.user_id` is the ownership column for everything hanging off a
 *    month: `transactions`, `budgets` and `period_summaries` inherit scope by
 *    joining back to `periods`, so there is one predicate to get right rather
 *    than four. `goals` and `income_months` hang off the user directly and
 *    carry `user_id` themselves; every statement below filters on it.
 *  - `UserId` is a branded type (see `auth.ts`). A call that omits the scope,
 *    or passes some other string, is a compile error — not a runtime check that
 *    a future refactor can quietly drop.
 *  - There is no unscoped variant of any of these functions. Not exported,
 *    not private, not "just for the admin view". If one is ever added, this
 *    comment is the thing that should have stopped it.
 */
import { eq, and, sql, desc, asc, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { periods, transactions, budgets, periodSummaries, goals, incomeMonths, users } from "./schema";
import { ParsedPeriod, summarizePeriod } from "./parser";
import type { UserId } from "./auth";
import {
  SECTION_MAPPING,
  sectionForKindCategory,
  type TransactionKind,
  type TransactionCategory,
  type WeeklyCategory,
} from "./transactions";

/**
 * A few reads below still speak the spreadsheet's vocabulary — `section`,
 * `description`, `tag` — because the current dashboard renders it. The columns
 * underneath are the V1 ones; the mapping back is `sectionForKindCategory`,
 * which is the exact inverse of the mapping migration 0004 applied. Nothing is
 * inferred on the way back, and when the V1 screens land these can go.
 */
function sectionOf(kind: string, category: string | null): string {
  return sectionForKindCategory(kind, category) ?? kind;
}

export async function savePeriod(
  userId: UserId,
  parsed: ParsedPeriod,
  sourceFilename: string
): Promise<number> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const incomeStr = parsed.income !== null ? parsed.income.toString() : null;

    // Upsert on (user_id, label): a re-upload replaces *this user's* period of
    // the same name and can never collide with, or overwrite, anyone else's.
    const [{ id: periodId }] = await tx
      .insert(periods)
      .values({
        userId,
        label: parsed.label,
        startDate: parsed.startDate ?? null,
        endDate: parsed.endDate ?? null,
        income: incomeStr,
        incomeComponents: parsed.incomeComponents,
        source: "sheet",
        sourceFilename,
        sourceSheetName: parsed.sheetName,
        sheetOrder: parsed.sheetOrder,
      })
      .onConflictDoUpdate({
        target: [periods.userId, periods.label],
        set: {
          income: incomeStr,
          incomeComponents: parsed.incomeComponents,
          startDate: parsed.startDate ?? null,
          endDate: parsed.endDate ?? null,
          sourceFilename,
          sourceSheetName: parsed.sheetName,
          sheetOrder: parsed.sheetOrder,
        },
      })
      .returning({ id: periods.id });

    // periodId came from a row we just wrote under this user's scope, so the
    // child deletes below are already confined to it.
    await tx.delete(transactions).where(eq(transactions.periodId, periodId));
    await tx.delete(budgets).where(eq(budgets.periodId, periodId));

    if (parsed.lineItems.length > 0) {
      await tx.insert(transactions).values(
        parsed.lineItems.map((item) => {
          // Transcription, not judgement: the parser's section decides kind and
          // category through the one table that the migration, the CHECK
          // constraint and the tests all read from.
          const { kind, category } = SECTION_MAPPING[item.section];
          return {
            periodId,
            kind,
            category,
            weekNumber: item.weekNumber,
            merchant: item.description,
            note: item.note,
            amount: item.amount.toString(),
            label: item.tag,
            pending: false,
            needsAttention: item.needsAttention ?? false,
            attentionReason: item.attentionReason ?? null,
            rawImport: item.rawImport ?? null,
          };
        })
      );
    }

    if (parsed.budgets.length > 0) {
      await tx.insert(budgets).values(
        parsed.budgets.map((b) => ({
          periodId,
          section: b.section,
          weekNumber: b.weekNumber,
          budgetedAmount: b.budgetedAmount.toString(),
        }))
      );
    }

    const { totalFixed, totalVariable, totalWeekly } = summarizePeriod(parsed.lineItems);
    const income = parsed.income ?? 0;
    const finalPosition = income - totalFixed - totalVariable - totalWeekly;

    const summaryValues = {
      totalFixed: totalFixed.toString(),
      totalVariable: totalVariable.toString(),
      totalWeekly: totalWeekly.toString(),
      income: income.toString(),
      finalPosition: finalPosition.toString(),
    };

    await tx
      .insert(periodSummaries)
      .values({ periodId, ...summaryValues })
      .onConflictDoUpdate({ target: periodSummaries.periodId, set: summaryValues });

    return periodId;
  });
}

export interface IncomeComponentRow {
  label: string;
  amount: number;
}

export interface PeriodSummaryRow {
  periodId: number;
  label: string;
  createdAt: string;
  incomeComponents: IncomeComponentRow[];
  totalFixed: number;
  totalVariable: number;
  totalWeekly: number;
  income: number;
  finalPosition: number;
}

export async function listPeriodSummaries(userId: UserId): Promise<PeriodSummaryRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      periodId: periods.id,
      label: periods.label,
      createdAt: periods.createdAt,
      incomeComponents: periods.incomeComponents,
      totalFixed: periodSummaries.totalFixed,
      totalVariable: periodSummaries.totalVariable,
      totalWeekly: periodSummaries.totalWeekly,
      income: periodSummaries.income,
      finalPosition: periodSummaries.finalPosition,
    })
    .from(periods)
    .innerJoin(periodSummaries, eq(periodSummaries.periodId, periods.id))
    .where(eq(periods.userId, userId))
    .orderBy(asc(periods.sheetOrder), asc(periods.id));

  return rows.map((r) => ({
    periodId: r.periodId,
    label: r.label,
    createdAt: r.createdAt.toISOString(),
    incomeComponents: r.incomeComponents ?? [],
    totalFixed: Number(r.totalFixed ?? 0),
    totalVariable: Number(r.totalVariable ?? 0),
    totalWeekly: Number(r.totalWeekly ?? 0),
    income: Number(r.income ?? 0),
    finalPosition: Number(r.finalPosition ?? 0),
  }));
}

export interface TagBreakdown {
  tag: string;
  section: string;
  total: number;
  count: number;
}

export async function tagBreakdownForPeriod(
  userId: UserId,
  periodId: number
): Promise<TagBreakdown[]> {
  const db = getDb();
  const tagExpr = sql<string>`coalesce(${transactions.label}, '(untagged)')`;
  const totalExpr = sql<string>`sum(${transactions.amount})`;

  const rows = await db
    .select({
      tag: tagExpr,
      kind: transactions.kind,
      category: transactions.category,
      total: totalExpr,
      count: sql<number>`count(*)`,
    })
    .from(transactions)
    // The join is the ownership check: a period id belonging to someone else
    // matches no row, so the query returns empty rather than their data.
    .innerJoin(periods, eq(periods.id, transactions.periodId))
    .where(and(eq(transactions.periodId, periodId), eq(periods.userId, userId)))
    .groupBy(tagExpr, transactions.kind, transactions.category)
    .orderBy(desc(totalExpr));

  // Several recurring categories collapse onto one sheet section, so the rows
  // are merged after mapping rather than trusted to be distinct.
  const merged = new Map<string, TagBreakdown>();
  for (const r of rows) {
    const section = sectionOf(r.kind, r.category);
    const key = `${r.tag}\u0000${section}`;
    const acc = merged.get(key) ?? { tag: r.tag, section, total: 0, count: 0 };
    acc.total += Number(r.total);
    acc.count += Number(r.count);
    merged.set(key, acc);
  }
  return [...merged.values()].sort((a, b) => b.total - a.total);
}

export interface WeeklyTotalRow {
  weekNumber: number;
  total: number;
}

/** Within-period rhythm — the signal the time-boxed model exists to expose. */
export async function weeklyTotalsForPeriod(
  userId: UserId,
  periodId: number
): Promise<WeeklyTotalRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      weekNumber: transactions.weekNumber,
      total: sql<string>`sum(${transactions.amount})`,
    })
    .from(transactions)
    .innerJoin(periods, eq(periods.id, transactions.periodId))
    .where(and(eq(transactions.periodId, periodId), eq(periods.userId, userId)))
    .groupBy(transactions.weekNumber)
    .orderBy(asc(transactions.weekNumber));

  return rows
    .filter((r) => r.weekNumber !== null)
    .map((r) => ({ weekNumber: Number(r.weekNumber), total: Number(r.total) }));
}

export interface SectionTotalRow {
  section: string;
  total: number;
}

export async function sectionTotalsForPeriod(
  userId: UserId,
  periodId: number
): Promise<SectionTotalRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      kind: transactions.kind,
      category: transactions.category,
      total: sql<string>`sum(${transactions.amount})`,
    })
    .from(transactions)
    .innerJoin(periods, eq(periods.id, transactions.periodId))
    .where(and(eq(transactions.periodId, periodId), eq(periods.userId, userId)))
    .groupBy(transactions.kind, transactions.category);

  const merged = new Map<string, number>();
  for (const r of rows) {
    const section = sectionOf(r.kind, r.category);
    merged.set(section, (merged.get(section) ?? 0) + Number(r.total));
  }
  return [...merged].map(([section, total]) => ({ section, total }));
}

export interface LineItemRow {
  id: number;
  /** Derived from `kind`/`category` for the screens that still speak sheet. */
  section: string;
  kind: TransactionKind;
  category: TransactionCategory | null;
  weekNumber: number | null;
  /** Alias of `merchant`, kept while the current dashboard still reads it. */
  description: string | null;
  merchant: string | null;
  note: string | null;
  amount: number;
  /** Alias of `label`. The user's own word — never normalised (D-10). */
  tag: string | null;
  label: string | null;
  occurredOn: string | null;
  pending: boolean;
  needsAttention: boolean;
  attentionReason: string | null;
  rawImport: string | null;
}

/**
 * The items behind a number. Makes B-8 provenance *visible* — a figure the user
 * can't trace back to their own spreadsheet is a figure they have to take on faith,
 * and this product is for people who don't take money claims on faith.
 */
export async function lineItemsForPeriod(
  userId: UserId,
  periodId: number
): Promise<LineItemRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: transactions.id,
      kind: transactions.kind,
      category: transactions.category,
      weekNumber: transactions.weekNumber,
      merchant: transactions.merchant,
      note: transactions.note,
      amount: transactions.amount,
      label: transactions.label,
      occurredOn: transactions.occurredOn,
      pending: transactions.pending,
      needsAttention: transactions.needsAttention,
      attentionReason: transactions.attentionReason,
      rawImport: transactions.rawImport,
    })
    .from(transactions)
    .innerJoin(periods, eq(periods.id, transactions.periodId))
    .where(and(eq(transactions.periodId, periodId), eq(periods.userId, userId)))
    .orderBy(desc(transactions.amount));

  return rows.map((r) => ({
    ...r,
    section: sectionOf(r.kind, r.category),
    description: r.merchant,
    tag: r.label,
    amount: Number(r.amount),
  }));
}

/**
 * R-19: the user must be able to delete their own records without a console.
 * "Their own" is load-bearing — the user_id predicate means a guessed period id
 * deletes nothing, and the caller can't tell the difference between "not yours"
 * and "doesn't exist".
 */
export async function deletePeriod(userId: UserId, periodId: number): Promise<boolean> {
  const db = getDb();
  const deleted = await db
    .delete(periods)
    .where(and(eq(periods.id, periodId), eq(periods.userId, userId)))
    .returning({ id: periods.id });
  return deleted.length > 0;
}

export async function getPeriodByLabel(userId: UserId, label: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: periods.id, label: periods.label })
    .from(periods)
    .where(and(eq(periods.label, label), eq(periods.userId, userId)));
  return row;
}

export interface NewPeriodInput {
  label: string;
  startDate: string;
  endDate: string;
}

/** Creates an empty app-native period after the user has seen the rollover proposal. */
export async function createPeriod(userId: UserId, input: NewPeriodInput): Promise<number> {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: periods.id })
      .from(periods)
      .where(and(eq(periods.userId, userId), eq(periods.startDate, input.startDate), eq(periods.endDate, input.endDate)));
    if (existing) return existing.id;

    const [order] = await tx
      .select({ value: sql<number>`coalesce(max(${periods.sheetOrder}), -1) + 1` })
      .from(periods)
      .where(eq(periods.userId, userId));
    const [created] = await tx
      .insert(periods)
      .values({
        userId,
        label: input.label,
        startDate: input.startDate,
        endDate: input.endDate,
        source: "app",
        sheetOrder: Number(order?.value ?? 0),
      })
      .returning({ id: periods.id });
    if (!created) throw new Error("The next period could not be created.");

    await tx.insert(periodSummaries).values({ periodId: created.id });
    return created.id;
  });
}


// --------------------------------------------------------------------- goals

export interface GoalRow {
  category: WeeklyCategory;
  weeklyAmount: number;
}

export async function listGoals(userId: UserId): Promise<GoalRow[]> {
  const db = getDb();
  const rows = await db
    .select({ category: goals.category, weeklyAmount: goals.weeklyAmount })
    .from(goals)
    .where(eq(goals.userId, userId));
  return rows.map((r) => ({ category: r.category, weeklyAmount: Number(r.weeklyAmount) }));
}

/** One target per category per user; setting it again replaces it. */
export async function setGoal(
  userId: UserId,
  category: WeeklyCategory,
  weeklyAmount: number
): Promise<void> {
  const db = getDb();
  await db
    .insert(goals)
    .values({ userId, category, weeklyAmount: weeklyAmount.toString() })
    .onConflictDoUpdate({
      target: [goals.userId, goals.category],
      set: { weeklyAmount: weeklyAmount.toString() },
    });
}

// -------------------------------------------------------------------- income

/**
 * The user's fallback figure. `null` means they have not told us — which is a
 * different claim from zero, and the screens must say so rather than forecast
 * against an assumed nothing.
 */
export async function getDefaultMonthlyIncome(userId: UserId): Promise<number | null> {
  const db = getDb();
  const [row] = await db
    .select({ amount: users.defaultMonthlyIncome })
    .from(users)
    .where(eq(users.id, userId));
  return row?.amount == null ? null : Number(row.amount);
}

export async function setDefaultMonthlyIncome(
  userId: UserId,
  amount: number | null
): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({ defaultMonthlyIncome: amount === null ? null : amount.toString() })
    .where(eq(users.id, userId));
}

/**
 * Record what actually came in for one month. Scoped twice over: the `user_id`
 * predicate on the period lookup means a period id belonging to someone else
 * resolves to nothing and the write never happens.
 */
export async function setIncomeForPeriod(
  userId: UserId,
  periodId: number,
  amount: number,
  setByUser = true
): Promise<boolean> {
  const db = getDb();
  const owned = await db
    .select({ id: periods.id })
    .from(periods)
    .where(and(eq(periods.id, periodId), eq(periods.userId, userId)));
  if (owned.length === 0) return false;

  await db
    .insert(incomeMonths)
    .values({ userId, periodId, amount: amount.toString(), setByUser })
    .onConflictDoUpdate({
      target: [incomeMonths.userId, incomeMonths.periodId],
      set: { amount: amount.toString(), setByUser, updatedAt: new Date() },
    });
  return true;
}

// -------------------------------------------------------------- transactions

export interface TransactionInput {
  kind: TransactionKind;
  category: TransactionCategory | null;
  weekNumber: number | null;
  merchant: string | null;
  note: string | null;
  amount: number;
  label: string | null;
  occurredOn: string | null;
  pending?: boolean;
  needsAttention?: boolean;
  attentionReason?: string | null;
  rawImport?: string | null;
}

/**
 * Add a transaction by hand (screen 08). Returns null when the period is not
 * this user's — indistinguishable, from the caller's side, from a period that
 * doesn't exist.
 */
export async function addTransaction(
  userId: UserId,
  periodId: number,
  input: TransactionInput
): Promise<number | null> {
  const db = getDb();
  const owned = await db
    .select({ id: periods.id })
    .from(periods)
    .where(and(eq(periods.id, periodId), eq(periods.userId, userId)));
  if (owned.length === 0) return null;

  const [row] = await db
    .insert(transactions)
    .values({
      periodId,
      kind: input.kind,
      category: input.category,
      weekNumber: input.weekNumber,
      merchant: input.merchant,
      note: input.note,
      amount: input.amount.toString(),
      label: input.label,
      occurredOn: input.occurredOn,
      pending: input.pending ?? false,
      needsAttention: input.needsAttention ?? false,
      attentionReason: input.attentionReason ?? null,
      rawImport: input.rawImport ?? null,
    })
    .returning({ id: transactions.id });
  return row?.id ?? null;
}

/**
 * Re-file or correct one transaction (screen 04). This is how a bill moves from
 * the flat `bills` group into Housing or Childcare — a judgement the user makes
 * and can see, never one the import guessed on their behalf.
 */
export async function updateTransaction(
  userId: UserId,
  transactionId: number,
  patch: Partial<TransactionInput>
): Promise<boolean> {
  const db = getDb();
  const owned = await db
    .select({ id: transactions.id })
    .from(transactions)
    .innerJoin(periods, eq(periods.id, transactions.periodId))
    .where(and(eq(transactions.id, transactionId), eq(periods.userId, userId)));
  if (owned.length === 0) return false;

  const set: Record<string, unknown> = {};
  if (patch.kind !== undefined) set.kind = patch.kind;
  if (patch.category !== undefined) set.category = patch.category;
  if (patch.weekNumber !== undefined) set.weekNumber = patch.weekNumber;
  if (patch.merchant !== undefined) set.merchant = patch.merchant;
  if (patch.note !== undefined) set.note = patch.note;
  if (patch.amount !== undefined) set.amount = patch.amount.toString();
  if (patch.label !== undefined) set.label = patch.label;
  if (patch.occurredOn !== undefined) set.occurredOn = patch.occurredOn;
  if (patch.pending !== undefined) set.pending = patch.pending;
  if (patch.needsAttention !== undefined) set.needsAttention = patch.needsAttention;
  if (patch.attentionReason !== undefined) set.attentionReason = patch.attentionReason;
  if (patch.rawImport !== undefined) set.rawImport = patch.rawImport;
  if (patch.pending === true) {
    set.needsAttention = false;
    set.attentionReason = null;
  }
  if (patch.needsAttention === true) set.pending = false;
  if (Object.keys(set).length === 0) return true;

  const updated = await db
    .update(transactions)
    .set(set)
    .where(eq(transactions.id, transactionId))
    .returning({ id: transactions.id });
  return updated.length > 0;
}

/** R-19 again, one row at a time. A guessed id belonging to someone else deletes nothing. */
export async function deleteTransaction(userId: UserId, transactionId: number): Promise<boolean> {
  const db = getDb();
  const owned = await db
    .select({ id: transactions.id })
    .from(transactions)
    .innerJoin(periods, eq(periods.id, transactions.periodId))
    .where(and(eq(transactions.id, transactionId), eq(periods.userId, userId)));
  if (owned.length === 0) return false;

  const deleted = await db
    .delete(transactions)
    .where(eq(transactions.id, transactionId))
    .returning({ id: transactions.id });
  return deleted.length > 0;
}

export interface AttentionTransactionRow {
  id: number;
  periodId: number;
  periodLabel: string;
  kind: TransactionKind;
  category: TransactionCategory | null;
  weekNumber: number | null;
  merchant: string | null;
  note: string | null;
  amount: number;
  label: string | null;
  occurredOn: string | null;
  rawImport: string | null;
  attentionReason: string;
}

/** B-8: every unresolved placement stays openable with its original row and reason. */
export async function listAttentionTransactions(
  userId: UserId,
  periodIds?: number[]
): Promise<AttentionTransactionRow[]> {
  const db = getDb();
  const predicates = [eq(periods.userId, userId), eq(transactions.needsAttention, true)];
  if (periodIds && periodIds.length > 0) predicates.push(inArray(transactions.periodId, periodIds));

  const rows = await db
    .select({
      id: transactions.id,
      periodId: transactions.periodId,
      periodLabel: periods.label,
      kind: transactions.kind,
      category: transactions.category,
      weekNumber: transactions.weekNumber,
      merchant: transactions.merchant,
      note: transactions.note,
      amount: transactions.amount,
      label: transactions.label,
      occurredOn: transactions.occurredOn,
      rawImport: transactions.rawImport,
      attentionReason: transactions.attentionReason,
    })
    .from(transactions)
    .innerJoin(periods, eq(periods.id, transactions.periodId))
    .where(and(...predicates))
    .orderBy(asc(transactions.id));

  return rows.map((row) => ({
    ...row,
    amount: Number(row.amount),
    attentionReason: row.attentionReason ?? "This row still needs your judgement.",
  }));
}

/** Confirming clears the state and its reason; skipping deliberately leaves both standing. */
export async function confirmAttentionTransaction(
  userId: UserId,
  transactionId: number
): Promise<boolean> {
  return updateTransaction(userId, transactionId, {
    needsAttention: false,
    attentionReason: null,
  });
}
