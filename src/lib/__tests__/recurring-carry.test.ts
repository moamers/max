/**
 * The rules behind carrying recurring bills into a new month.
 *
 * Which month to copy from, what a copied date means in a month of a different
 * length, and which month a tap on an empty tile is even offering — all three
 * are judgements, all three are pure, and all three are wrong in ways that
 * would only show up as somebody's rent appearing on the wrong day.
 */
import { describe, expect, it } from "vitest";
import { pickCarrySource, shiftOccurredOn, type CarryCandidate } from "../recurring-carry";
import { proposePeriodForMonth } from "../periods";

function candidate(overrides: Partial<CarryCandidate> & { id: number }): CarryCandidate {
  return { startDate: null, sheetOrder: 0, hasRecurring: true, ...overrides };
}

describe("which month a copy comes from", () => {
  const target = { id: 10, startDate: "2026-09-07" };

  it("takes the most recent month before this one", () => {
    const source = pickCarrySource(target, [
      candidate({ id: 1, startDate: "2026-06-01", sheetOrder: 0 }),
      candidate({ id: 2, startDate: "2026-08-03", sheetOrder: 2 }),
      candidate({ id: 3, startDate: "2026-07-06", sheetOrder: 1 }),
    ]);
    expect(source?.id).toBe(2);
  });

  it("skips a month that has no recurring in it — the previous month may be empty", () => {
    const source = pickCarrySource(target, [
      candidate({ id: 1, startDate: "2026-07-06", sheetOrder: 1 }),
      candidate({ id: 2, startDate: "2026-08-03", sheetOrder: 2, hasRecurring: false }),
    ]);
    expect(source?.id).toBe(1);
  });

  it("never copies from a month that comes after this one", () => {
    expect(
      pickCarrySource(target, [candidate({ id: 4, startDate: "2026-10-05", sheetOrder: 3 })])
    ).toBeNull();
  });

  it("never copies from the month it is filling", () => {
    expect(
      pickCarrySource(target, [candidate({ id: target.id, startDate: "2026-09-07" })])
    ).toBeNull();
  });

  it("falls back to the last-arrived undated period, which is all an undated one has", () => {
    // Periods imported before dates were established have no start date, so
    // "most recent" can only mean "arrived last".
    const source = pickCarrySource(target, [
      candidate({ id: 1, startDate: null, sheetOrder: 0 }),
      candidate({ id: 2, startDate: null, sheetOrder: 5 }),
    ]);
    expect(source?.id).toBe(2);
  });

  it("prefers a dated month over an undated one", () => {
    const source = pickCarrySource(target, [
      candidate({ id: 1, startDate: null, sheetOrder: 9 }),
      candidate({ id: 2, startDate: "2026-08-03", sheetOrder: 1 }),
    ]);
    expect(source?.id).toBe(2);
  });

  it("has nothing to copy from an empty account", () => {
    expect(pickCarrySource(target, [])).toBeNull();
  });
});

describe("what day a copied bill lands on", () => {
  const sourceStart = "2026-08-03";
  const targetStart = "2026-08-31";
  const targetEnd = "2026-09-27";

  it("keeps the same distance into the month", () => {
    // 3 days in on the 6th of August becomes 3 days in on the 3rd of September.
    expect(shiftOccurredOn("2026-08-06", sourceStart, targetStart, targetEnd)).toBe("2026-09-03");
  });

  it("drops a date that would fall outside the new month", () => {
    // A five-week source month copied into a four-week one: day 31 has nowhere
    // to go, and inventing one would be a claim.
    expect(shiftOccurredOn("2026-09-02", sourceStart, targetStart, targetEnd)).toBeNull();
  });

  it("has no date to shift when the row never had one", () => {
    expect(shiftOccurredOn(null, sourceStart, targetStart, targetEnd)).toBeNull();
  });

  it("refuses when either month's dates are unknown", () => {
    expect(shiftOccurredOn("2026-08-06", null, targetStart, targetEnd)).toBeNull();
    expect(shiftOccurredOn("2026-08-06", sourceStart, null, targetEnd)).toBeNull();
  });

  it("refuses a date recorded before the month it is filed under", () => {
    expect(shiftOccurredOn("2026-07-30", sourceStart, targetStart, targetEnd)).toBeNull();
  });
});

describe("the month a not-yet-created tile is offering", () => {
  const today = new Date("2026-09-10T00:00:00Z");

  it("chains forward from the last period to the month asked for", () => {
    // A period ending Aug 30th exists. The next one runs Aug 31st – Oct 4th and
    // is named September (thirty of its days are), so October starts Oct 5th.
    const october = proposePeriodForMonth({ year: 2026, monthIndex: 9 }, "2026-08-30", today);
    expect(october).not.toBeNull();
    expect(october?.startDate).toBe("2026-10-05");
  });

  it("offers the month straight after the last one", () => {
    const september = proposePeriodForMonth({ year: 2026, monthIndex: 8 }, "2026-08-30", today);
    expect(september?.startDate).toBe("2026-08-31");
  });

  it("offers nothing for a month the chain has already passed", () => {
    expect(proposePeriodForMonth({ year: 2026, monthIndex: 5 }, "2026-08-30", today)).toBeNull();
  });

  it("starts from today's own month for an account with no periods at all", () => {
    const september = proposePeriodForMonth({ year: 2026, monthIndex: 8 }, null, today);
    expect(september).not.toBeNull();
    expect(september?.startDate.startsWith("2026-0")).toBe(true);
  });

  it("offers nothing in the past for an account with no periods", () => {
    expect(proposePeriodForMonth({ year: 2025, monthIndex: 0 }, null, today)).toBeNull();
  });

  it("proposes only whole Monday-to-Sunday periods", () => {
    for (let monthIndex = 8; monthIndex < 12; monthIndex += 1) {
      const proposal = proposePeriodForMonth({ year: 2026, monthIndex }, "2026-08-30", today);
      expect(proposal).not.toBeNull();
      const start = new Date(`${proposal!.startDate}T00:00:00Z`);
      const end = new Date(`${proposal!.endDate}T00:00:00Z`);
      expect(start.getUTCDay()).toBe(1);
      expect(end.getUTCDay()).toBe(0);
    }
  });
});
