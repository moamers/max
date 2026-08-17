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
  /** The labelled rows income was summed from, so the figure stays traceable (B-8). */
  incomeComponents: IncomeComponent[];
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

/**
 * Money-in rows are labelled on the summary panel: "Salary GBP", "Family cash in GBP".
 * Rows that *derive* from income ("Salary and cash GBP left", forecasts, grand totals)
 * are not income and must not be added to it.
 */
const INCOME_LABEL = /^salary\b|\bcash in\b/i;
const DERIVED_LABEL = /\bleft\b|\bforecast\b|\btotal\b|\bbudget/i;

function isIncomeLabel(c: string | number | null): c is string {
  return typeof c === "string" && INCOME_LABEL.test(c) && !DERIVED_LABEL.test(c);
}

export interface IncomeComponent {
  label: string;
  amount: number;
}

/**
 * F-3: takes the figure *adjacent* to the income label, not the first number on the
 * row. On the real summary tab "Salary GBP | 6,647.94" sits in the right-hand panel
 * on the same row as a "Rent … 2,285.00" line item — reading left-to-right made the
 * rent the household's income, and every downstream sentence inherited that error.
 */
export function extractIncome(grid: (string | number | null)[][]): {
  total: number | null;
  components: IncomeComponent[];
} {
  const components: IncomeComponent[] = [];

  for (const row of grid) {
    for (let i = 0; i < row.length; i++) {
      if (!isIncomeLabel(row[i])) continue;
      const next = row.slice(i + 1).find((c) => c !== null) ?? null;
      if (isNumber(next)) components.push({ label: row[i] as string, amount: next });
    }
  }

  if (components.length === 0) return { total: null, components };
  return { total: components.reduce((acc, c) => acc + c.amount, 0), components };
}

/**
 * These sheets lay out two independent blocks side by side: line items on the left,
 * a running summary panel on the right, separated by a column that is empty top to
 * bottom. Every row predicate here scans a row end-to-end, so without a boundary the
 * panel's text leaks into the item block — "GBP budgetted" in the panel ended the
 * bills list sixteen rows early, and "GBP left" became a line item's tag.
 *
 * The boundary is derived from the sheet, not hardcoded: the first column that is
 * empty in every row, searched from the first column that holds a number so a sheet
 * with an unused notes column doesn't cut itself in half. A sheet with no empty
 * column keeps its full width, which is what legacy single-block sheets need.
 */
export function itemBlockWidth(grid: (string | number | null)[][]): number {
  const width = grid.reduce((max, row) => Math.max(max, row.length), 0);
  if (width === 0) return 0;

  const columnIsEmpty = (col: number) => grid.every((row) => row[col] === null || row[col] === undefined);
  const firstNumericCol = (() => {
    for (let c = 0; c < width; c++) {
      if (grid.some((row) => isNumber(row[c]))) return c;
    }
    return 0;
  })();

  for (let c = firstNumericCol + 1; c < width; c++) {
    if (columnIsEmpty(c)) return c;
  }
  return width;
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

  // Income lives on the summary panel, so it's read from the whole grid; everything
  // else is read only from the item block.
  const { total: income, components: incomeComponents } = extractIncome(grid);
  const width = itemBlockWidth(grid);

  let currentSection: Section | null = null;
  let currentWeek: number | null = null;
  const weekCounters: Record<Section, number> = { bills: 0, extras: 0, grocery: 0, weekend: 0, transport: 0 };

  for (const fullRow of grid) {
    const row = fullRow.slice(0, width);
    const nonNull = row.filter((c) => c !== null);
    if (nonNull.length === 0) continue;

    // An income label inside the item block (older single-block sheets) closes the
    // open section rather than being read as spending.
    if (row.some(isIncomeLabel)) {
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

  return { label: sheetName, sheetName, sheetOrder, income, incomeComponents, lineItems, budgets };
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
  let incomeComponents: IncomeComponent[] = [];

  for (const plan of mapping.sheets) {
    if (plan.role.kind === "ignore") continue;
    const parsed = parsePeriodSheet(plan.sheetName, gridFor(plan.sheetName), 0);

    // Income can appear on any sheet; the summary sheet is the usual home.
    if (income === null && parsed.income !== null) {
      income = parsed.income;
      incomeComponents = parsed.incomeComponents;
    }

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
      ? [{ label, sheetName: label, sheetOrder: 0, income, incomeComponents, lineItems, budgets }]
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
