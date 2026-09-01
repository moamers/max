import ExcelJS from "exceljs";
import type { IncomeComponent, ParsedBudget, ParsedLineItem, ParsedPeriod, Section } from "../parser";

const ITEM_COLUMNS = ["A", "B", "C", "D"] as const;
const WEEK_SECTIONS: readonly { section: Section; title: string }[] = [
  { section: "grocery", title: "Grocery" },
  { section: "weekend", title: "Weekend" },
  { section: "transport", title: "Transport" },
];
const WEEK_SECTION_NAMES = new Set<Section>(WEEK_SECTIONS.map(({ section }) => section));
const NO_WEEK_NOTE = "Ravel export: no week was recorded, so I put this in Week 1.";

const COLORS = {
  section: "FF434343",
  sectionInk: "FFFFFFFF",
  total: "FFD9D9D9",
  budget: "FFFF9900",
  panel: "FF000000",
  panelInk: "FFFFFFFF",
  accent: "FF0000FF",
  /**
   * One colour for both unsettled states — pending and needs-a-look — because
   * that is what was asked for, and because a sheet with two near-identical
   * oranges asks the reader to remember which is which.
   *
   * Deliberately well clear of the yellow band `src/lib/cell-fill.ts` reads
   * back (green is only 53% of red here). A row Ravel wrote orange must not
   * come back in as a yellow highlight, or "I could not place this" would
   * silently become "this has not gone out yet" on the next import.
   */
  unsettled: "FFED7D31",
};

export interface PeriodWorkbookInput {
  label: string;
  sheetName?: string;
  sheetOrder?: number;
  income: number | null;
  incomeComponents: IncomeComponent[];
  lineItems: ParsedLineItem[];
  budgets: ParsedBudget[];
  /** Persisted period dates can define empty week tabs before any rows exist. */
  weekNumbers?: number[];
}

interface WeekLayout {
  weekNumber: number;
  totalRows: Record<"grocery" | "weekend" | "transport", number>;
  budgetRows: Record<"grocery" | "weekend" | "transport", number>;
}

