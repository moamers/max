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
