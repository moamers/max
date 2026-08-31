import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseWorkbook, type ParsedPeriod } from "../../parser";
import { buildPeriodWorkbook, parsedPeriodAsExportInput, weekNumbersFromDates } from "../workbook";

const TEMPLATE_DIR = path.join(process.cwd(), "docs", "design", "templates");
const TEMPLATES = fs.readdirSync(TEMPLATE_DIR).filter((name) => name.endsWith(".xlsx")).sort();

function semantic(period: ParsedPeriod) {
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

describe("period workbook export", () => {
  it.each(TEMPLATES)("round-trips parser semantics for %s", async (fileName) => {
    const original = await parseWorkbook(fs.readFileSync(path.join(TEMPLATE_DIR, fileName)), fileName);
    expect(original.periods).toHaveLength(1);

    const workbook = buildPeriodWorkbook(parsedPeriodAsExportInput(original.periods[0]));
    const written = Buffer.from(await workbook.xlsx.writeBuffer() as ArrayBuffer);
    const reparsed = await parseWorkbook(written, fileName);

    expect(reparsed.periods).toHaveLength(1);
    expect(semantic(reparsed.periods[0])).toEqual(semantic(original.periods[0]));
  });

  it.each(TEMPLATES)("keeps separator column F empty and totals formula-driven for %s", async (fileName) => {
    const original = await parseWorkbook(fs.readFileSync(path.join(TEMPLATE_DIR, fileName)), fileName);
    const workbook = buildPeriodWorkbook(parsedPeriodAsExportInput(original.periods[0]));

    for (const sheet of workbook.worksheets) {
      for (let row = 1; row <= sheet.rowCount; row += 1) {
        expect(sheet.getCell(row, 6).value).toBeNull();
      }
    }
    const summary = workbook.getWorksheet("Month summary")!;
    expect(summary.getCell("E1").value).toMatchObject({ formula: expect.any(String) });
    const week = workbook.getWorksheet("Week 1")!;
    const totalCell = week.getColumn(4).values.findIndex((value) => value === "Total");
    expect(week.getCell(totalCell, 3).value).toMatchObject({ formula: expect.any(String) });
  });

  it("emits all date-defined tabs for an empty five-week period", () => {
    const weekNumbers = weekNumbersFromDates("2026-03-30", "2026-05-03");
    const workbook = buildPeriodWorkbook({
      label: "Mar 30th - May 3rd",
      income: null,
      incomeComponents: [],
      lineItems: [],
      budgets: [],
      weekNumbers,
    });
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "Month summary", "Week 1", "Week 2", "Week 3", "Week 4", "Week 5",
    ]);
  });

  it("does not infer week tabs from invalid or partial-week dates", () => {
    expect(weekNumbersFromDates("2026-02-30", "2026-03-29")).toEqual([]);
    expect(weekNumbersFromDates("2026-03-31", "2026-05-03")).toEqual([]);
  });

  it("keeps a weekly row with no recorded week visible and traceable", async () => {
    const workbook = buildPeriodWorkbook({
      label: "Unplaced week",
      income: null,
      incomeComponents: [],
      lineItems: [{
        section: "grocery",
        weekNumber: null,
        description: "Corner shop",
        note: null,
        amount: 12.5,
        tag: "my-label",
      }],
      budgets: [],
    });
    const week = workbook.getWorksheet("Week 1")!;
    expect(week.getCell("A2").value).toBe("Corner shop");
    expect(week.getCell("B2").value).toBe("Ravel export: no week was recorded, so I put this in Week 1.");
    expect(week.getCell("C2").value).toBe(12.5);
    expect(week.getCell("D2").value).toBe("my-label");

    const written = Buffer.from(await workbook.xlsx.writeBuffer() as ArrayBuffer);
    const reparsed = await parseWorkbook(written, "Unplaced week.xlsx");
    expect(reparsed.periods[0].lineItems).toContainEqual(expect.objectContaining({
      description: "Corner shop",
      weekNumber: 1,
      amount: 12.5,
      tag: "my-label",
    }));
  });
});
