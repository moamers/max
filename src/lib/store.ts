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
        source: "sheet",
        sourceFilename,
        sourceSheetName: parsed.sheetName,
        sheetOrder: parsed.sheetOrder,
      })
      .onConflictDoUpdate({
        target: periods.label,
        set: {
          income: incomeStr,
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

export interface PeriodSummaryRow {
  periodId: number;
  label: string;
  createdAt: string;
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

export async function getPeriodByLabel(label: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: periods.id, label: periods.label })
    .from(periods)
    .where(eq(periods.label, label));
  return row;
}
