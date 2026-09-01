/**
 * What a highlighted cell means, decided once and inspectably.
 *
 * The founder highlights rows in his sheet in yellow to mean "this hasn't
 * actually gone out yet". That is `pending` in this app. Reading it back is
 * the only way an import can carry the distinction he already makes by hand.
 *
 * B-8 / doctrine 5: this parser has misread real data twice, and both times the
 * bug was silent. So the rule is written down here as a pure function over a
 * colour rather than buried in the parser, and it is tested against workbooks
 * generated with the same library that reads them.
 *
 * **The asymmetry that decides every judgement call below.** A false negative
 * means the user marks one row pending themselves. A false positive means Ravel
 * silently claims a settled bill is unsettled — a claim about their money that
 * they did not make. So anything we cannot resolve confidently is *not*
 * highlighted:
 *
 *  - no fill, or `pattern: "none"` → not highlighted
 *  - a non-solid pattern (hatches, trellises) → not highlighted. Its rendered
 *    colour is a blend of two colours over a pattern we would have to guess at.
 *  - a gradient fill → not highlighted. There is no single colour to classify.
 *  - a theme colour (`{ theme, tint }`) → not highlighted. Themes are defined
 *    per workbook in `theme1.xml`, and exceljs exposes no public way to resolve
 *    one to sRGB. Guessing at the Office default would be a guess about
 *    somebody's money.
 *  - an ARGB whose alpha byte is below half → not highlighted. A colour that is
 *    mostly transparent is not a highlight anyone can see.
 *
 * Indexed colours are the one place we do resolve rather than decline: the
 * ECMA-376 default palette below is fixed, and legacy sheets converted from
 * .xls carry indexed yellows. A workbook that overrides `<indexedColors>` in
 * its styles part would be misread — exceljs does not surface a custom palette,
 * so that risk is accepted knowingly and stated rather than hidden.
 */
import type ExcelJS from "exceljs";

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/**
 * What exceljs actually hands back for a colour. Its published `Color` type
 * names only `argb` and `theme`, but the reader emits `indexed` and `tint` too,
 * so the shape is widened here rather than asserted at each use.
 */
export interface SheetColour {
  argb?: string;
  theme?: number;
  indexed?: number;
  tint?: number;
}

/**
 * The ECMA-376 default indexed palette (§18.8.27, `indexedColors`). Entries 64
 * and 65 are the system foreground/background, which have no fixed value, so
 * the table stops at 63.
 */
export const DEFAULT_INDEXED_PALETTE: readonly string[] = [
  "000000", "FFFFFF", "FF0000", "00FF00", "0000FF", "FFFF00", "FF00FF", "00FFFF",
  "000000", "FFFFFF", "FF0000", "00FF00", "0000FF", "FFFF00", "FF00FF", "00FFFF",
  "800000", "008000", "000080", "808000", "800080", "008080", "C0C0C0", "808080",
  "9999FF", "993366", "FFFFCC", "CCFFFF", "660066", "FF8080", "0066CC", "CCCCFF",
  "000080", "FF00FF", "FFFF00", "00FFFF", "800080", "800000", "008080", "0000FF",
  "00CCFF", "CCFFFF", "CCFFCC", "FFFF99", "99CCFF", "FF99CC", "CC99FF", "FFCC99",
  "3366FF", "33CCCC", "99CC00", "FFCC00", "FF9900", "FF6600", "666699", "969696",
  "003366", "339966", "003300", "333300", "993300", "993366", "333399", "333333",
];

/** Alpha at or above this is treated as opaque enough to be a visible highlight. */
const MIN_ALPHA = 0x80;

function hexToRgb(hex: string): Rgb | null {
  const clean = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]+$/.test(clean)) return null;
  if (clean.length === 8) {
    if (parseInt(clean.slice(0, 2), 16) < MIN_ALPHA) return null;
    return hexToRgb(clean.slice(2));
  }
  if (clean.length !== 6) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/** The sRGB behind a colour, or null when it cannot be resolved without guessing. */
export function colourToRgb(colour: SheetColour | undefined | null): Rgb | null {
  if (!colour) return null;
  if (typeof colour.argb === "string") return hexToRgb(colour.argb);
  if (typeof colour.indexed === "number") {
    const hex = DEFAULT_INDEXED_PALETTE[colour.indexed];
    return hex ? hexToRgb(hex) : null;
  }
  // A theme colour reaches here and stays unresolved on purpose — see the note above.
  return null;
}

/**
 * Is this colour a yellow highlight?
 *
 * Stated as four conditions on the channels rather than a hex whitelist,
 * because real sheets carry FFFF00, FFFFCC, FFEB9C and every shade a person
 * picked out of the colour grid:
 *
 *  1. `r >= 180` — a highlight is a light, warm colour. Olive (808000) is a
 *     dark yellow by hue and nobody's highlighter.
 *  2. `g >= 0.8 * r` and `g <= 1.05 * r` — green nearly matches red. Below that
 *     band is orange or gold (Excel's own "Orange" is FFC000, ratio 0.75, and
 *     the founder's sheet already uses FF9900 for budget rows); above it is
 *     lime or green.
 *  3. `b <= 0.85 * g` — blue is clearly the weakest channel. Otherwise it is a
 *     grey, a cream or white.
 *  4. `r - b >= 40` — there is real colour here. Near-white (FFFFF2) is not a
 *     highlight, and calling it one would mark a settled row unsettled.
 */
export function isYellowRgb(rgb: Rgb | null): boolean {
  if (!rgb) return false;
  const { r, g, b } = rgb;
  return r >= 180 && g >= 0.8 * r && g <= 1.05 * r && b <= 0.85 * g && r - b >= 40;
}

/**
 * Is this cell fill a yellow highlight? Everything that isn't confidently
 * yellow is confidently not — see the module note for why that direction.
 */
export function isYellowFill(fill: ExcelJS.Fill | undefined | null): boolean {
  if (!fill || fill.type !== "pattern") return false;
  // For a solid pattern fill the foreground colour is the colour you see.
  if (fill.pattern !== "solid") return false;
  return isYellowRgb(colourToRgb(fill.fgColor as SheetColour | undefined));
}
