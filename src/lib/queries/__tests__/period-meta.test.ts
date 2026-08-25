import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserId } from "@/lib/auth";
import type { PeriodWindow } from "../period-window";

const { listPeriodSummaries } = vi.hoisted(() => ({ listPeriodSummaries: vi.fn() }));

vi.mock("@/lib/store", () => ({ listPeriodSummaries }));

import {
  findPeriod,
  periodMetaFromRow,
  periodParamValue,
  pickCurrentPeriodId,
  resolveSummaryOrderedPeriodId,
  type PeriodMeta,
} from "../period-meta";

const USER_ID = "11111111-1111-4111-8111-111111111111" as UserId;
const utc = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day));

function windowFor(start: Date, end: Date, complete: boolean, daysElapsed: number): PeriodWindow {
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return { start, end, totalDays, daysElapsed, daysRemaining: totalDays - daysElapsed, complete };
}

describe("pickCurrentPeriodId", () => {
  it("picks the period whose window contains today", () => {
    const list: PeriodMeta[] = [
      { id: 1, label: "Jun", window: windowFor(utc(2026, 5, 1), utc(2026, 5, 30), true, 30), recordedStart: null },
      { id: 2, label: "Jul", window: windowFor(utc(2026, 6, 1), utc(2026, 6, 31), true, 31), recordedStart: null },
      { id: 3, label: "Aug", window: windowFor(utc(2026, 7, 1), utc(2026, 7, 31), false, 18), recordedStart: null },
    ];
    expect(pickCurrentPeriodId(list)).toBe(3);
  });

  it("falls back to the most recently ended dated period when none is live", () => {
    const list: PeriodMeta[] = [
      { id: 1, label: "Jun", window: windowFor(utc(2026, 5, 1), utc(2026, 5, 30), true, 30), recordedStart: null },
      { id: 2, label: "Jul", window: windowFor(utc(2026, 6, 1), utc(2026, 6, 31), true, 31), recordedStart: null },
    ];
    expect(pickCurrentPeriodId(list)).toBe(2);
  });

  it("falls back to the last row when nothing has a window", () => {
    const list: PeriodMeta[] = [
      { id: 1, label: "a mystery period", window: null, recordedStart: null },
      { id: 2, label: "another one", window: null, recordedStart: null },
    ];
    expect(pickCurrentPeriodId(list)).toBe(2);
  });

  it("is null for an empty list", () => {
    expect(pickCurrentPeriodId([])).toBeNull();
  });
});

describe("findPeriod", () => {
  const list: PeriodMeta[] = [{ id: 5, label: "Aug", window: null, recordedStart: null }];

  it("finds a period this user owns by id", () => {
    expect(findPeriod(list, 5)?.label).toBe("Aug");
  });

  it("rejects an id not in the owned list", () => {
    expect(findPeriod(list, 99)).toBeNull();
  });
});

describe("persisted date provenance", () => {
  it("does not expose the year inferred for a label-only window", () => {
    const meta = periodMetaFromRow(
      { id: 1, label: "Jun 30th - Aug 3rd", startDate: null, endDate: null },
      utc(2026, 6, 15)
    );

    expect(meta.window).not.toBeNull();
    expect(meta.recordedStart).toBeNull();
  });

  it("exposes the year from a valid persisted ISO start date", () => {
    const meta = periodMetaFromRow(
      { id: 1, label: "Jun 30th - Aug 3rd", startDate: "2025-06-30", endDate: "2025-08-03" },
      utc(2026, 6, 15)
    );

    expect(meta.recordedStart?.getUTCFullYear()).toBe(2025);
  });

  it("rejects an impossible persisted date", () => {
    const meta = periodMetaFromRow(
      { id: 1, label: "Jun 30th - Aug 3rd", startDate: "2025-02-31", endDate: null },
      utc(2026, 6, 15)
    );

    expect(meta.recordedStart).toBeNull();
  });
});

describe("summary-ordered selection", () => {
  beforeEach(() => {
    listPeriodSummaries.mockReset();
    listPeriodSummaries.mockResolvedValue([{ periodId: 4 }, { periodId: 9 }]);
  });

  it("preserves Week/Add's finite-number explicit policy", async () => {
    await expect(resolveSummaryOrderedPeriodId(USER_ID, { period: "2.5" }, "finite")).resolves.toBe(2.5);
    expect(listPeriodSummaries).not.toHaveBeenCalled();
  });

  it("preserves Money's positive-integer explicit policy", async () => {
    await expect(
      resolveSummaryOrderedPeriodId(USER_ID, { period: "2.5" }, "positive-integer")
    ).resolves.toBe(9);
    expect(listPeriodSummaries).toHaveBeenCalledWith(USER_ID);
  });

  it("falls back to the final summary row when no explicit id is accepted", async () => {
    await expect(resolveSummaryOrderedPeriodId(USER_ID, {}, "finite")).resolves.toBe(9);
  });

  it("returns null when neither an explicit id nor a summary exists", async () => {
    listPeriodSummaries.mockResolvedValue([]);
    await expect(resolveSummaryOrderedPeriodId(USER_ID, {}, "finite")).resolves.toBeNull();
  });
});

describe("periodParamValue", () => {
  it("uses the first repeated value", () => {
    expect(periodParamValue({ period: ["7", "8"] })).toBe("7");
  });
});
