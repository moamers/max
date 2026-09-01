/**
 * The one rule a tape has: it sums to the figure it opens.
 *
 * A tape whose lines do not add up to the number above them is worse than no
 * tape. It is a second claim about the same money, dressed as the working, in
 * a product whose parser has already misread real data twice — and the reason
 * this feature exists at all is that both of those defects were caught by
 * opening a figure up.
 *
 * So the arithmetic is checked, not trusted, and it is checked here rather
 * than in a component so the check does not need a DOM to run.
 */
import { describe, it, expect } from "vitest";
import { openableTape, sumOfLines, tapeReconciles, type TapeBlock } from "../tape-grammar";

const block = (lines: [string, number][], total: number): TapeBlock => ({
  lines: lines.map(([label, amount]) => ({ label, amount })),
  total,
  totalLabel: "Total",
});

describe("a tape adds up", () => {
  it("sums signed lines", () => {
    expect(sumOfLines(block([["in", 100], ["out", -40]], 60).lines)).toBe(60);
  });

  it("accepts a block whose lines reach the figure", () => {
    expect(tapeReconciles(block([["Income", 3000], ["Weeks", -1200], ["Recurring", -900]], 900))).toBe(true);
  });

  it("rejects one that lands somewhere else", () => {
    expect(tapeReconciles(block([["Income", 3000], ["Weeks", -1200]], 900))).toBe(false);
  });

  it("tolerates half a penny of float drift and nothing wider", () => {
    // 0.1 + 0.2 is famously not 0.3. Pence arithmetic on floats drifts by
    // fractions of a penny and must not fail; a penny of real disagreement
    // must.
    expect(tapeReconciles(block([["a", 0.1], ["b", 0.2]], 0.3))).toBe(true);
    expect(tapeReconciles(block([["a", 10]], 10.01))).toBe(false);
  });

  it("is not fooled by lines that cancel out into the right total by luck", () => {
    // Same total, genuinely different working — reconciling is necessary, not
    // sufficient, and this only pins that the check reads every line.
    expect(tapeReconciles(block([["a", 50], ["b", 50]], 100))).toBe(true);
    expect(tapeReconciles(block([["a", 50], ["b", 50], ["c", 1]], 100))).toBe(false);
  });
});

describe("a figure whose working does not add up does not open", () => {
  it("passes a block through when it reconciles", () => {
    const good = block([["Income", 100], ["Out", -25]], 75);
    expect(openableTape(good)).toBe(good);
  });

  it("returns null rather than showing a plausible list that lands elsewhere", () => {
    expect(openableTape(block([["Income", 100], ["Out", -25]], 80))).toBeNull();
  });

  it("returns null for an empty block, which explains nothing", () => {
    expect(openableTape(block([], 0))).toBeNull();
  });

  it("passes null through", () => {
    expect(openableTape(null)).toBeNull();
  });
});
