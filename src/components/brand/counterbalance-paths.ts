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
