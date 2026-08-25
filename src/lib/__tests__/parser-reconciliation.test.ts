import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parsePeriodSheet, parseWorkbook } from "../parser";

const templates = path.join(process.cwd(), "docs", "design", "templates");

describe("parser reconciliation", () => {
  it.each([
    ["Template 4 Weeks (May 4th - May 31st).xlsx", 148, 12],
    ["Template 5 Weeks (Mar 30th - May 3rd).xlsx", 183, 15],
  ])("keeps %s item and budget counts without importing summary formulas", async (name, itemCount, budgetCount) => {
    const parsed = await parseWorkbook(await readFile(path.join(templates, name)), name);
    expect(parsed.periods).toHaveLength(1);
    expect(parsed.periods[0].lineItems).toHaveLength(itemCount);
    expect(parsed.periods[0].budgets).toHaveLength(budgetCount);
    expect(parsed.periods[0].lineItems.filter((item) => item.needsAttention)).toHaveLength(0);
  });

  it("lands an amount-bearing row outside a recognised block as a traceable one-off", () => {
    const parsed = parsePeriodSheet("Odd sheet", [["Mystery debit", null, 12.5, "raw-label"]], 0);
    expect(parsed.lineItems).toEqual([
      expect.objectContaining({
        section: "extras",
        description: "Mystery debit",
        amount: 12.5,
        tag: "raw-label",
        needsAttention: true,
        rawImport: "Mystery debit | 12.5 | raw-label",
      }),
    ]);
    expect(parsed.lineItems[0].attentionReason).toContain("one-offs");
  });
});
