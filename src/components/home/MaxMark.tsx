import { MAX_MARK_BODY, MAX_MARK_LEAF, MAX_MARK_VIEWBOX } from "./max-mark-paths";

/**
 * The Max mark — README "Assets": two inline SVG paths, a blob in text
 * colour plus a lime leaf. Used by the month bar (small) and the menu
 * drawer (slightly larger); not a `ui/` primitive because nothing outside
 * these two screen-owned spots uses it.
 *
 * The geometry lives in `max-mark-paths.ts` because the app icon draws the
 * same two paths, and it cannot use CSS variables.
 */
export function MaxMark({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox={MAX_MARK_VIEWBOX} width={size} height={size} style={{ overflow: "visible", flexShrink: 0 }} aria-hidden>
      <path d={MAX_MARK_BODY} fill="var(--text-primary)" />
      <path d={MAX_MARK_LEAF} fill="var(--lime-fill)" />
    </svg>
  );
}
