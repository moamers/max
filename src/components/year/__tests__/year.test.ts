import { describe, expect, it } from "vitest";
import {
  deriveYearOverview,
  hasEnoughYearData,
  pickRecordedYear,
  periodsInRecordedYear,
  type YearMonth,
  type YearPeriodInput,
} from "@/lib/queries/year";
import { isToneCompliant } from "@/lib/tone";
import { buildCumulativeChart } from "../chart";
import { YEAR_EMPTY_COPY, YEAR_UNKNOWN_INCOME_COPY, YEAR_UNKNOWN_RUNNING_COPY, yearNetSentence } from "../copy";

function period(overrides: Partial<YearPeriodInput> = {}): YearPeriodInput {
  return {
    periodId: 1,
    label: "January",
    monthIndex: 0,
    income: 4_000,
    weekly: 800,
    recurring: 1_500,
    oneOff: 200,
    ...overrides,
  };
}

describe("deriveYearOverview", () => {
  it("derives totals, income shares and KPIs from inspectable period inputs", () => {
    const result = deriveYearOverview(2026, [
      period(),
      period({ periodId: 2, label: "February", monthIndex: 1, income: 4_200, weekly: 900, recurring: 1_500, oneOff: 100 }),
    ]);

    expect(result.income).toBe(8_200);
    expect(result.spent).toEqual({ weekly: 1_700, recurring: 3_000, oneOff: 300, total: 5_000 });
    expect(result.netPosition).toBe(3_200);
    expect(result.keptPercent).toBeCloseTo(39.024);
    expect(result.shares.reduce((sum, share) => sum + share.barPercent, 0)).toBeCloseTo(100);
    expect(result.kpis.best?.monthIndex).toBe(1);
    expect(result.kpis.worst?.monthIndex).toBe(0);
    expect(result.kpis.averagePosition).toBe(1_600);
    expect(result.kpis.lowPoint).toEqual({ monthIndex: 0, amount: 1_500 });
  });

  it("aggregates two pay periods beginning in the same calendar month without hiding either source", () => {
    const result = deriveYearOverview(2026, [
      period(),
      period({ periodId: 2, label: "Late January", income: 2_000, weekly: 200, recurring: 300, oneOff: 0 }),
    ]);

    expect(result.months).toHaveLength(1);
    expect(result.months[0].periodIds).toEqual([1, 2]);
    expect(result.months[0].periodLabels).toEqual(["January", "Late January"]);
    expect(result.months[0].income).toBe(6_000);
    expect(result.months[0].position).toBe(3_000);
  });

  it("keeps income-dependent figures unknown when any period income is unknown", () => {
    const result = deriveYearOverview(2026, [period(), period({ periodId: 2, monthIndex: 1, income: null })]);

    expect(result.income).toBeNull();
    expect(result.netPosition).toBeNull();
    expect(result.keptPercent).toBeNull();
    expect(result.months[0].position).toBe(1_500);
    expect(result.months[1].position).toBeNull();
    expect(result.months[1].cumulativePosition).toBeNull();
    expect(result.shares.find((share) => share.key === "kept")?.amount).toBeNull();
    expect(result.kpis).toEqual({ best: null, worst: null, averagePosition: null, lowPoint: null });
  });

  it("does not invent percentages or a share bar denominator from zero income", () => {
    const result = deriveYearOverview(2026, [period({ income: 0, weekly: 0, recurring: 0, oneOff: 0 })]);
    expect(result.keptPercent).toBeNull();
    expect(result.shares.every((share) => share.incomePercent === null)).toBe(true);
    expect(result.shares.every((share) => share.barPercent === 0)).toBe(true);
  });

  it("keeps refund amounts visible without creating negative-width chart segments", () => {
    const result = deriveYearOverview(2026, [period({ weekly: -100, recurring: 1_000, oneOff: 0 })]);
    const weekly = result.shares.find((share) => share.key === "weekly");
    expect(weekly?.amount).toBe(-100);
    expect(weekly?.incomePercent).toBe(-2.5);
    expect(weekly?.barPercent).toBe(0);
    expect(result.shares.every((share) => share.barPercent >= 0)).toBe(true);
  });

  it("uses actual negative kept money in the tile but never gives a negative-width share segment", () => {
    const result = deriveYearOverview(2026, [period({ income: 2_000 })]);
    const kept = result.shares.find((share) => share.key === "kept");

    expect(result.netPosition).toBe(-500);
    expect(kept?.amount).toBe(-500);
    expect(kept?.incomePercent).toBe(-25);
    expect(kept?.barPercent).toBe(0);
    expect(result.shares.reduce((sum, share) => sum + share.barPercent, 0)).toBeCloseTo(100);
  });
});

describe("year data eligibility", () => {
  it("requires two periods for a year round-up", () => {
    expect(hasEnoughYearData(0)).toBe(false);
    expect(hasEnoughYearData(1)).toBe(false);
    expect(hasEnoughYearData(2)).toBe(true);
  });

  it("uses only persisted date provenance for year membership", () => {
    const inferredOnly = {
      id: 1,
      label: "January 2026",
      recordedStart: null,
      window: { start: new Date(Date.UTC(2026, 0, 1)), end: new Date(Date.UTC(2026, 0, 31)), totalDays: 31, daysElapsed: 31, daysRemaining: 0, complete: true },
    };
    const recorded = {
      id: 2,
      label: "February",
      recordedStart: new Date(Date.UTC(2026, 1, 1)),
      window: { start: new Date(Date.UTC(2026, 1, 1)), end: new Date(Date.UTC(2026, 1, 28)), totalDays: 28, daysElapsed: 28, daysRemaining: 0, complete: true },
    };
    expect(periodsInRecordedYear([inferredOnly, recorded], 2026).map((item) => item.id)).toEqual([2]);
  });

  it("falls back to an available recorded year for stale or guessed query values", () => {
    expect(pickRecordedYear("2025", [2024, 2026], 2030)).toBe(2026);
    expect(pickRecordedYear("2024", [2024, 2026], 2030)).toBe(2024);
    expect(pickRecordedYear("not-a-year", [], 2030)).toBe(2030);
  });

  it("keeps every added empty/unknown-data sentence inside the tone gate", () => {
    const copy = [
      ...Object.values(YEAR_EMPTY_COPY),
      YEAR_UNKNOWN_INCOME_COPY,
      YEAR_UNKNOWN_RUNNING_COPY,
      yearNetSentence(100, "2.0%", "£5,000"),
      yearNetSentence(-100, "-2.0%", "£5,000"),
    ];
    expect(copy.every(isToneCompliant)).toBe(true);
  });
});

describe("buildCumulativeChart", () => {
  const month = (monthIndex: number, cumulativePosition: number): YearMonth => ({
    monthIndex,
    periodIds: [monthIndex + 1],
    periodLabels: [String(monthIndex)],
    income: 0,
    weekly: 0,
    recurring: 0,
    oneOff: 0,
    spent: 0,
    position: 0,
    cumulativePosition,
  });

  it("places zero between positive and negative cumulative positions", () => {
    const chart = buildCumulativeChart([month(0, 100), month(1, -100)]);
    expect(chart.zeroY).toBeGreaterThan(chart.points[0].y);
    expect(chart.zeroY).toBeLessThan(chart.points[1].y);
    expect(chart.points[0].x).toBe(0);
    expect(chart.points[1].x).toBe(320);
  });

  it("returns no invented points when cumulative data is unknown", () => {
    const unknown = { ...month(0, 0), cumulativePosition: null };
    expect(buildCumulativeChart([unknown]).points).toEqual([]);
  });
});
