import { describe, it, expect } from "vitest";
import { weekDateRange, formatWeekRange, monthNameOf } from "../weekDateRange";

const periodStart = new Date(Date.UTC(2026, 7, 4)); // 4 Aug 2026
const periodEnd = new Date(Date.UTC(2026, 8, 1)); // 1 Sep 2026 (29 days)

describe("weekDateRange", () => {
  it("week 1 starts on the period's own start date", () => {
    const range = weekDateRange(periodStart, periodEnd, 1);
    expect(range?.start.toISOString()).toBe(periodStart.toISOString());
    expect(range?.end.getUTCDate()).toBe(10); // 4..10 Aug inclusive = 7 days
  });

  it("week 2 picks up the day after week 1 ends", () => {
    const range = weekDateRange(periodStart, periodEnd, 2);
    expect(range?.start.getUTCDate()).toBe(11);
    expect(range?.end.getUTCDate()).toBe(17);
  });

  it("clamps the final week to the period's own end date rather than running past it", () => {
    // period is 29 days => week 5 would naively run 29 days in (1 Sep) to 4 days
    // past the period end; it must clamp to periodEnd instead.
    const range = weekDateRange(periodStart, periodEnd, 5);
    expect(range?.end.getTime()).toBe(periodEnd.getTime());
  });

  it("returns null once the week starts after the period has ended", () => {
    expect(weekDateRange(periodStart, periodEnd, 10)).toBeNull();
  });

  it("returns null for a week number below 1", () => {
    expect(weekDateRange(periodStart, periodEnd, 0)).toBeNull();
  });

  it("returns null when the period's end precedes its start", () => {
    expect(weekDateRange(periodEnd, periodStart, 1)).toBeNull();
  });
});

describe("formatWeekRange / monthNameOf", () => {
  it("formats a within-month range as 'D – D Mon'", () => {
    const range = weekDateRange(periodStart, periodEnd, 1)!;
    expect(formatWeekRange(range)).toBe("4 – 10 Aug");
  });

  it("names the month a date falls in", () => {
    expect(monthNameOf(periodStart)).toBe("August");
  });
});
