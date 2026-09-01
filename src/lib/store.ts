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
import { pickCarrySource, shiftOccurredOn, type CarryCandidate } from "./recurring-carry";
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
          const needsAttention = item.needsAttention ?? false;
          return {
            periodId,
            kind,
            category,
            weekNumber: item.weekNumber,
            merchant: item.description,
            note: item.note,
            amount: item.amount.toString(),
            label: item.tag,
            // A yellow row in the source sheet arrives as pending. The two
            // states are mutually exclusive in the database
            // (CHECK `transactions_one_state`), so attention wins here as it
            // does in the parser — belt and braces, because this is the write.
            pending: needsAttention ? false : item.pending ?? false,
            needsAttention,
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

/**
 * R-19: clear the signed-in user's period-backed records in one scoped
 * statement. Transactions, budgets, summaries and per-period income rows all
 * cascade from `periods`; the account, goals and default income do not.
 */
export async function clearUserPeriods(userId: UserId): Promise<number> {
  const db = getDb();
  const deleted = await db
    .delete(periods)
    .where(eq(periods.userId, userId))
    .returning({ id: periods.id });
  return deleted.length;
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

export interface CreatedPeriod {
  id: number;
  /** How the recurring carry went, so the screen can say what it did. */
  carried: RecurringCarry;
}

/**
 * Creates an empty app-native period after the user has seen the proposal, and
 * — when asked — carries last month's recurring into it.
 *
 * Replication happens *here*, behind the button that creates the month, and
 * never when a screen is opened. "When you open a new month they need to be
 * replicated" is the natural way to say it and a database write on page load is
 * the literal reading; this project has already had one page-load write burst
 * take production down.
 */
export async function createPeriod(
  userId: UserId,
  input: NewPeriodInput,
  options: { copyRecurring?: boolean } = {}
): Promise<CreatedPeriod> {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: periods.id })
      .from(periods)
      .where(and(eq(periods.userId, userId), eq(periods.startDate, input.startDate), eq(periods.endDate, input.endDate)));
    // Pressing the same button twice re-runs the carry, which is a no-op
    // whenever the month already holds recurring rows — see `carryRecurring`.
    if (existing) {
      return {
        id: existing.id,
        carried: options.copyRecurring
          ? await carryRecurring(tx, userId, existing.id)
          : NOTHING_CARRIED,
      };
    }

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
    return {
      id: created.id,
      carried: options.copyRecurring ? await carryRecurring(tx, userId, created.id) : NOTHING_CARRIED,
    };
  });
}

// -------------------------------------------------------- recurring carry

type Transaction = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

export interface RecurringCarry {
  /** How many rows were written. Zero is the normal answer for a month that already has some. */
  copied: number;
  /** The month they came from, for a screen that wants to say so. Null when nothing was copied. */
  sourceLabel: string | null;
}

const NOTHING_CARRIED: RecurringCarry = { copied: 0, sourceLabel: null };

/** Every period this user owns, with whether it holds any recurring rows. */
async function carryCandidates(
  tx: Transaction,
  userId: UserId
): Promise<(CarryCandidate & { label: string; endDate: string | null })[]> {
  return tx
    .select({
      id: periods.id,
      label: periods.label,
      startDate: periods.startDate,
      endDate: periods.endDate,
      sheetOrder: periods.sheetOrder,
      hasRecurring: sql<boolean>`exists (
        select 1 from ${transactions}
        where ${transactions.periodId} = ${periods.id}
          and ${transactions.kind} = 'recurring'
      )`,
    })
    .from(periods)
    .where(eq(periods.userId, userId));
}

/**
 * Copy last month's recurring rows into this one.
 *
 * **Idempotent by the only rule that cannot be got wrong twice:** a month that
 * already holds a single recurring row is left alone. Copying is for a month
 * that has none, so running this again — a double press, a re-created month,
 * the button on an empty screen — can never double a bill.
 *
 * What is copied: merchant, note, amount, category and label, which is the row
 * as the user wrote it. What is reset:
 *
 *  - `pending = true`, because a copied bill is a prediction until it is seen.
 *  - `needs_attention = false` and no reason, because an unresolved flag is
 *    about one past import and carrying it forward would manufacture alarm.
 *  - `raw_import = null`, because this row did not come from a file and
 *    provenance must not lie (doctrine 5).
 *  - `occurred_on` shifted to the same distance into the new period, or dropped
 *    when that lands outside it.
 *
 * Deleting a bill needs no tombstone: each month copies from the last one, so a
 * row deleted this month is simply absent from next month.
 *
 * Cost: three statements — the candidate scan, the source rows, and **one**
 * multi-row insert. Never one insert per bill.
 */
