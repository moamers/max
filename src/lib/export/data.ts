import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { UserId } from "../auth";
import { getDb } from "../db";
import type { ParsedBudget, ParsedLineItem } from "../parser";
import { incomeForPeriod } from "../queries/income";
import { budgets, periods, transactions } from "../schema";
import { sectionForKindCategory, type SheetSection, type TransactionKind } from "../transactions";
import { weekNumbersFromDates, type PeriodWorkbookInput } from "./workbook";
import type { YearCsvPeriod } from "./year-csv";

export async function periodExportData(
  userId: UserId,
  periodId: number
): Promise<PeriodWorkbookInput | null> {
  const db = getDb();
  const [period] = await db
    .select({
      id: periods.id,
      label: periods.label,
      sheetName: periods.sourceSheetName,
      sheetOrder: periods.sheetOrder,
      importedIncome: periods.income,
      incomeComponents: periods.incomeComponents,
      startDate: periods.startDate,
      endDate: periods.endDate,
    })
    .from(periods)
    .where(and(eq(periods.id, periodId), eq(periods.userId, userId)))
    .limit(1);
  if (!period) return null;

  const [itemRows, budgetRows, income] = await Promise.all([
    db.select({
      kind: transactions.kind,
      category: transactions.category,
      weekNumber: transactions.weekNumber,
      merchant: transactions.merchant,
      note: transactions.note,
      amount: transactions.amount,
      label: transactions.label,
      id: transactions.id,
    })
      .from(transactions)
      .innerJoin(periods, eq(periods.id, transactions.periodId))
      .where(and(eq(transactions.periodId, periodId), eq(periods.userId, userId)))
      .orderBy(asc(transactions.id)),
    db.select({
      section: budgets.section,
      weekNumber: budgets.weekNumber,
      budgetedAmount: budgets.budgetedAmount,
      id: budgets.id,
    })
      .from(budgets)
      .innerJoin(periods, eq(periods.id, budgets.periodId))
      .where(and(eq(budgets.periodId, periodId), eq(periods.userId, userId)))
      .orderBy(asc(budgets.id)),
    incomeForPeriod(userId, periodId),
  ]);

  const lineItems = itemRows.flatMap((row): ParsedLineItem[] => {
    const section = sectionForKindCategory(row.kind, row.category);
    if (section === null) return [];
    return [{
      section,
      weekNumber: row.weekNumber,
      description: row.merchant,
      note: row.note,
      amount: Number(row.amount),
      tag: row.label,
    }];
  });
  const parsedBudgets = budgetRows.flatMap((row): ParsedBudget[] => {
    const section = row.section as SheetSection;
    if (!(["grocery", "weekend", "transport", "bills", "extras"] as string[]).includes(section)) {
      return [];
    }
    return [{ section, weekNumber: row.weekNumber, budgetedAmount: Number(row.budgetedAmount) }];
  });

  const importedComponents = period.incomeComponents ?? [];
  const incomeComponents = income.source === "period" && importedComponents.length > 0
    ? importedComponents
    : income.amount === null
      ? []
      : [{
          label: income.source === "month"
            ? "Salary GBP (set by you)"
            : "Salary GBP (default)",
          amount: income.amount,
        }];

  return {
    label: period.label,
    sheetName: period.sheetName ?? period.label,
    sheetOrder: period.sheetOrder,
    income: income.amount,
    incomeComponents,
    lineItems,
    budgets: parsedBudgets,
    weekNumbers: weekNumbersFromDates(period.startDate, period.endDate),
  };
}

export async function yearExportData(userId: UserId): Promise<YearCsvPeriod[]> {
  const db = getDb();
  const ownedPeriods = await db
    .select({ id: periods.id, label: periods.label })
    .from(periods)
    .where(eq(periods.userId, userId))
    .orderBy(asc(periods.sheetOrder), asc(periods.id));
  if (ownedPeriods.length === 0) return [];

  const ids = ownedPeriods.map((period) => period.id);
  const totals = await db
    .select({
      periodId: transactions.periodId,
      kind: transactions.kind,
      total: sql<string>`sum(${transactions.amount})`,
    })
    .from(transactions)
    .innerJoin(periods, eq(periods.id, transactions.periodId))
    .where(and(inArray(transactions.periodId, ids), eq(periods.userId, userId)))
    .groupBy(transactions.periodId, transactions.kind);
  const byPeriod = new Map<number, Map<TransactionKind, number>>();
  for (const row of totals) {
    const kinds = byPeriod.get(row.periodId) ?? new Map<TransactionKind, number>();
    kinds.set(row.kind, Number(row.total ?? 0));
    byPeriod.set(row.periodId, kinds);
  }
  const incomes = await Promise.all(ownedPeriods.map((period) => incomeForPeriod(userId, period.id)));
  return ownedPeriods.map((period, index) => {
    const kinds = byPeriod.get(period.id);
    return {
      label: period.label,
      weekly: kinds?.get("weekly") ?? 0,
      fixed: kinds?.get("recurring") ?? 0,
      variable: kinds?.get("one_off") ?? 0,
      income: incomes[index].amount,
    };
  });
}
