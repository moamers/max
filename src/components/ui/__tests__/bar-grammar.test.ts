import { describe, it, expect } from "vitest";
import { computeBarReading } from "../bar-grammar";

describe("computeBarReading — the one chart grammar", () => {
  it("is empty when nothing has been spent", () => {
    expect(computeBarReading(0, 100)).toEqual({ widthPct: 0, tone: "spend" });
  });

  it("width tracks spend as a fraction of budget", () => {
    expect(computeBarReading(25, 100)).toEqual({ widthPct: 25, tone: "spend" });
    expect(computeBarReading(50, 100)).toEqual({ widthPct: 50, tone: "spend" });
    expect(computeBarReading(99, 100)).toEqual({ widthPct: 99, tone: "spend" });
  });

  it("reaches exactly 100% width at the budget line without turning over", () => {
    // Spend == budget: full track, still the neutral "spend" tone — the
    // grammar only turns red once spend EXCEEDS budget.
    expect(computeBarReading(100, 100)).toEqual({ widthPct: 100, tone: "spend" });
  });

  it("turns the whole fill 'over' the instant spend exceeds budget", () => {
    expect(computeBarReading(100.01, 100).tone).toBe("over");
    expect(computeBarReading(101, 100)).toEqual({ widthPct: 100, tone: "over" });
  });

  it("clamps width to 100% no matter how large the overspend is — magnitude lives in the number, not the bar", () => {
    expect(computeBarReading(150, 100)).toEqual({ widthPct: 100, tone: "over" });
    expect(computeBarReading(1_000_000, 100)).toEqual({ widthPct: 100, tone: "over" });
  });

  it("matches the prototype's own bar(spend, budget) for a real screen value (£62 over of £420)", () => {
    // docs/design/handoff/Max App v1.dc.html — week 2, "£396 spent" of "£420" budget... but
    // the headline example used in the README is "£62 over" on a category budget of £190.
    expect(computeBarReading(252, 190)).toEqual({ widthPct: 100, tone: "over" });
  });

  it("treats a zero or negative budget as an empty track rather than dividing by zero", () => {
    expect(computeBarReading(50, 0)).toEqual({ widthPct: 0, tone: "spend" });
    expect(computeBarReading(50, -10)).toEqual({ widthPct: 0, tone: "spend" });
  });

  it("treats negative spend (a refund) as nothing spent, not a negative bar", () => {
    expect(computeBarReading(-20, 100)).toEqual({ widthPct: 0, tone: "spend" });
  });

  it("is stable under floating point spend/budget values", () => {
    const reading = computeBarReading(33.33, 100);
    expect(reading.tone).toBe("spend");
    expect(reading.widthPct).toBeCloseTo(33.33, 5);
  });
});
