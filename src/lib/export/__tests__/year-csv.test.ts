import { describe, expect, it } from "vitest";
import { buildYearRoundupCsv } from "../year-csv";

describe("year round-up CSV", () => {
  const row = (csv: string, label: string) => csv
    .split("\r\n")
    .find((line) => line.startsWith(`${label},`))!
    .split(",");

  it("uses the specified columns, final-position maths, nets and averages", () => {
    const csv = buildYearRoundupCsv([
      { label: "Period one", weekly: 100, fixed: 200, variable: 50, income: 500 },
      { label: "Period two", weekly: 200, fixed: 100, variable: 100, income: 600 },
    ]);
    expect(csv).toContain("Period one,100.00,20.00%,200.00,40.00%,50.00,10.00%,500.00,150.00,30.00%");
    expect(row(csv, "Net income")).toEqual(["Net income", "", "", "", "", "", "", "1100.00", "", ""]);
    expect(row(csv, "Net position")).toEqual(["Net position", "", "", "", "", "", "", "", "350.00", ""]);
    expect(row(csv, "Average")).toEqual([
      "Average", "150.00", "26.67%", "150.00", "28.33%", "75.00", "13.33%", "550.00", "175.00", "31.67%",
    ]);
  });

  it("leaves income-derived fields empty when income is unknown", () => {
    const csv = buildYearRoundupCsv([
      { label: "Unknown month", weekly: 100, fixed: 200, variable: 50, income: null },
    ]);
    expect(csv).toContain("Unknown month,100.00,,200.00,,50.00,,,,");
    expect(row(csv, "Net income")).toHaveLength(10);
    expect(row(csv, "Net income").slice(1)).toEqual(Array(9).fill(""));
    expect(row(csv, "Net position").slice(1)).toEqual(Array(9).fill(""));
  });

  it("escapes user-authored period labels", () => {
    expect(buildYearRoundupCsv([
      { label: "April, part 2", weekly: 0, fixed: 0, variable: 0, income: 1 },
    ])).toContain('"April, part 2"');
  });

  it("does not turn an empty year into zero averages", () => {
    const csv = buildYearRoundupCsv([]);
    expect(row(csv, "Average")).toEqual(["Average", "", "", "", "", "", "", "", "", ""]);
  });

  it("rounds a half-penny average like a spreadsheet currency cell", () => {
    const csv = buildYearRoundupCsv([
      { label: "One", weekly: 1, fixed: 0, variable: 0, income: 10 },
      { label: "Two", weekly: 1.01, fixed: 0, variable: 0, income: 10 },
    ]);
    expect(row(csv, "Average")[1]).toBe("1.01");
  });

  it("neutralises a period label that a spreadsheet would execute as a formula", () => {
    const csv = buildYearRoundupCsv([
      { label: "=2+2", weekly: 0, fixed: 0, variable: 0, income: 1 },
    ]);
    expect(csv).toContain("'=2+2,0.00");
  });
});
