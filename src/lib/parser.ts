import ExcelJS from "exceljs";
import {
  detectWorkbookMapping,
  labelFromFileName,
  type WorkbookMapping,
} from "./workbook-mapping";

export type Section = "bills" | "extras" | "grocery" | "weekend" | "transport";

export interface ParsedLineItem {
  section: Section;
  weekNumber: number | null;
  description: string | null;
  note: string | null;
  amount: number;
  tag: string | null;
}

export interface ParsedBudget {
  section: Section;
  weekNumber: number | null;
  budgetedAmount: number;
}

export interface ParsedPeriod {
  label: string;
  sheetName: string;
  /** Position of this sheet within the workbook — the source of truth for chronological
   * order, since pay-period tabs are laid out left-to-right in date order. */
  sheetOrder: number;
  income: number | null;
  lineItems: ParsedLineItem[];
  budgets: ParsedBudget[];
}

export interface RawGrid {
  sheetName: string;
  rows: (string | number | null)[][];
}

const WEEKLY_SECTIONS: Section[] = ["grocery", "weekend", "transport"];

function cellToPrimitive(value: ExcelJS.CellValue): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  if (typeof value === "object") {
    const v = value as { result?: unknown; text?: string; richText?: { text: string }[] };
    if ("result" in v && v.result !== undefined) return cellToPrimitive(v.result as ExcelJS.CellValue);
    if ("richText" in v && v.richText) return v.richText.map((t) => t.text).join("").trim() || null;
    if ("text" in v && typeof v.text === "string") return v.text.trim() || null;
  }
  return null;
}

/** Reads a worksheet into a plain grid of primitives, stripping the `[merged] ` prefix Drive's renderer adds. */
export function sheetToGrid(worksheet: ExcelJS.Worksheet): (string | number | null)[][] {
  const rows: (string | number | null)[][] = [];
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    const values: (string | number | null)[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      let v = cellToPrimitive(cell.value);
      if (typeof v === "string") {
        v = v.replace(/^\[merged\]\s*/i, "").trim() || null;
      }
      values.push(v);
    });
    rows.push(values);
  });
  return rows;
}

