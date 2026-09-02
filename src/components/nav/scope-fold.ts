/**
 * THE FOLD — which direction a scope change travels.
 *
 * Week, Month and Year are three widths of the same lens, not three unrelated
 * places, so moving between them has a direction: widening out to a longer
 * span, or narrowing in to a shorter one. Naming that direction is what makes
 * "back" the exact inverse of "forward" rather than two unrelated animations
 * that happen to run on the same pair of screens.
 *
 * Settings is not a scope. It is a layer over whatever you were looking at, so
 * it neither widens nor narrows and gets no direction.
 */
export type Scope = "week" | "month" | "year";
export type FoldDirection = "scope-out" | "scope-in";

/** Week is the narrowest lens, year the widest. */
const WIDTH: Record<Scope, number> = { week: 0, month: 1, year: 2 };

export function isScope(value: string): value is Scope {
  return value === "week" || value === "month" || value === "year";
}

/**
 * The transition type for travelling `from` one scope `to` another, or null
 * when there is no direction to encode — the same scope, or a destination that
 * is not a scope at all.
 */
export function foldDirection(from: string, to: string): FoldDirection | null {
  if (!isScope(from) || !isScope(to) || from === to) return null;
  return WIDTH[to] > WIDTH[from] ? "scope-out" : "scope-in";
}

/**
 * What the pair of figures on either side of a fold have in common — which is
 * usually nothing.
 *
 * A shared-element transition requires a shared element. Week shows what is
 * left of a week, Month what a month has spare, Year what a year has kept:
 * three different questions with three different answers. Morphing between
 * them would cross-dissolve one number into another, which reads as double
 * vision rather than continuity — the prototype did exactly that between Week
 * and Year and it is recorded as a defect in Task E.
 *
 * So no headline morphs. What genuinely persists across all three is the
 * chrome — the pill, and the period the whole app is currently looking at —
 * and that is what carries the continuity instead.
 */
export const FOLD_SHARED_CHROME = {
  nav: "ravel-scope-nav",
  period: "ravel-scope-period",
} as const;

/**
 * How far a screen travels on the Z axis when the lens changes width.
 *
 * Two numbers, and the second is derived from the first on purpose: the fold
 * out and the fold in must be exact inverses, or "back" is a second animation
 * that merely resembles the first. Written as a reciprocal, that property is a
 * fact about the constants rather than a promise in a comment — scaling by
 * `receding` and then by `advancing` returns you to where you started.
 *
 * 3.5% is deliberately small. This is a hint of depth on a phone held at arm's
 * length, not a zoom; anything larger reads as the screen lurching, and this
 * app does not startle people about money.
 */
export const FOLD_SCALE = {
  /** Falling away from the viewer — the screen you are leaving behind. */
  receding: 0.965,
  /** Coming toward the viewer — the screen you are moving into. */
  advancing: 1 / 0.965,
} as const;

/**
 * The pair of scales a fold in this direction uses: what the outgoing screen
 * goes to, and what the incoming screen comes from.
 *
 * Widening out to a longer span, the old narrow view falls back into the wider
 * one that contained it, and the new view opens from slightly in front.
 * Narrowing in, both reverse: the old view enlarges past you as you move into
 * it, and the new one comes forward out of the span that held it.
 */
export function foldScales(direction: FoldDirection): { leaves: number; arrives: number } {
  return direction === "scope-out"
    ? { leaves: FOLD_SCALE.receding, arrives: FOLD_SCALE.advancing }
    : { leaves: FOLD_SCALE.advancing, arrives: FOLD_SCALE.receding };
}

/* -------------------------------------------------------------- the parts */

/**
 * The whole screen, as one box. Every scope screen is its own frame, so this
 * is the thing a fold photographs on the way out.
 */
export const FOLD_SCREEN = "data-fold-screen";
/**
 * The part of a screen that folds: everything except the chrome that persists
 * across the fold. Marked per screen rather than derived, because "everything
 * except the nav" is a fact about a layout, and guessing it from the DOM is
 * how a fold ends up dragging the pill around with it.
 */
export const FOLD_BODY = "data-fold-body";
/**
 * Chrome that survives the fold untouched — today, the nav pill. It is removed
 * from the outgoing photograph so it never appears twice, and it sits outside
 * every `[data-fold-body]` so it never scales or fades.
 */
export const FOLD_CHROME = "data-fold-chrome";
