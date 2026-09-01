/**
 * What a tape is, and the one rule it has to keep.
 *
 * D-5: "a number the user can't trace is a number they have to take on faith."
 * The Tape is that doctrine as an interaction — touch a figure and its evidence
 * unfolds beneath it. The parser has misread real financial data twice (F-1,
 * F-3 in docs/00-open-decisions.md) and both were caught by opening a figure
 * up, not by reading code.
 *
 * Which makes the rule non-negotiable: **every block sums to the figure it
 * opens**. A tape whose lines do not add up to the number above them is worse
 * than no tape at all — it is a second, wrong claim about the same money,
 * presented as the working.
 *
 * So a block is *checked*, not trusted, and a block that does not reconcile is
 * never offered. The figure simply does not open. That is the honest failure:
 * "we cannot show you where this came from" rather than a plausible list that
 * lands somewhere else.
 *
 * Pure, and separate from the component, so the arithmetic can be tested
 * without a DOM — see `__tests__/tape.test.ts`.
 */

export interface TapeLine {
  /**
   * What the line is. Where it names something the user wrote — a category
   * title, a merchant — it is their words, verbatim (AGENTS.md 3).
   */
  label: string;
  /**
   * Signed by what it contributes to the figure. Money coming in is positive,
   * money going out is negative, and the sign is shown rather than implied by
   * where the line sits in the list.
   */
  amount: number;
}

export interface TapeBlock {
  lines: TapeLine[];
  /** The figure this opens. `lines` must add up to exactly this. */
  total: number;
  /** What the figure is called on the closing line. */
  totalLabel: string;
}

/** Pence, in pounds. Every figure in this app is a pound amount as a float. */
const HALF_A_PENNY = 0.005;

export function sumOfLines(lines: readonly TapeLine[]): number {
  return lines.reduce((sum, line) => sum + line.amount, 0);
}

/**
 * Does the working actually reach the figure?
 *
 * Tolerance is half a penny, which is the width of the rounding that money
 * formatting does anyway — not a fudge factor. Anything wider would let a real
 * discrepancy through, which is the entire failure mode this guards.
 */
export function tapeReconciles(block: TapeBlock): boolean {
  return Math.abs(sumOfLines(block.lines) - block.total) < HALF_A_PENNY;
}

/**
 * The block, or nothing. Call this at every site that offers a tape: a figure
 * whose evidence does not add up is a figure that does not open.
 */
export function openableTape(block: TapeBlock | null): TapeBlock | null {
  if (block === null) return null;
  if (block.lines.length === 0) return null;
  return tapeReconciles(block) ? block : null;
}
