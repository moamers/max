import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserId } from "@/lib/auth";
import type { PeriodWindow } from "../period-window";

const { select } = vi.hoisted(() => ({ select: vi.fn() }));

vi.mock("@/lib/db", () => ({ getDb: () => ({ select }) }));

import {
  findPeriod,
  periodMetaFromRow,
  periodParamValue,
  pickCurrentPeriodId,
  resolvePeriodId,
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
  it("carries the needs-a-look marker without treating pending as attention", () => {
    expect(periodMetaFromRow({ id: 1, label: "Aug", startDate: null, endDate: null, hasAttention: true }).hasAttention).toBe(true);
    expect(periodMetaFromRow({ id: 2, label: "Sep", startDate: null, endDate: null }).hasAttention).toBe(false);
  });

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

/** Rows as `listPeriodsMeta` reads them, in sheet order. */
function mockPeriods(rows: { id: number; label: string; startDate: string | null; endDate: string | null }[]) {
  select.mockReturnValue({
    from: () => ({
      where: () => ({ orderBy: () => Promise.resolve(rows.map((r) => ({ ...r, hasAttention: false }))) }),
    }),
  });
}

describe("resolvePeriodId — one policy for every screen", () => {
  const JUNE = { id: 4, label: "Jun", startDate: "2026-06-01", endDate: "2026-06-28" };
  const JULY = { id: 9, label: "Jul", startDate: "2026-06-29", endDate: "2026-07-26" };
  const AUGUST = { id: 2, label: "Aug", startDate: "2026-07-27", endDate: "2026-08-30" };
  const TODAY = utc(2026, 7, 10); // mid-August

  beforeEach(() => {
    select.mockReset();
    // Sheet order deliberately disagrees with date order: August was imported
    // first, so the *last* summary row is July. This is the arrangement that
    // sent the week screen to a different month than the dashboard.
    mockPeriods([AUGUST, JUNE, JULY]);
  });

  it("gives every screen the period that is actually running", async () => {
    await expect(resolvePeriodId(USER_ID, {}, TODAY)).resolves.toBe(AUGUST.id);
  });

  it("no longer answers with the last sheet in the workbook", async () => {
    await expect(resolvePeriodId(USER_ID, {}, TODAY)).resolves.not.toBe(JULY.id);
  });

  it("honours an explicit period the user owns", async () => {
    await expect(resolvePeriodId(USER_ID, { period: "4" }, TODAY)).resolves.toBe(JUNE.id);
  });

  it("uses the first value when the param repeats", async () => {
    await expect(resolvePeriodId(USER_ID, { period: ["4", "9"] }, TODAY)).resolves.toBe(JUNE.id);
  });

  it("falls back rather than showing an empty screen for a period that is gone", async () => {
    // A bookmark from before a re-import: the id is real-looking but not theirs.
    await expect(resolvePeriodId(USER_ID, { period: "777" }, TODAY)).resolves.toBe(AUGUST.id);
  });

  it("ignores a malformed id", async () => {
    await expect(resolvePeriodId(USER_ID, { period: "2.5" }, TODAY)).resolves.toBe(AUGUST.id);
    await expect(resolvePeriodId(USER_ID, { period: "-3" }, TODAY)).resolves.toBe(AUGUST.id);
    await expect(resolvePeriodId(USER_ID, { period: "nope" }, TODAY)).resolves.toBe(AUGUST.id);
  });

  it("returns null when the user has no periods at all", async () => {
    mockPeriods([]);
    await expect(resolvePeriodId(USER_ID, { period: "4" }, TODAY)).resolves.toBeNull();
  });
});

describe("periodParamValue", () => {
  it("uses the first repeated value", () => {
    expect(periodParamValue({ period: ["7", "8"] })).toBe("7");
  });
});
