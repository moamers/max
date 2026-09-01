/**
 * Yellow in, orange out — end to end, over workbooks this test generates
 * itself with the same library the importer reads with.
 *
 * B-8: the parser has misread real data twice and both times the reading was
 * only visible once someone opened a figure up. A highlight is a claim about
 * whether a bill has actually left the account, so the cases where we *decline*
 * to read a colour matter as much as the ones we read.
 */
import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { parseWorkbook, type ParsedLineItem } from "../parser";
import { buildPeriodWorkbook } from "../export/workbook";

interface FillCase {
  merchant: string;
  amount: number;
  fill?: ExcelJS.Fill;
  pending: boolean;
}

const YELLOW = "FFFFFF00";

const CASES: FillCase[] = [
  { merchant: "Rent", amount: 1200, pending: false },
  {
    merchant: "Netflix",
    amount: 12.99,
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: YELLOW } },
    pending: true,
  },
  {
    merchant: "Water",
    amount: 30,
    fill: { type: "pattern", pattern: "none" } as ExcelJS.Fill,
    pending: false,
  },
  {
    merchant: "Gym",
    amount: 40,
    // A theme colour: only the workbook's own theme part could resolve it.
    fill: { type: "pattern", pattern: "solid", fgColor: { theme: 4, tint: 0.4 } } as ExcelJS.Fill,
    pending: false,
  },
  {
    merchant: "Phone",
    amount: 20,
    // Indexed 13 is yellow in the ECMA-376 default palette.
    fill: { type: "pattern", pattern: "solid", fgColor: { indexed: 13 } } as ExcelJS.Fill,
    pending: true,
  },
  {
    merchant: "Council tax",
    amount: 100,
    // Yellow, but transparent — nothing a person would see as a highlight.
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "00FFFF00" } },
    pending: false,
  },
  {
    merchant: "Insurance",
    amount: 50,
    fill: {
      type: "pattern",
      pattern: "darkVertical",
      fgColor: { argb: YELLOW },
      bgColor: { argb: "FFFFFFFF" },
    },
    pending: false,
  },
  {
    merchant: "Broadband",
    amount: 45,
    // The orange the founder's own template already uses on budget rows.
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF9900" } },
    pending: false,
  },
];

async function workbookOf(cases: FillCase[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Month summary");
  sheet.getCell("A1").value = "Bills";
  cases.forEach((entry, index) => {
    const row = index + 2;
    sheet.getCell(`A${row}`).value = entry.merchant;
    sheet.getCell(`C${row}`).value = entry.amount;
    if (entry.fill) {
      for (const column of ["A", "B", "C"]) sheet.getCell(`${column}${row}`).fill = entry.fill;
    }
  });
  return Buffer.from((await workbook.xlsx.writeBuffer()) as ArrayBuffer);
}

async function itemsOf(cases: FillCase[]): Promise<ParsedLineItem[]> {
  const parsed = await parseWorkbook(await workbookOf(cases), "Sept.xlsx");
  expect(parsed.periods).toHaveLength(1);
  return parsed.periods[0].lineItems;
}

describe("importing highlighted rows", () => {
  it("marks a yellow row pending and leaves every other fill alone", async () => {
    const items = await itemsOf(CASES);
    expect(items.map((item) => item.description)).toEqual(CASES.map((c) => c.merchant));
    expect(items.map((item) => item.pending === true)).toEqual(CASES.map((c) => c.pending));
  });

  it("reads an indexed yellow, which is how a sheet converted from .xls carries one", async () => {
    const items = await itemsOf([CASES[4]]);
    expect(items[0]?.amount).toBe(20);
    expect(items[0]?.pending).toBe(true);
  });

  it("keeps the highlight on the row it was drawn on", async () => {
    const items = await itemsOf(CASES);
    const netflix = items.find((item) => item.description === "Netflix");
    const rent = items.find((item) => item.description === "Rent");
    expect(netflix?.pending).toBe(true);
    expect(rent?.pending).toBe(false);
    expect(netflix?.amount).toBe(12.99);
  });

  it("still refuses to place an unreadable row, and says the row was highlighted", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Month summary");
    // No section header above it, so the parser cannot place it (B-9).
    sheet.getCell("A1").value = "Mystery";
    sheet.getCell("C1").value = 61.5;
    for (const column of ["A", "B", "C"]) {
      sheet.getCell(`${column}1`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: YELLOW } };
    }
    const buffer = Buffer.from((await workbook.xlsx.writeBuffer()) as ArrayBuffer);
    const [period] = (await parseWorkbook(buffer, "Sept.xlsx")).periods;
    const item = period.lineItems[0];

    // The database forbids both states at once, so attention wins and the
    // highlight survives as words rather than being dropped.
    expect(item.needsAttention).toBe(true);
    expect(item.pending).toBe(false);
    expect(item.attentionReason).toContain("highlighted in your sheet");
  });
});

describe("exporting unsettled rows", () => {
  const item = (overrides: Partial<ParsedLineItem>): ParsedLineItem => ({
    section: "bills",
    weekNumber: null,
    description: "Rent",
    note: null,
    amount: 1200,
    tag: null,
    ...overrides,
  });

  function fillOf(sheet: ExcelJS.Worksheet, row: number): string | undefined {
    const fill = sheet.getCell(`A${row}`).fill as ExcelJS.FillPattern | undefined;
    return fill?.fgColor?.argb;
  }

  it("paints pending and needs-a-look rows the same orange, and settled rows not at all", () => {
    const workbook = buildPeriodWorkbook({
      label: "Sept",
      income: null,
      incomeComponents: [],
      budgets: [],
      lineItems: [
        item({ description: "Rent" }),
        item({ description: "Netflix", amount: 12.99, pending: true }),
        item({ description: "Mystery", amount: 61.5, needsAttention: true }),
      ],
    });
    const summary = workbook.getWorksheet("Month summary")!;
    const firstBillRow = summary.getColumn(1).values.findIndex((value) => value === "Rent");

    expect(fillOf(summary, firstBillRow)).toBeUndefined();
    expect(fillOf(summary, firstBillRow + 1)).toBe("FFED7D31");
    expect(fillOf(summary, firstBillRow + 2)).toBe("FFED7D31");
  });

  it("does not read its own orange back as pending — the round trip is lossy on purpose", async () => {
    const workbook = buildPeriodWorkbook({
      label: "Sept",
      income: null,
      incomeComponents: [],
      budgets: [],
      lineItems: [item({ description: "Netflix", amount: 12.99, pending: true })],
    });
    const written = Buffer.from((await workbook.xlsx.writeBuffer()) as ArrayBuffer);
    const [period] = (await parseWorkbook(written, "Sept.xlsx")).periods;
    const netflix = period.lineItems.find((line) => line.description === "Netflix");

    expect(netflix?.amount).toBe(12.99);
    // Orange is not yellow. Two states share one colour on the way out, so the
    // colour cannot say which one it was on the way back in, and guessing would
    // turn "I couldn't place this" into "this hasn't gone out yet".
    expect(netflix?.pending).toBe(false);
  });
});
