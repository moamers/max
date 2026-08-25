/**
 * The one place a pound figure is turned into text.
 *
 * There were five of these, written one screen at a time, and they disagreed:
 * the home screen kept pence, the week detail rounded to whole pounds, the
 * insights narrative rounded too. The same week then read "£397 spent" on one
 * screen and "£294.33" on another, and the founder — who checks the app against
 * his own spreadsheet — reasonably read that as the app getting the arithmetic
 * wrong. It wasn't; it was two formatters. A figure that changes when you open
 * it is a figure you have to take on faith (B-8).
 *
 * So: one module, and `src/lib/__tests__/one-money-formatter.test.ts` scans the
 * source to stop a sixth appearing. If a screen needs a different presentation,
 * add a named function here rather than a local `gbp` helper.
 */

const PENCE = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const WHOLE = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * A single `maximumFractionDigits: 2` formatter renders £396.60 as "£396.6",
 * which is not a way anyone writes money. Pence are all-or-nothing, so the
 * decision is per-figure rather than per-formatter.
 */
function hasPence(amount: number): boolean {
  return Math.round(Math.abs(amount) * 100) % 100 !== 0;
}

function exact(amount: number): Intl.NumberFormat {
  return hasPence(amount) ? PENCE : WHOLE;
}

/**
 * "£1,234.56" / "£190" — pence when the figure has them, whole pounds when it
 * doesn't. The default: every figure the user can check against a statement or
 * a spreadsheet goes through this.
 */
export function formatGBP(amount: number): string {
  return exact(amount).format(amount);
}

/**
 * "£1,235" — deliberately rounded, for copy that already says "about". Never
 * use this for a figure presented as exact; the whole point of the name is that
 * a reader of the calling code can see the rounding was chosen.
 */
export function formatGBPApprox(amount: number): string {
  return WHOLE.format(amount);
}

/** "+£1,108" / "-£240" — the year strip's signed net position. */
export function formatSignedGBP(amount: number): string {
  const sign = amount < 0 ? "-" : "+";
  const magnitude = Math.abs(amount);
  return `${sign}${exact(magnitude).format(magnitude)}`;
}

/**
 * "£1,234.56" / "−£240" — same figures as `formatGBP`, with a typographic
 * minus (U+2212) for negatives, which is what the money screens' design uses.
 */
export function formatMoney(amount: number): string {
  const sign = amount < 0 ? "−" : "";
  const magnitude = Math.abs(amount);
  return `${sign}${exact(magnitude).format(magnitude)}`;
}
