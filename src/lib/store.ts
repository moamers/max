import { eq, sql, desc, asc } from "drizzle-orm";
import { getDb } from "./db";
import { periods, lineItems, budgets, periodSummaries } from "./schema";
import { ParsedPeriod, summarizePeriod } from "./parser";

export async function savePeriod(parsed: ParsedPeriod, sourceFilename: string): Promise<number> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const incomeStr = parsed.income !== null ? parsed.income.toString() : null;

    const [{ id: periodId }] = await tx
      .insert(periods)
      .values({
        label: parsed.label,
        income: incomeStr,
        incomeComponents: parsed.incomeComponents,
        source: "sheet",
        sourceFilename,
        sourceSheetName: parsed.sheetName,
        sheetOrder: parsed.sheetOrder,
      })
      .onConflictDoUpdate({
        target: periods.label,
        set: {
          income: incomeStr,
          incomeComponents: parsed.incomeComponents,
          sourceFilename,
          sourceSheetName: parsed.sheetName,
          sheetOrder: parsed.sheetOrder,
        },
      })
      .returning({ id: periods.id });

    await tx.delete(lineItems).where(eq(lineItems.periodId, periodId));
    await tx.delete(budgets).where(eq(budgets.periodId, periodId));

    if (parsed.lineItems.length > 0) {
      await tx.insert(lineItems).values(
        parsed.lineItems.map((item) => ({
          periodId,
          section: item.section,
          weekNumber: item.weekNumber,
          description: item.description,
          note: item.note,
          amount: item.amount.toString(),
          tag: item.tag,
        }))
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

export async function listPeriodSummaries(): Promise<PeriodSummaryRow[]> {
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

export async function tagBreakdownForPeriod(periodId: number): Promise<TagBreakdown[]> {
  const db = getDb();
  const tagExpr = sql<string>`coalesce(${lineItems.tag}, '(untagged)')`;
  const totalExpr = sql<string>`sum(${lineItems.amount})`;

  const rows = await db
    .select({
      tag: tagExpr,
      section: lineItems.section,
      total: totalExpr,
      count: sql<number>`count(*)`,
    })
    .from(lineItems)
    .where(eq(lineItems.periodId, periodId))
    .groupBy(tagExpr, lineItems.section)
    .orderBy(desc(totalExpr));

  return rows.map((r) => ({
    tag: r.tag,
    section: r.section,
    total: Number(r.total),
    count: Number(r.count),
  }));
}

export interface WeeklyTotalRow {
  weekNumber: number;
  total: number;
}

/** Within-period rhythm — the signal the time-boxed model exists to expose. */
export async function weeklyTotalsForPeriod(periodId: number): Promise<WeeklyTotalRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      weekNumber: lineItems.weekNumber,
      total: sql<string>`sum(${lineItems.amount})`,
    })
    .from(lineItems)
    .where(eq(lineItems.periodId, periodId))
    .groupBy(lineItems.weekNumber)
    .orderBy(asc(lineItems.weekNumber));

  return rows
    .filter((r) => r.weekNumber !== null)
    .map((r) => ({ weekNumber: Number(r.weekNumber), total: Number(r.total) }));
}

export interface SectionTotalRow {
  section: string;
  total: number;
}

export async function sectionTotalsForPeriod(periodId: number): Promise<SectionTotalRow[]> {
  const db = getDb();
  const rows = await db
    .select({ section: lineItems.section, total: sql<string>`sum(${lineItems.amount})` })
    .from(lineItems)
    .where(eq(lineItems.periodId, periodId))
    .groupBy(lineItems.section);
  return rows.map((r) => ({ section: r.section, total: Number(r.total) }));
}

export interface LineItemRow {
  id: number;
  section: string;
  weekNumber: number | null;
  description: string | null;
  note: string | null;
  amount: number;
  tag: string | null;
}

/**
 * The items behind a number. Makes B-8 provenance *visible* — a figure the user
 * can't trace back to their own spreadsheet is a figure they have to take on faith,
 * and this product is for people who don't take money claims on faith.
 */
export async function lineItemsForPeriod(periodId: number): Promise<LineItemRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: lineItems.id,
      section: lineItems.section,
      weekNumber: lineItems.weekNumber,
      description: lineItems.description,
      note: lineItems.note,
      amount: lineItems.amount,
      tag: lineItems.tag,
    })
    .from(lineItems)
    .where(eq(lineItems.periodId, periodId))
    .orderBy(desc(lineItems.amount));

  return rows.map((r) => ({ ...r, amount: Number(r.amount) }));
}

/** R-19: the user must be able to delete their own records without a console. */
export async function deletePeriod(periodId: number): Promise<boolean> {
  const db = getDb();
  const deleted = await db.delete(periods).where(eq(periods.id, periodId)).returning({ id: periods.id });
  return deleted.length > 0;
}

export async function getPeriodByLabel(label: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: periods.id, label: periods.label })
    .from(periods)
    .where(eq(periods.label, label));
  return row;
}
