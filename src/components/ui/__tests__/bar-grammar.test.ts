import { describe, it, expect } from "vitest";
import { computeBarReading } from "../bar-grammar";

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

describe("the fill ramp measures the track, not the fill", () => {
  // The gradient is painted across the whole budget and the fill reveals the
  // left part of it. Without this, every bar would show the full green-to-red
  // ramp compressed into its own width, so a 10%-full bar would look as urgent
  // as a full one.
  it("scales the gradient so a quarter-full bar shows only the first quarter", () => {
    expect(computeBarReading(25, 100).gradientSizePct).toBeCloseTo(400, 6);
  });

  it("paints the gradient at exactly the track width when full", () => {
    expect(computeBarReading(100, 100).gradientSizePct).toBeCloseTo(100, 6);
  });

  it("keeps the ramp calm at half a budget", () => {
    const half = computeBarReading(50, 100);
    expect(half.tone).toBe("spend");
    // 200% means only the first half of the ramp is visible, which is all in
    // the calm stops.
    expect(half.gradientSizePct).toBeCloseTo(200, 6);
  });

  it("drops the ramp entirely once over budget", () => {
    // Past the limit there is nothing left to approach, so the fill is flat red.
    expect(computeBarReading(150, 100).tone).toBe("over");
    expect(computeBarReading(150, 100).widthPct).toBe(100);
  });

  it("does not divide by zero on an empty bar", () => {
    const empty = computeBarReading(0, 100);
    expect(empty.widthPct).toBe(0);
    expect(Number.isFinite(empty.gradientSizePct)).toBe(true);
  });
});
