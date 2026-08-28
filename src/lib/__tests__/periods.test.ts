import { describe, expect, it } from "vitest";
import {
  isWholeMondayToSundayPeriod,
  periodHasEnded,
  proposeImportedPeriodDates,
  proposeFirstPeriod,
  proposeNextPeriod,
  proposePeriodAroundDate,
} from "../periods";

describe("period import dates", () => {
  it("marks a yearless label as a proposal that needs confirmation", () => {
    expect(proposeImportedPeriodDates("Jun 30th - Aug 3rd", new Date("2026-08-14T12:00:00Z"))).toEqual({
      startDate: "2026-06-30",
      endDate: "2026-08-03",
      yearWasExplicit: false,
    });
  });

  it("returns null instead of inventing an unreadable range", () => {
    expect(proposeImportedPeriodDates("August", new Date("2026-08-14T12:00:00Z"))).toBeNull();
  });

  it("prefills the one file-level question with a whole-week proposal", () => {
    expect(proposePeriodAroundDate(new Date("2026-08-26T12:00:00Z"), 5)).toEqual({
      startDate: "2026-08-24",
      endDate: "2026-09-27",
      yearWasExplicit: false,
    });
  });
});

describe("period rollover", () => {
  it("starts on the next Monday and chooses the whole-week Sunday nearest a month boundary", () => {
    const next = proposeNextPeriod("2026-08-02");
    expect(next).toMatchObject({
      startDate: "2026-08-03",
      endDate: "2026-08-30",
      weekCount: 4,
    });
    expect(isWholeMondayToSundayPeriod(next!.startDate, next!.endDate)).toBe(true);
  });

  it("can choose five weeks when that Sunday is closer to the first", () => {
    const next = proposeNextPeriod("2026-08-23");
    expect(next).toMatchObject({
      startDate: "2026-08-24",
      endDate: "2026-09-27",
      weekCount: 5,
    });
  });

  it("does not propose from a non-Sunday end", () => {
    expect(proposeNextPeriod("2026-08-03")).toBeNull();
  });

  it("moves on only after the end date", () => {
    expect(periodHasEnded("2026-08-02", new Date("2026-08-02T18:00:00Z"))).toBe(false);
    expect(periodHasEnded("2026-08-02", new Date("2026-08-03T00:00:00Z"))).toBe(true);
  });
});

/**
 * The period offered to an account that has none yet (#46). Every period in
 * this app is whole Monday-to-Sunday weeks, so this one has to be too — a
 * mid-week start would produce weeks that align with nothing and a period
 * `proposeNextPeriod` could never roll over from.
 */
describe("proposeFirstPeriod", () => {
  const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
  const contains = (p: { startDate: string; endDate: string }, iso: string) =>
    d(iso) >= d(p.startDate) && d(iso) <= d(p.endDate);

  // A spread of shapes: mid-month, on the first Monday, the 1st falling before
  // that Monday, a month whose first period has already ended, and two
  // year-boundary cases.
  const DAYS = [
    "2026-08-28",
    "2026-08-01",
    "2026-08-03",
    "2026-08-31",
    "2026-09-01",
    "2026-02-01",
    "2026-02-28",
    "2027-03-15",
    "2026-11-30",
    "2026-12-31",
  ];

  it.each(DAYS)("offers whole Monday-to-Sunday weeks on %s", (iso) => {
    const p = proposeFirstPeriod(d(iso));
    expect(isWholeMondayToSundayPeriod(p.startDate, p.endDate)).toBe(true);
  });

  it.each(DAYS)("offers a period containing %s", (iso) => {
    // Today must land inside it, or the first thing the user spends has
    // nowhere to go.
    expect(contains(proposeFirstPeriod(d(iso)), iso)).toBe(true);
  });

  it("starts at the first Monday of the month", () => {
    expect(proposeFirstPeriod(d("2026-08-28")).startDate).toBe("2026-08-03");
  });

  it("falls back to the current week before the month's first Monday", () => {
    // 1 Aug 2026 is a Saturday; the month's first Monday is the 3rd, which
    // would start two days in the future.
    expect(proposeFirstPeriod(d("2026-08-01")).startDate).toBe("2026-07-27");
  });

  it("rolls forward when the month's first period has already ended", () => {
    // 3–30 Aug finished yesterday; offering a month the user is past is worse
    // than offering none.
    expect(proposeFirstPeriod(d("2026-08-31")).startDate).toBe("2026-08-31");
  });

  it("produces a period proposeNextPeriod can roll over from", () => {
    const first = proposeFirstPeriod(d("2026-08-28"));
    expect(proposeNextPeriod(first.endDate)).not.toBeNull();
  });
});
