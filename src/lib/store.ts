import { getDb } from "./db";
import { ParsedPeriod, summarizePeriod } from "./parser";

export function savePeriod(parsed: ParsedPeriod, sourceFilename: string) {
  const db = getDb();

  const upsertPeriod = db.prepare(`
    INSERT INTO periods (label, income, source, source_filename, source_sheet_name, sheet_order)
    VALUES (@label, @income, 'sheet', @sourceFilename, @sheetName, @sheetOrder)
    ON CONFLICT(label) DO UPDATE SET
      income = excluded.income,
      source_filename = excluded.source_filename,
      source_sheet_name = excluded.source_sheet_name,
      sheet_order = excluded.sheet_order
    RETURNING id
  `);

  const { id: periodId } = upsertPeriod.get({
    label: parsed.label,
    income: parsed.income,
    sourceFilename,
    sheetName: parsed.sheetName,
    sheetOrder: parsed.sheetOrder,
  }) as { id: number };

  db.prepare(`DELETE FROM line_items WHERE period_id = ?`).run(periodId);
  db.prepare(`DELETE FROM budgets WHERE period_id = ?`).run(periodId);
  db.prepare(`DELETE FROM period_summaries WHERE period_id = ?`).run(periodId);

  const insertItem = db.prepare(`
    INSERT INTO line_items (period_id, section, week_number, description, note, amount, tag)
    VALUES (@periodId, @section, @weekNumber, @description, @note, @amount, @tag)
  `);
  const insertBudget = db.prepare(`
    INSERT INTO budgets (period_id, section, week_number, budgeted_amount)
    VALUES (@periodId, @section, @weekNumber, @budgetedAmount)
  `);

  const tx = db.transaction(() => {
    for (const item of parsed.lineItems) {
      insertItem.run({ periodId, ...item });
    }
    for (const budget of parsed.budgets) {
      insertBudget.run({ periodId, ...budget });
    }

    const { totalFixed, totalVariable, totalWeekly } = summarizePeriod(parsed.lineItems);
    const income = parsed.income ?? 0;
    const finalPosition = income - totalFixed - totalVariable - totalWeekly;

    db.prepare(`
      INSERT INTO period_summaries (period_id, total_fixed, total_variable, total_weekly, income, final_position)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(periodId, totalFixed, totalVariable, totalWeekly, income, finalPosition);
  });

  tx();

  return periodId;
}

export interface PeriodSummaryRow {
  period_id: number;
  label: string;
  total_fixed: number;
  total_variable: number;
  total_weekly: number;
  income: number;
  final_position: number;
  created_at: string;
}

export function listPeriodSummaries(): PeriodSummaryRow[] {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT p.id as period_id, p.label, p.created_at,
           s.total_fixed, s.total_variable, s.total_weekly, s.income, s.final_position
    FROM periods p
    JOIN period_summaries s ON s.period_id = p.id
    ORDER BY p.sheet_order ASC, p.id ASC
  `
    )
    .all() as PeriodSummaryRow[];
}

export interface TagBreakdown {
  tag: string;
  section: string;
  total: number;
  count: number;
}

export function tagBreakdownForPeriod(periodId: number): TagBreakdown[] {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT COALESCE(tag, '(untagged)') as tag, section, SUM(amount) as total, COUNT(*) as count
    FROM line_items
    WHERE period_id = ?
    GROUP BY tag, section
    ORDER BY total DESC
  `
    )
    .all(periodId) as TagBreakdown[];
}

export function getPeriodByLabel(label: string) {
  const db = getDb();
  return db.prepare(`SELECT * FROM periods WHERE label = ?`).get(label) as
    | { id: number; label: string }
    | undefined;
}