function solid(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function styleSectionHeader(sheet: ExcelJS.Worksheet, row: number): void {
  for (const column of ITEM_COLUMNS) {
    const cell = sheet.getCell(`${column}${row}`);
    cell.fill = solid(COLORS.section);
    cell.font = { bold: true, color: { argb: COLORS.sectionInk }, name: "Arial" };
  }
}

function styleFormulaRow(sheet: ExcelJS.Worksheet, row: number, color: string): void {
  for (const column of ["C", "D"] as const) {
    const cell = sheet.getCell(`${column}${row}`);
    cell.fill = solid(color);
    cell.font = { bold: true, color: { argb: "FF000000" }, name: "Arial" };
  }
}

function stylePanelRow(sheet: ExcelJS.Worksheet, row: number, accent = false): void {
  for (const column of ["G", "H"] as const) {
    const cell = sheet.getCell(`${column}${row}`);
    cell.fill = solid(accent ? COLORS.accent : COLORS.panel);
    cell.font = { bold: true, color: { argb: COLORS.panelInk }, name: "Arial" };
  }
}

function setItem(sheet: ExcelJS.Worksheet, row: number, item: ParsedLineItem): void {
  sheet.getCell(`A${row}`).value = item.description;
  sheet.getCell(`B${row}`).value = item.note;
  sheet.getCell(`C${row}`).value = item.amount;
  sheet.getCell(`C${row}`).numFmt = "#,##0.00";
  // D-10: labels are user-authored and cross this boundary verbatim.
  sheet.getCell(`D${row}`).value = item.tag;
  // A row Ravel is not certain has happened is marked in the sheet the same way
  // a person would mark it: the whole row, one colour. The workbook is the
  // founder's escape hatch, so a state he can see in the app has to be visible
  // in the file too.
  if (item.pending === true || item.needsAttention === true) {
    for (const column of ITEM_COLUMNS) {
      sheet.getCell(`${column}${row}`).fill = solid(COLORS.unsettled);
    }
  }
}

function itemsForWeek(
  period: PeriodWorkbookInput,
  section: Section,
  weekNumber: number
): ParsedLineItem[] {
  return period.lineItems
    .filter((item) =>
      item.section === section &&
      (item.weekNumber === weekNumber || (weekNumber === 1 && item.weekNumber === null))
    )
    .map((item) => item.weekNumber !== null
      ? item
      : { ...item, note: item.note ? `${item.note} · ${NO_WEEK_NOTE}` : NO_WEEK_NOTE });
}

function formulaRange(column: string, start: number, end: number): string {
  // SUM over one intentionally blank row is the auditable zero for an empty block.
  return `${column}${start}:${column}${Math.max(start, end)}`;
}

function budgetFor(
  budgets: ParsedBudget[],
  section: Section,
  weekNumber: number
): number | null {
  return budgets.find((budget) =>
    budget.section === section && budget.weekNumber === weekNumber
  )?.budgetedAmount ?? null;
}

function layoutForWeek(period: PeriodWorkbookInput, weekNumber: number): WeekLayout {
  let row = 1;
  const totalRows = {} as WeekLayout["totalRows"];
  const budgetRows = {} as WeekLayout["budgetRows"];
  for (const { section } of WEEK_SECTIONS) {
    const key = section as keyof WeekLayout["totalRows"];
    const itemCount = itemsForWeek(period, section, weekNumber).length;
    const firstItemRow = row + 1;
    const totalRow = firstItemRow + Math.max(1, itemCount);
    totalRows[key] = totalRow;
    budgetRows[key] = totalRow + 1;
    row = totalRow + 3;
  }
  return { weekNumber, totalRows, budgetRows };
}

function writeWeekSheet(
  workbook: ExcelJS.Workbook,
  period: PeriodWorkbookInput,
  weekNumber: number
): WeekLayout {
  const sheet = workbook.addWorksheet(`Week ${weekNumber}`);
  sheet.columns = [
    { key: "merchant", width: 19.5 },
    { key: "note", width: 70.25 },
    { key: "amount", width: 10.5 },
    { key: "label", width: 19.63 },
    { key: "unused-e" },
    { key: "separator" },
    { key: "panel-label", width: 19.88 },
    { key: "panel-value", width: 14 },
  ];

  let row = 1;
  const layout = layoutForWeek(period, weekNumber);

  for (const { section, title } of WEEK_SECTIONS) {
    const sectionKey = section as keyof WeekLayout["totalRows"];
    sheet.mergeCells(`A${row}:D${row}`);
    sheet.getCell(`A${row}`).value = title;
    styleSectionHeader(sheet, row);

    const items = itemsForWeek(period, section, weekNumber);
    const firstItemRow = row + 1;
    items.forEach((item, index) => setItem(sheet, firstItemRow + index, item));
    const lastItemRow = firstItemRow + Math.max(0, items.length - 1);
    const totalRow = firstItemRow + Math.max(1, items.length);
    sheet.getCell(`C${totalRow}`).value = {
      formula: `SUM(${formulaRange("C", firstItemRow, lastItemRow)})`,
    };
    sheet.getCell(`D${totalRow}`).value = "Total";
    styleFormulaRow(sheet, totalRow, COLORS.total);
    if (layout.totalRows[sectionKey] !== totalRow) throw new Error("Week layout drifted");

    const sectionBudget = budgetFor(period.budgets, section, weekNumber);
    const budgetRow = totalRow + 1;
    if (sectionBudget !== null) {
      sheet.getCell(`C${budgetRow}`).value = { formula: `${sectionBudget}-C${totalRow}` };
      sheet.getCell(`D${budgetRow}`).value = `GBP ${sectionBudget} budgeted`;
      styleFormulaRow(sheet, budgetRow, COLORS.budget);
    }
    if (layout.budgetRows[sectionKey] !== budgetRow) throw new Error("Week layout drifted");
    row = budgetRow + 2;
  }

  const panelTotalRow = layout.totalRows.grocery;
  sheet.getCell(`G${panelTotalRow}`).value = "Week total";
  sheet.getCell(`H${panelTotalRow}`).value = {
    formula: `SUM(C${layout.totalRows.grocery},C${layout.totalRows.weekend},C${layout.totalRows.transport})`,
  };
  stylePanelRow(sheet, panelTotalRow);

  const weeklyBudgets = WEEK_SECTIONS.flatMap(({ section }) => {
    const amount = budgetFor(period.budgets, section, weekNumber);
    return amount === null ? [] : [amount];
  });
  const panelBudgetRow = panelTotalRow + 1;
  sheet.getCell(`G${panelBudgetRow}`).value = "Weekly budget left";
  sheet.getCell(`H${panelBudgetRow}`).value = weeklyBudgets.length > 0
    ? { formula: `${weeklyBudgets.join("+")}-H${panelTotalRow}` }
    : null;
  stylePanelRow(sheet, panelBudgetRow, true);

  return layout;
}

function incomeRows(period: PeriodWorkbookInput): IncomeComponent[] {
  if (period.incomeComponents.length > 0) return period.incomeComponents;
  return period.income === null ? [] : [{ label: "Salary GBP", amount: period.income }];
}

function writeSummarySheet(
  sheet: ExcelJS.Worksheet,
  period: PeriodWorkbookInput,
  weeks: WeekLayout[]
): void {
  sheet.columns = [
    { key: "merchant", width: 23.75 },
    { key: "note", width: 73.88 },
    { key: "amount", width: 10.5 },
    { key: "label", width: 20.25 },
    { key: "section-total", width: 14 },
    { key: "separator" },
    { key: "panel-label", width: 24 },
    { key: "panel-value", width: 16 },
  ];

  sheet.getCell("A1").value = "Weekly total (grocery, weekend, transport)";
  styleSectionHeader(sheet, 1);
  weeks.forEach((week, index) => {
    const row = index + 2;
    sheet.getCell(`A${row}`).value = `Week ${week.weekNumber}`;
    sheet.getCell(`C${row}`).value = {
      formula: `'Week ${week.weekNumber}'!H${week.totalRows.grocery}`,
    };
  });
  const lastWeekRow = Math.max(2, weeks.length + 1);
  sheet.getCell("E1").value = { formula: `SUM(C2:C${lastWeekRow})` };
  sheet.getCell("E1").fill = solid(COLORS.accent);
  sheet.getCell("E1").font = { bold: true, color: { argb: COLORS.panelInk }, name: "Arial" };

  const billsHeader = Math.max(8, weeks.length + 3);
  const bills = period.lineItems.filter((item) => item.section === "bills");
  const extras = period.lineItems.filter((item) => item.section === "extras");
  const writeSummaryBlock = (headerRow: number, title: string, items: ParsedLineItem[]) => {
    sheet.mergeCells(`A${headerRow}:D${headerRow}`);
    sheet.getCell(`A${headerRow}`).value = title;
    styleSectionHeader(sheet, headerRow);
    const first = headerRow + 1;
    items.forEach((item, index) => setItem(sheet, first + index, item));
    const last = first + Math.max(0, items.length - 1);
    sheet.getCell(`E${headerRow}`).value = { formula: `SUM(${formulaRange("C", first, last)})` };
    sheet.getCell(`E${headerRow}`).fill = solid(COLORS.accent);
    sheet.getCell(`E${headerRow}`).font = { bold: true, color: { argb: COLORS.panelInk }, name: "Arial" };
    return { first, last, end: first + Math.max(1, items.length) - 1 };
  };
  const billsRows = writeSummaryBlock(billsHeader, "Bills", bills);
  const extrasHeader = billsRows.end + 2;
  const extrasRows = writeSummaryBlock(
    extrasHeader,
    "Extras (home improvements, shopping, gifts, etc)",
    extras
  );

  const panelStart = weeks.length + 1;
  sheet.getCell(`G${panelStart}`).value = "Total weekly";
  sheet.getCell(`H${panelStart}`).value = { formula: `SUM(C2:C${lastWeekRow})` };
  stylePanelRow(sheet, panelStart);

  sheet.getCell(`G${panelStart + 2}`).value = "Recurring";
  sheet.getCell(`H${panelStart + 2}`).value = {
    formula: `SUM(${formulaRange("C", billsRows.first, billsRows.last)})`,
  };
  stylePanelRow(sheet, panelStart + 2);
  sheet.getCell(`G${panelStart + 3}`).value = "One-offs";
  sheet.getCell(`H${panelStart + 3}`).value = {
    formula: `SUM(${formulaRange("C", extrasRows.first, extrasRows.last)})`,
  };
  stylePanelRow(sheet, panelStart + 3);

  const grandTotalRow = panelStart + 5;
  sheet.getCell(`G${grandTotalRow}`).value = "Grand total";
  sheet.getCell(`H${grandTotalRow}`).value = {
    formula: `SUM(H${panelStart},H${panelStart + 2},H${panelStart + 3})`,
  };
  stylePanelRow(sheet, grandTotalRow);

  const components = incomeRows(period);
  components.forEach((component, index) => {
    const row = grandTotalRow + 1 + index;
    sheet.getCell(`G${row}`).value = component.label;
    sheet.getCell(`H${row}`).value = component.amount;
    sheet.getCell(`H${row}`).numFmt = "#,##0.00";
  });
  if (components.length > 0) {
    const positionRow = grandTotalRow + components.length + 1;
    sheet.getCell(`G${positionRow}`).value = "Income left";
    sheet.getCell(`H${positionRow}`).value = {
      formula: `SUM(H${grandTotalRow + 1}:H${grandTotalRow + components.length})-H${grandTotalRow}`,
    };
    stylePanelRow(sheet, positionRow, true);
  }

  // The separator that prevents F-3 is structural: never write to column F.
  for (let row = 1; row <= Math.max(sheet.rowCount, extrasRows.end); row += 1) {
    if (sheet.getCell(`F${row}`).value !== null) {
      throw new Error("Export invariant failed: column F must remain empty");
    }
  }
}

/** Generate a new, data-sized workbook. Templates are references, never mutation targets. */
export function buildPeriodWorkbook(period: PeriodWorkbookInput): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ravel";
  workbook.created = new Date(0);
  workbook.modified = new Date(0);
  workbook.calcProperties.fullCalcOnLoad = true;

  const weekNumbers = [...new Set([
    ...(period.weekNumbers ?? []),
    ...period.lineItems.flatMap((item) => item.weekNumber === null ? [] : [item.weekNumber]),
    ...period.lineItems.flatMap((item) =>
      item.weekNumber === null && WEEK_SECTION_NAMES.has(item.section) ? [1] : []),
    ...period.budgets.flatMap((budget) => budget.weekNumber === null ? [] : [budget.weekNumber]),
  ])].sort((a, b) => a - b);

  const weekLayouts = weekNumbers.map((weekNumber) => layoutForWeek(period, weekNumber));
  const summary = workbook.addWorksheet("Month summary", {
    properties: { tabColor: { argb: COLORS.accent } },
  });
  writeSummarySheet(summary, period, weekLayouts);
  weekNumbers.forEach((weekNumber) => writeWeekSheet(workbook, period, weekNumber));
  return workbook;
}

