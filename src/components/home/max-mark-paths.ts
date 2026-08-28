/**
 * The Max mark's geometry, in one place.
 *
 * `MaxMark.tsx` renders these for the screens (in theme colours, via CSS
 * variables); `src/app/icon-mark.tsx` renders the same two paths for the app
 * icon (where there are no CSS variables, so the colours are passed in).
 * Extracted so the mark on the home screen and the mark on the phone's home
 * screen cannot become two different shapes.
 */

/** The body, in text colour. */
export const MAX_MARK_BODY =
  "M46,95 C25,93 13,77 17,57 C20,41 34,29 52,30 C71,31 85,44 84,63 C83,79 71,92 58,94 C54,95 50,95 46,95 Z";

/** The leaf, in brand lime. */
export const MAX_MARK_LEAF = "M53,30 C52,16 61,6 78,3 C79,17 70,28 53,30 Z";

/** The coordinate space both paths are drawn in. */
export const MAX_MARK_VIEWBOX = "0 0 100 100";
