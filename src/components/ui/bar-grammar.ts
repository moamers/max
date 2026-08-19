/**
 * "The one chart grammar" — docs/design/handoff/README.md.
 *
 * There is exactly one bar in the app and it means one thing:
 *  - the whole track IS the budget (target)
 *  - the fill is what has been spent, width = min(spend / budget, 1) * 100%
 *  - the empty remainder is what is left — never coloured
 *  - once spend exceeds budget the WHOLE fill turns red at 100% width;
 *    the magnitude of the overspend is carried by the number, never by
 *    bar length (there is no headroom beyond 100%, no notch)
 *  - lime never appears inside a bar
 *
 * This mirrors the prototype's own `bar(spend, budget)` method exactly
 * (docs/design/handoff/Max App v1.dc.html, ~line 947):
 *
 *   bar(spend, budget) {
 *     const pct = budget > 0 ? spend / budget * 100 : 0;
 *     if (pct <= 0) return [];
 *     return [{ x: 0, w: Math.min(pct, 100), c: pct > 100 ? this.over() : '#7A8296' }];
 *   }
 */

export type BarTone = "spend" | "over";

export interface BarReading {
  /** Fill width as a percentage of the track, already clamped to [0, 100]. */
  widthPct: number;
  /** Which colour role the fill should use. */
  tone: BarTone;
}

/**
 * Pure width/colour computation for the one bar grammar. No rendering, no
 * React — kept isolated so the rule that was "iterated on hard" has one
 * small, exhaustively-testable surface.
 */
export function computeBarReading(spend: number, budget: number): BarReading {
  const pct = budget > 0 ? (spend / budget) * 100 : 0;
  if (pct <= 0) {
    return { widthPct: 0, tone: "spend" };
  }
  return {
    widthPct: Math.min(pct, 100),
    tone: pct > 100 ? "over" : "spend",
  };
}