function norm(v: string | number | null): string {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

function isNumber(v: string | number | null): v is number {
  return typeof v === "number";
}

function matchesSection(label: string): Section | null {
  if (label === "bills" || label.startsWith("bills")) return "bills";
  if (label.startsWith("extras")) return "extras";
  if (label === "grocery") return "grocery";
  if (label === "weekend") return "weekend";
  if (label === "transport") return "transport";
  return null;
}

function isTotalRow(cells: (string | number | null)[]): boolean {
  return cells.some((c) => norm(c) === "total");
}

function isBudgetRow(cells: (string | number | null)[]): boolean {
  return cells.some((c) => typeof c === "string" && /budget/i.test(c));
}

function extractBudgetAmount(cells: (string | number | null)[]): number | null {
  for (const c of cells) {
    if (typeof c === "string" && /budget/i.test(c)) {
      const m = c.match(/[\d,]+(\.\d+)?/);
      if (m) return parseFloat(m[0].replace(/,/g, ""));
    }
  }
  return null;
}

function extractSalary(cells: (string | number | null)[]): number | null {
  const hasSalaryLabel = cells.some((c) => typeof c === "string" && /^salary\b/i.test(c) && !/left/i.test(c));
  if (!hasSalaryLabel) return null;
  const num = cells.find((c) => isNumber(c));
  return typeof num === "number" ? num : null;
}

/**
 * Parses a single pay-period worksheet using label-anchored scanning rather than
 * fixed cell coordinates, since section lengths (bill count, transaction count)
 * vary sheet to sheet.
 */
export function parsePeriodSheet(
  sheetName: string,
  grid: (string | number | null)[][],
  sheetOrder: number
): ParsedPeriod {
  const lineItems: ParsedLineItem[] = [];
  const budgets: ParsedBudget[] = [];
  let income: number | null = null;

  let currentSection: Section | null = null;
  let currentWeek: number | null = null;
  const weekCounters: Record<Section, number> = { bills: 0, extras: 0, grocery: 0, weekend: 0, transport: 0 };

  for (const row of grid) {
    const nonNull = row.filter((c) => c !== null);
    if (nonNull.length === 0) continue;

    const salary = extractSalary(row);
    if (salary !== null) {
      if (income === null) income = salary;
      // A salary/income row is a terminal summary line, never a section line item —
      // and it means whatever section was last open is definitely closed.
      currentSection = null;
      continue;
    }

    const firstString = row.find((c): c is string => typeof c === "string");
    const label = norm(firstString ?? null);

    const section = firstString ? matchesSection(label) : null;
    if (section) {
      currentSection = section;
      if (WEEKLY_SECTIONS.includes(section)) {
        weekCounters[section] += 1;
        currentWeek = weekCounters[section];
      } else {
        currentWeek = null;
      }
      continue;
    }

    if (isTotalRow(row)) {
      // Closes the current line-item run; the actual total is cross-checked from summed items.
      continue;
    }

    if (isBudgetRow(row)) {
      if (currentSection) {
        const amt = extractBudgetAmount(row);
        if (amt !== null) {
          budgets.push({ section: currentSection, weekNumber: currentWeek, budgetedAmount: amt });
        }
      }
      // A budget line always marks the end of that block's item run in this template.
      currentSection = null;
      continue;
    }

    if (!currentSection) continue;

    // Line item row: find amount (first numeric cell), description/note (string cells before it),
    // tag (string cell after it).
    const numericIdx = row.findIndex((c) => isNumber(c));
    if (numericIdx === -1) continue;
    const amount = row[numericIdx] as number;

    const stringsBefore = row.slice(0, numericIdx).filter((c): c is string => typeof c === "string");
    const stringsAfter = row.slice(numericIdx + 1).filter((c): c is string => typeof c === "string");

    const description = stringsBefore[0] ?? null;
    const note = stringsBefore[1] ?? null;
    const tag = stringsAfter[0] ?? null;

    lineItems.push({
      section: currentSection,
      weekNumber: WEEKLY_SECTIONS.includes(currentSection) ? currentWeek : null,
      description,
      note,
      amount,
      tag,
    });
  }

  return { label: sheetName, sheetName, sheetOrder, income, lineItems, budgets };
}

export function isAggregatesSheet(sheetName: string): boolean {
  return /aggregate/i.test(sheetName);
}

/**
 * Applies a WorkbookMapping to the parsed sheets. Pure and deterministic —
 * all judgement about structure already happened in the mapping (T-2).
 */
export async function parseWorkbook(
  buffer: Buffer,
  fileName = "upload.xlsx"
): Promise<{
  periods: ParsedPeriod[];
  rawGrids: RawGrid[];
  mapping: WorkbookMapping;
}> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const rawGrids: RawGrid[] = [];
  const sheetNames: string[] = [];
  workbook.eachSheet((worksheet) => {
    sheetNames.push(worksheet.name);
    rawGrids.push({ sheetName: worksheet.name, rows: sheetToGrid(worksheet) });
  });

  const mapping = detectWorkbookMapping(sheetNames, fileName);
  const gridFor = (name: string) => rawGrids.find((g) => g.sheetName === name)?.rows ?? [];

  if (mapping.strategy === "sheet-is-period") {
    const periods: ParsedPeriod[] = [];
    let sheetOrder = 0;
    for (const plan of mapping.sheets) {
      if (plan.role.kind === "ignore") continue;
      const parsed = parsePeriodSheet(plan.sheetName, gridFor(plan.sheetName), sheetOrder);
      sheetOrder += 1;
      if (parsed.lineItems.length > 0) periods.push(parsed);
    }
    return { periods, rawGrids, mapping };
  }

  // workbook-is-period: every non-ignored sheet contributes to ONE period.
  const lineItems: ParsedLineItem[] = [];
  const budgets: ParsedBudget[] = [];
  let income: number | null = null;

  for (const plan of mapping.sheets) {
    if (plan.role.kind === "ignore") continue;
    const parsed = parsePeriodSheet(plan.sheetName, gridFor(plan.sheetName), 0);

    // Income can appear on any sheet; the summary sheet is the usual home.
    if (income === null && parsed.income !== null) income = parsed.income;

    if (plan.role.kind === "week") {
      // F-2: the week number comes from the sheet's identity, not from counting
      // repeated section headers inside it (a per-week sheet has only one of each).
      const weekNumber = plan.role.weekNumber;
      for (const item of parsed.lineItems) {
        lineItems.push(
          WEEKLY_SECTIONS.includes(item.section) ? { ...item, weekNumber } : item
        );
      }
      for (const b of parsed.budgets) {
        budgets.push(WEEKLY_SECTIONS.includes(b.section) ? { ...b, weekNumber } : b);
      }
    } else {
      lineItems.push(...parsed.lineItems);
      budgets.push(...parsed.budgets);
    }
  }

  const label = mapping.periodLabel ?? labelFromFileName(fileName);
  const periods: ParsedPeriod[] =
    lineItems.length > 0
      ? [{ label, sheetName: label, sheetOrder: 0, income, lineItems, budgets }]
      : [];

  return { periods, rawGrids, mapping };
}

export function summarizePeriod(lineItems: ParsedLineItem[]) {
  const sum = (section: Section) =>
    lineItems.filter((i) => i.section === section).reduce((acc, i) => acc + i.amount, 0);

  const totalFixed = sum("bills");
  const totalVariable = sum("extras");
  const totalWeekly = sum("grocery") + sum("weekend") + sum("transport");

  return { totalFixed, totalVariable, totalWeekly };
}
