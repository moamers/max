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
 * Gap below the pill (above the home indicator) and above it (over content).
 *
 * Was 14. Raised on the founder's read of it on a real phone: at 14 the bar
 * sits close enough to the bottom edge that on a device with no home
 * indicator it looks like it is falling off the screen rather than floating
 * over it.
 */
export const PILL_INSET = 22;

/** Enough for four words at `--type-label` without crowding on a 393px frame. */
export const PILL_MAX_WIDTH = 420;

/**
 * How far up the screen the bar actually paints: the gap beneath it, the bar,
 * and enough beyond for its shadow.
 *
 * NOT the same as `navClearance()`, which also reserves the gap ABOVE the bar
 * so content does not crowd it. That extra gap is space the page may still
 * paint into — it is only clearance — so masking it out of the fold's
 * photograph would erase a strip of real content for no reason. This is the
 * narrower number: the strip the pill genuinely covers, which is the only
 * strip the outgoing screen must not be drawn over.
 */
export const NAV_PAINTED_HEIGHT = PILL_INSET + PILL_HEIGHT + 12;
