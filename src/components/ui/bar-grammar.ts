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
 * HISTORY, in two rounds, because this has been argued twice.
 *
 * Round one: the fill was a four-stop ramp (health -> money -> attention ->
 * spark) across the whole track, so the colour at any point meant "this much
 * of the budget". Reversed on review — at 3-12px tall four stops read as
 * decoration rather than four stages, and it put magnitude into colour, which
 * is the one thing this grammar forbids.
 *
 * Round two: the founder asked for it back, narrower — two colours, with the
 * warning appearing only close to the right end. That is what ships now, and
 * it is a different proposition from round one. It is not four stages, it is
 * one; the bar is flat for the first 72% of the TRACK and only then turns
 * toward the colour it will become if the target is passed. Where the warning
 * appears is a fact about the budget, not about the bar's length, because the
 * ramp is painted in track coordinates and the fill clips it.
 *
 * What did NOT change, and must not: length never carries the overspend.
 * Past the target the whole fill goes over-colour at 100% width, and the
 * magnitude lives in the number. This app is for people who feel judged by
 * money apps, so the ramp is a heads-up near the line, not an escalating
 * alarm from the first pound spent.
 *
 * `tone` below is still binary — spend or over — because the ramp is a
 * rendering concern, not a state. Approaching a limit is not a state change.
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

/**
 * How wide the ramp has to be painted so that it spans the TRACK rather than
 * the fill.
 *
 * `background-size` is a percentage of the element it is on — the fill — so a
 * gradient left at 100% would compress into whatever the fill happens to be,
 * putting the warning colour at the tip of every bar including one at 10%.
 * Scaling it by track/fill puts the ramp back in track coordinates: the
 * warning appears at the same place on the budget every time, and a short fill
 * simply does not reach it.
 *
 * Returns 100 for an empty bar. Nothing is painted there, and it keeps the
 * division out of the caller.
 */
export function rampBackgroundSizePct(widthPct: number): number {
  if (!(widthPct > 0)) return 100;
  return (100 / widthPct) * 100;
}
