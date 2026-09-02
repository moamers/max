/**
 * The nav pill's measurements, in one place.
 *
 * Three scrolling regions, one FAB and the fold all measure against this bar.
 * A number that lives in two files is a number that will disagree with itself
 * — and when the fold's copy disagreed, the symptom was the pill dimming on
 * every scope change, which reads as the navigation flickering rather than as
 * a wrong constant.
 *
 * Numbers only: no JSX, no imports. `fold-runtime.ts` is a client module and
 * must not drag `next/link` and a component tree into its bundle to find out
 * how tall the bar is.
 */

/** The bar itself. */
export const PILL_HEIGHT = 56;

/**
 * The floor under the pill when the platform reports no safe-area inset.
 *
 * MEASURED, not chosen. From a screenshot of the app on a 440x956 phone at
 * DPR 3: the pill's bottom edge sat 45 device pixels — 15 CSS px — off the
 * physical bottom of the screen, sitting on top of the home indicator. The
 * old value was 14px plus `env(safe-area-inset-bottom)`, and the inset was
 * contributing exactly nothing.
 *
 * It contributes nothing because the app never asks for it: `env()` insets
 * resolve to 0 unless the page opts in with `viewport-fit=cover`, which this
 * app does not, because doing so also pushes every screen's TOP under the
 * status bar and that is a change with its own blast radius. So the floor has
 * to be a real number rather than a nudge on top of a zero.
 *
 * 32 is the gesture area a phone keeps for itself — iOS reserves 34 for the
 * home indicator, Android around 24 for the gesture bar — and the 12 above it
 * is clear air, so the bar floats over that region instead of sitting in it.
 */
export const PILL_GESTURE_FLOOR = 32;
/** Clear air between the gesture area and the bar. */
export const PILL_GESTURE_AIR = 12;
/** Air between the content above and the bar. */
export const PILL_TOP_GAP = 14;

/**
 * How far the bar's lower edge sits above the bottom of the screen.
 *
 * `max()` rather than a sum, so the bar lands in the same visual place whether
 * or not the platform reports an inset: 44px where it reports none, 46px on an
 * iPhone that reports 34. A page that opts into `viewport-fit=cover` later
 * gets the real number with nothing here to change.
 *
 * The `0px` fallback in `env()` is not decoration: an `env()` reference with
 * no fallback whose variable is undefined makes the whole declaration invalid
 * at computed-value time, which would drop the property entirely.
 */
export function navBottomGap(): string {
  return `calc(max(env(safe-area-inset-bottom, 0px), ${PILL_GESTURE_FLOOR}px) + ${PILL_GESTURE_AIR}px)`;
}

/** Enough for four words at `--type-label` without crowding on a 393px frame. */
export const PILL_MAX_WIDTH = 420;

/**
 * A fallback for the strip the bar paints into, in px, for the one caller that
 * needs a number before it can measure: the fold, when no bar is on screen.
 *
 * The real answer is `getBoundingClientRect()` on the bar itself — the gap
 * below it is a CSS `max()` over a platform value and cannot be computed in
 * JavaScript. This is what to assume when there is nothing to measure.
 */
export const NAV_PAINTED_HEIGHT_FALLBACK =
  PILL_GESTURE_FLOOR + PILL_GESTURE_AIR + PILL_HEIGHT + 12;
