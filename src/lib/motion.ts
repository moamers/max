/**
 * Reading a duration token from CSS, without getting the unit wrong.
 *
 * `parseFloat` on a CSS time is a trap. The stylesheet says `320ms`, but the
 * build's CSS minifier normalises that to the shorter `.32s`, and
 * `parseFloat(".32s")` is `0.32`. Used as milliseconds that is a third of a
 * millisecond — an animation that technically runs and is over before a single
 * frame. Every moment built this way looked like nothing happening at all,
 * which is indistinguishable from not having built it.
 *
 * So the unit is read, not assumed. Both spellings are legal CSS and either
 * may come back depending on whether the stylesheet was minified.
 */
export function cssTimeMs(value: string): number {
  const text = value.trim();
  if (text === "") return 0;
  const amount = parseFloat(text);
  if (!Number.isFinite(amount)) return 0;
  if (text.endsWith("ms")) return amount;
  if (text.endsWith("s")) return amount * 1000;
  // A bare number in a time token is a mistake, but treating it as
  // milliseconds matches what the author of `320` would have meant.
  return amount;
}

/** The computed value of a custom property on the document root. */
export function motionToken(name: string, root: Element = document.documentElement): number {
  return cssTimeMs(getComputedStyle(root).getPropertyValue(name));
}
