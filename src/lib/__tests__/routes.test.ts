import { describe, it, expect } from "vitest";
import { periodHome, transactionHome, pathsAffectedBy } from "../routes";

describe("a change leaves you where you made it", () => {
  it("sends a weekly row back to its own week, in its own period", () => {
    expect(transactionHome("weekly", 4, 2)).toBe("/week/2?period=4");
  });

  it("sends a recurring row back to Recurring, in its own period", () => {
    expect(transactionHome("recurring", 4, null)).toBe("/recurring?period=4");
  });

  it("sends a one-off back to One-offs, in its own period", () => {
    expect(transactionHome("one_off", 4, null)).toBe("/one-offs?period=4");
  });

  it("falls back to the month — never to whichever month is current", () => {
    // A weekly row with no week number has no week screen. The month is still
    // the right answer, and it is still the period the row belongs to.
    expect(transactionHome("weekly", 4, null)).toBe("/?period=4");
    expect(periodHome(4)).toBe("/?period=4");
  });

  it("always names a period, whatever the kind", () => {
    const destinations = [
      transactionHome("weekly", 7, 3),
      transactionHome("weekly", 7, null),
      transactionHome("recurring", 7, null),
      transactionHome("one_off", 7, null),
    ];
    for (const href of destinations) expect(href).toContain("period=7");
  });

  it("never lands on bare home", () => {
    // "/" with no period is what sent an edit made in July to August.
    const destinations = [
      transactionHome("weekly", 7, 3),
      transactionHome("weekly", 7, null),
      transactionHome("recurring", 7, null),
      transactionHome("one_off", 7, null),
    ];
    for (const href of destinations) expect(href).not.toBe("/");
  });
});

describe("everything the change touches is refreshed", () => {
  it("includes home and the year for every kind", () => {
    for (const kind of ["weekly", "recurring", "one_off"] as const) {
      expect(pathsAffectedBy(kind, 2)).toContain("/");
      expect(pathsAffectedBy(kind, 2)).toContain("/year");
    }
  });

  it("includes the week a weekly row sits in", () => {
    expect(pathsAffectedBy("weekly", 2)).toContain("/week/2");
  });

  it("includes the screen the row is listed on", () => {
    expect(pathsAffectedBy("recurring", null)).toContain("/recurring");
    expect(pathsAffectedBy("one_off", null)).toContain("/one-offs");
  });

  it("doesn't claim a week screen that doesn't exist", () => {
    expect(pathsAffectedBy("weekly", null).some((p) => p.startsWith("/week/"))).toBe(false);
  });
});
