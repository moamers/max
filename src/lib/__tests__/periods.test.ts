import { describe, expect, it } from "vitest";
import {
  isWholeMondayToSundayPeriod,
  periodHasEnded,
  proposeImportedPeriodDates,
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
