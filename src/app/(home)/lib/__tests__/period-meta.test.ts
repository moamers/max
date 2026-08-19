import { describe, it, expect } from "vitest";
import { findPeriod, pickCurrentPeriodId, type PeriodMeta } from "../period-meta";
import type { PeriodWindow } from "@/lib/queries";

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));

function windowFor(start: Date, end: Date, complete: boolean, daysElapsed: number): PeriodWindow {
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return { start, end, totalDays, daysElapsed, daysRemaining: totalDays - daysElapsed, complete };
}

describe("pickCurrentPeriodId", () => {
  it("picks the period whose window contains today", () => {
    const list: PeriodMeta[] = [
      { id: 1, label: "Jun", window: windowFor(utc(2026, 5, 1), utc(2026, 5, 30), true, 30) },
      { id: 2, label: "Jul", window: windowFor(utc(2026, 6, 1), utc(2026, 6, 31), true, 31) },
      { id: 3, label: "Aug", window: windowFor(utc(2026, 7, 1), utc(2026, 7, 31), false, 18) },
    ];
    expect(pickCurrentPeriodId(list)).toBe(3);
  });

  it("falls back to the most recently ended dated period when none is live", () => {
    const list: PeriodMeta[] = [
      { id: 1, label: "Jun", window: windowFor(utc(2026, 5, 1), utc(2026, 5, 30), true, 30) },
      { id: 2, label: "Jul", window: windowFor(utc(2026, 6, 1), utc(2026, 6, 31), true, 31) },
    ];
    expect(pickCurrentPeriodId(list)).toBe(2);
  });

  it("falls back to the last row when nothing has a window at all", () => {
    const list: PeriodMeta[] = [
      { id: 1, label: "a mystery period", window: null },
      { id: 2, label: "another one", window: null },
    ];
    expect(pickCurrentPeriodId(list)).toBe(2);
  });

  it("is null for an empty list", () => {
    expect(pickCurrentPeriodId([])).toBeNull();
  });
});

describe("findPeriod", () => {
  const list: PeriodMeta[] = [{ id: 5, label: "Aug", window: null }];

  it("finds a period this user owns by id", () => {
    expect(findPeriod(list, 5)?.label).toBe("Aug");
  });

  it("is null for an id not in the list", () => {
    expect(findPeriod(list, 99)).toBeNull();
  });

  it("is null when no id is given", () => {
    expect(findPeriod(list, null)).toBeNull();
  });
});
