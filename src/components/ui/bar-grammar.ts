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
 * HISTORY. For a while the fill was a four-stop ramp (health -> money ->
 * attention -> spark) painted across the track, a deviation from the handoff
 * made at the founder's request so that the colour at any point meant "this
 * much of the budget". It has been reversed, on review, for two reasons:
 *
 *   1. At 3-12px tall, at arm's length, four stops do not read as four stages.
 *      They read as a gradient, which is decoration.
 *   2. It made colour encode magnitude. That is the one thing this file says
 *      never to do — magnitude lives in the number.
 *
 * What the ramp got right is kept: the bar stays quiet. It is one solid fill
 * that changes colour ONLY at a real state change (passing the target), and
 * that state is carried by the number and the words too, never by colour
 * alone. This app is for people who feel judged by money apps, so a bar that
 * reddens on the way to a limit would be the product working against itself.
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
  const widthPct = Math.min(pct, 100);
  return { widthPct, tone: pct > 100 ? "over" : "spend" };
}
