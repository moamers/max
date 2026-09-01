/**
 * The Counterbalance mark's geometry, in one place.
 *
 * Taken verbatim from the Ravel brand kit's SVG masters
 * (`logos/svg/ravel-*-symbol.svg`, copied into `public/brand/logos/`). Every
 * theme variant in the kit draws these same three paths and changes only the
 * fills, so the geometry is stored once and the colour is supplied by the
 * caller — the kit's own instruction: "Keep the mark's geometry unchanged;
 * only the mapped theme colours change."
 *
 * `Counterbalance.tsx` renders these in theme colours via CSS variables;
 * `src/app/icon.tsx` renders the same three paths for the app icon, where
 * there are no CSS variables and the colours are passed in. Extracted so the
 * mark in the app and the mark on the phone's home screen cannot drift apart.
 */

/** The upper-left form. Painted in the theme's primary. */
export const COUNTERBALANCE_A =
  "M24 53C24 38 36 27 50 27C68 25 87 29 104 28C118 27 124 39 118 52L96 108C90 123 73 129 57 122L44 116C31 110 24 96 24 81Z";

/** The lower-right form — the counterweight. Painted in the theme's health colour. */
export const COUNTERBALANCE_B =
  "M156 127C156 142 144 153 130 153C112 155 93 151 76 152C62 153 56 141 62 128L84 72C90 57 107 51 123 58L136 64C149 70 156 84 156 99Z";

/**
 * The intersection: form B again, clipped to form A. The kit paints it in the
 * theme's spark colour, which is what makes the two halves read as overlapping
 * rather than merely adjacent.
 */
export const COUNTERBALANCE_VIEWBOX = "0 0 180 180";

/** The kit's app-icon geometry: a 1024 tile, 224 corner radius, mark inset. */
export const APP_ICON_SIZE = 1024;
export const APP_ICON_RADIUS = 224;
export const APP_ICON_MARK_OFFSET = 134;
export const APP_ICON_MARK_SCALE = 4.2;

/**
 * The wordmark, as outlined vectors.
 *
 * Taken verbatim from the kit's `-lockup-outlined.svg` masters, where the five
 * letters sit in one `<g aria-label="Ravel">` whose only per-theme difference
 * is the group fill. Verified identical across all four theme/mode variants
 * before being stored once — same rule as the mark above.
 *
 * These are OUTLINES, not text, and that is deliberate. The kit sets the
 * wordmark in URW Gothic 400 at -4/86em tracking; the app's UI face is not
 * URW Gothic, so live text rendered the name in whatever the app happened to
 * be using (it was Schibsted Grotesk at weight 800) — a different face, a
 * different weight and a different fit, decided by nobody. Licensing a display
 * face for five letters would be the expensive way to fix that. Outlines are
 * the cheap one, and a logotype is explicitly exempt from WCAG's
 * images-of-text rule (1.4.5) — the accessible name is carried by aria-label.
 */
export const WORDMARK_PATHS: readonly string[] = [
  "m 228.874,94.264 c 12.212,-1.29 18.748,-7.998 18.748,-19.436 0,-7.912 -3.354,-13.932 -9.546,-17.286 -3.956,-2.15 -9.374,-3.096 -17.802,-3.096 H 204.536 V 118 H 210.9 V 60.208 h 8.944 c 6.708,0 11.18,0.688 14.62,2.322 4.3,2.064 6.708,6.364 6.708,12.126 0,7.224 -3.268,11.782 -9.632,13.416 -3.01,0.774 -7.138,1.118 -14.19,1.118 L 238.764,118 h 7.912 z",
  "m 299.0921,70.958 h -6.364 V 79.3 c -4.73,-6.536 -10.406,-9.46 -18.576,-9.46 -14.104,0 -24.768,10.664 -24.768,24.768 0,14.104 10.75,24.51 25.284,24.51 7.998,0 12.986,-2.58 18.06,-9.374 V 118 h 6.364 z m -24.768,4.73 c 10.406,0 18.404,8.084 18.404,18.576 0,10.75 -7.912,19.006 -18.06,19.006 -10.664,0 -18.834,-8.342 -18.834,-19.092 0,-10.234 8.256,-18.49 18.49,-18.49 z",
  "m 321.23617,118 h 6.708 l 19.78,-47.042 h -6.45 l -16.856,39.56 -16.512,-39.56 h -6.45 z",
  "m 395.06629,96.586 c 0,-6.45 -0.86,-10.406 -3.182,-14.534 -4.214,-7.568 -12.384,-12.212 -21.414,-12.212 -13.674,0 -24.338,10.75 -24.338,24.424 0,13.932 10.922,24.854 24.854,24.854 10.234,0 19.436,-6.622 22.876,-16.598 h -6.622 c -2.666,6.45 -9.288,10.75 -16.426,10.75 -9.718,0 -17.802,-7.396 -18.318,-16.684 z m -42.398,-5.762 c 1.72,-9.03 8.858,-15.136 17.802,-15.136 9.116,0 15.996,5.676 18.232,15.136 z",
  "m 400.26819,118 h 6.364 V 54.446 h -6.364 z",
];

/**
 * The lockup's own frame. The mark occupies y 25-155 of these 180 units, so a
 * lockup drawn to put the mark at N pixels needs a height of N * 180 / 130 —
 * see MARK_TO_LOCKUP below. Getting this wrong is the easy mistake: rendering
 * the whole 520x180 lockup at the mark's own pixel size shrinks the letters to
 * about a third of their intended size.
 */
export const LOCKUP_VIEWBOX = "0 0 520 180";
export const MARK_TO_LOCKUP = 180 / 130;