async function carryRecurring(
  tx: Transaction,
  userId: UserId,
  periodId: number
): Promise<RecurringCarry> {
  const [target] = await tx
    .select({ id: periods.id, startDate: periods.startDate, endDate: periods.endDate })
    .from(periods)
    .where(and(eq(periods.id, periodId), eq(periods.userId, userId)));
  // Not this user's period, or none: indistinguishable from the caller's side.
  if (!target) return NOTHING_CARRIED;

  const candidates = await carryCandidates(tx, userId);
  if (candidates.find((candidate) => candidate.id === periodId)?.hasRecurring) return NOTHING_CARRIED;

  const source = pickCarrySource(target, candidates);
  if (!source) return NOTHING_CARRIED;
  const sourceLabel = candidates.find((candidate) => candidate.id === source.id)?.label ?? null;

  const rows = await tx
    .select({
      category: transactions.category,
      merchant: transactions.merchant,
      note: transactions.note,
      amount: transactions.amount,
      label: transactions.label,
      occurredOn: transactions.occurredOn,
    })
    .from(transactions)
    .where(and(eq(transactions.periodId, source.id), eq(transactions.kind, "recurring")))
    .orderBy(asc(transactions.id));
  if (rows.length === 0) return NOTHING_CARRIED;

  await tx.insert(transactions).values(
    rows.map((row) => ({
      periodId,
      kind: "recurring" as const,
      category: row.category,
      // Recurring rows belong to the month, not to a week within it.
      weekNumber: null,
      merchant: row.merchant,
      note: row.note,
      amount: row.amount,
      // D-10: the user's own word, carried across verbatim.
      label: row.label,
      occurredOn: shiftOccurredOn(row.occurredOn, source.startDate, target.startDate, target.endDate),
      pending: true,
      needsAttention: false,
      attentionReason: null,
      rawImport: null,
    }))
  );

  return { copied: rows.length, sourceLabel };
}

/**
 * Does this account hold any recurring rows at all?
 *
 * The question a create-a-month control needs: a month that does not exist yet
 * has no id to look a source up against, and every existing period is earlier
 * than the one being proposed. Offering a checkbox that would copy nothing is
 * a control that lies about what it does.
 */
export async function userHasRecurring(userId: UserId): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: transactions.id })
    .from(transactions)
    .innerJoin(periods, eq(periods.id, transactions.periodId))
    .where(and(eq(periods.userId, userId), eq(transactions.kind, "recurring")))
    .limit(1);
  return rows.length > 0;
}

/**
 * The "copy from last month" button on an empty recurring screen. Same rules,
 * same idempotence — this is `carryRecurring` on its own transaction.
 */
export async function copyRecurringFromLastMonth(
  userId: UserId,
  periodId: number
): Promise<RecurringCarry> {
  const db = getDb();
  return db.transaction((tx) => carryRecurring(tx, userId, periodId));
}

/**
 * Which month a copy would come from, or null when there is none. A read, so a
 * screen can decide whether to offer the button at all rather than offering one
 * that quietly does nothing.
 */
export async function recurringCarrySource(
  userId: UserId,
  periodId: number
): Promise<{ periodId: number; label: string } | null> {
  const db = getDb();
  const [target] = await db
    .select({ id: periods.id, startDate: periods.startDate })
    .from(periods)
    .where(and(eq(periods.id, periodId), eq(periods.userId, userId)));
  if (!target) return null;

  const candidates = await db
    .select({
      id: periods.id,
      label: periods.label,
      startDate: periods.startDate,
      sheetOrder: periods.sheetOrder,
      hasRecurring: sql<boolean>`exists (
        select 1 from ${transactions}
        where ${transactions.periodId} = ${periods.id}
          and ${transactions.kind} = 'recurring'
      )`,
    })
    .from(periods)
    .where(eq(periods.userId, userId));

  const source = pickCarrySource(target, candidates);
  if (!source) return null;
  const label = candidates.find((candidate) => candidate.id === source.id)?.label ?? null;
  return label === null ? null : { periodId: source.id, label };
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
