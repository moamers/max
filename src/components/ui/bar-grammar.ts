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
 *
 * DEVIATION FROM THE HANDOFF, at the founder's request: the fill is a ramp
 * rather than flat grey. The gradient is painted across the *track*, and the
 * fill reveals the left part of it — so the colour at any point means "this
 * much of the budget", and a half-full bar is entirely calm because it has not
 * reached the warm stops yet.
 *
 * The stops sit deliberately late (calm to 70%, warming through 85%, warm at
 * the end). This app is for people who feel judged by money apps, so a bar that
 * reddens early would be the product working against itself. It stays quiet
 * until the number is genuinely worth looking at.
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
  /**
   * How wide the gradient must be painted, as a percentage of the *fill*, so
   * that it spans the whole track. A 25%-full bar paints its gradient at 400%
   * and therefore shows only the first quarter of the ramp.
   */
  gradientSizePct: number;
}

/**
 * Pure width/colour computation for the one bar grammar. No rendering, no
 * React — kept isolated so the rule that was "iterated on hard" has one
 * small, exhaustively-testable surface.
 */
export function computeBarReading(spend: number, budget: number): BarReading {
  const pct = budget > 0 ? (spend / budget) * 100 : 0;
  if (pct <= 0) {
    return { widthPct: 0, tone: "spend", gradientSizePct: 100 };
  }
  const widthPct = Math.min(pct, 100);
  return {
    widthPct,
    tone: pct > 100 ? "over" : "spend",
    // Scale the gradient so it always measures the track, never the fill.
    gradientSizePct: (100 / widthPct) * 100,
  };
}
