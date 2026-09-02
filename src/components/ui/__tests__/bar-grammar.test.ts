import { describe, it, expect } from "vitest";
import { computeBarReading, rampBackgroundSizePct } from "../bar-grammar";

describe("computeBarReading — the one chart grammar", () => {
  it("is empty when nothing has been spent", () => {
    expect(computeBarReading(0, 100)).toMatchObject({ widthPct: 0, tone: "spend" });
  });

  it("width tracks spend as a fraction of budget", () => {
    expect(computeBarReading(25, 100)).toMatchObject({ widthPct: 25, tone: "spend" });
    expect(computeBarReading(50, 100)).toMatchObject({ widthPct: 50, tone: "spend" });
    expect(computeBarReading(99, 100)).toMatchObject({ widthPct: 99, tone: "spend" });
  });

  it("reaches exactly 100% width at the budget line without turning over", () => {
    // Spend == budget: full track, still the neutral "spend" tone — the
    // grammar only turns red once spend EXCEEDS budget.
    expect(computeBarReading(100, 100)).toMatchObject({ widthPct: 100, tone: "spend" });
  });

  it("turns the whole fill 'over' the instant spend exceeds budget", () => {
    expect(computeBarReading(100.01, 100).tone).toBe("over");
    expect(computeBarReading(101, 100)).toMatchObject({ widthPct: 100, tone: "over" });
  });

  it("clamps width to 100% no matter how large the overspend is — magnitude lives in the number, not the bar", () => {
    expect(computeBarReading(150, 100)).toMatchObject({ widthPct: 100, tone: "over" });
    expect(computeBarReading(1_000_000, 100)).toMatchObject({ widthPct: 100, tone: "over" });
  });

  it("matches the prototype's own bar(spend, budget) for a real screen value (£62 over of £420)", () => {
    // docs/design/handoff/Max App v1.dc.html — week 2, "£396 spent" of "£420" budget... but
    // the headline example used in the README is "£62 over" on a category budget of £190.
    expect(computeBarReading(252, 190)).toMatchObject({ widthPct: 100, tone: "over" });
  });

  it("treats a zero or negative budget as an empty track rather than dividing by zero", () => {
    expect(computeBarReading(50, 0)).toMatchObject({ widthPct: 0, tone: "spend" });
    expect(computeBarReading(50, -10)).toMatchObject({ widthPct: 0, tone: "spend" });
  });

  it("treats negative spend (a refund) as nothing spent, not a negative bar", () => {
    expect(computeBarReading(-20, 100)).toMatchObject({ widthPct: 0, tone: "spend" });
  });

  it("is stable under floating point spend/budget values", () => {
    const reading = computeBarReading(33.33, 100);
    expect(reading.tone).toBe("spend");
    expect(reading.widthPct).toBeCloseTo(33.33, 5);
  });
});

describe("colour marks a state rather than a magnitude", () => {
  // The bar now carries an approach ramp — flat until 72% of the track, then
  // turning toward the over colour — reinstated at the founder's request after
  // a four-stop version was reversed. These assertions are what the ramp is
  // NOT allowed to change: it is a rendering concern, so nothing about the
  // reading may vary before the target, and the state still flips exactly
  // once, at it. If a future ramp starts driving `tone`, this fails.
  it("reports no gradient geometry at all", () => {
    for (const spend of [0, 25, 50, 100, 150]) {
      expect(computeBarReading(spend, 100)).toEqual({
        widthPct: Math.min(spend, 100),
        tone: spend > 100 ? "over" : "spend",
      });
    }
  });

  it("stays calm at half a budget", () => {
    expect(computeBarReading(50, 100).tone).toBe("spend");
  });

  it("keeps one tone the whole way to the target, and changes only past it", () => {
    // Nothing between 1% and 100% may differ: approaching a limit is not a
    // state change, so it must not be a colour change either.
    for (const spend of [1, 25, 50, 75, 99, 100]) {
      expect(computeBarReading(spend, 100).tone).toBe("spend");
    }
    expect(computeBarReading(100.01, 100).tone).toBe("over");
  });

  it("pins the fill at the track width once over, so length never carries the overspend", () => {
    expect(computeBarReading(150, 100).tone).toBe("over");
    expect(computeBarReading(150, 100).widthPct).toBe(100);
    expect(computeBarReading(1500, 100).widthPct).toBe(100);
  });

  it("does not divide by zero on an empty bar", () => {
    expect(computeBarReading(0, 100).widthPct).toBe(0);
    expect(computeBarReading(0, 0).widthPct).toBe(0);
  });
});

describe("the approach ramp is painted in track coordinates", () => {
  it("scales the gradient up by exactly the fill's share of the track", () => {
    // A half-full bar paints the ramp at twice its own width, so the ramp's
    // 72% stop still lands at 72% of the TRACK.
    expect(rampBackgroundSizePct(50)).toBe(200);
    expect(rampBackgroundSizePct(25)).toBe(400);
    expect(rampBackgroundSizePct(100)).toBe(100);
  });

  it("puts the warning out of reach of a bar that has not got there", () => {
    // At 10% of the budget the ramp is painted 10x wide, so its 72% stop sits
    // at 720% of the fill — off the end. A short bar is flat, which is the
    // whole reason for painting in track coordinates.
    const rampStartPctOfFill = (72 * rampBackgroundSizePct(10)) / 100;
    expect(rampStartPctOfFill).toBeGreaterThan(100);
  });

  it("does not divide by zero on an empty bar", () => {
    expect(rampBackgroundSizePct(0)).toBe(100);
    expect(Number.isFinite(rampBackgroundSizePct(0))).toBe(true);
  });
});