export async function periodWorkbookBuffer(period: PeriodWorkbookInput): Promise<Buffer> {
  const data = await buildPeriodWorkbook(period).xlsx.writeBuffer();
  return Buffer.from(data as ArrayBuffer);
}

export function parsedPeriodAsExportInput(period: ParsedPeriod): PeriodWorkbookInput {
  return {
    label: period.label,
    sheetName: period.sheetName,
    sheetOrder: period.sheetOrder,
    income: period.income,
    incomeComponents: period.incomeComponents,
    lineItems: period.lineItems,
    budgets: period.budgets,
  };
}

/** Whole inclusive Monday-Sunday spans become explicit workbook week tabs. */
export function weekNumbersFromDates(startDate: string | null, endDate: string | null): number[] {
  if (!startDate || !endDate) return [];
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/;
  const startMatch = iso.exec(startDate);
  const endMatch = iso.exec(endDate);
  if (!startMatch || !endMatch) return [];
  const utc = (match: RegExpExecArray) => Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const start = utc(startMatch);
  const end = utc(endMatch);
  const startDateObject = new Date(start);
  const endDateObject = new Date(end);
  const valid = startDateObject.getUTCFullYear() === Number(startMatch[1])
    && startDateObject.getUTCMonth() === Number(startMatch[2]) - 1
    && startDateObject.getUTCDate() === Number(startMatch[3])
    && endDateObject.getUTCFullYear() === Number(endMatch[1])
    && endDateObject.getUTCMonth() === Number(endMatch[2]) - 1
    && endDateObject.getUTCDate() === Number(endMatch[3]);
  if (!valid || startDateObject.getUTCDay() !== 1 || endDateObject.getUTCDay() !== 0) return [];
  const inclusiveDays = Math.round((end - start) / 86_400_000) + 1;
  if (inclusiveDays <= 0 || inclusiveDays % 7 !== 0) return [];
  return Array.from({ length: inclusiveDays / 7 }, (_, index) => index + 1);
}
