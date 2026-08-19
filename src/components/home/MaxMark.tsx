/**
 * The Max mark — README "Assets": two inline SVG paths, a blob in text
 * colour plus a lime leaf. Used by the month bar (small) and the menu
 * drawer (slightly larger); not a `ui/` primitive because nothing outside
 * these two screen-owned spots uses it.
 */
export function MaxMark({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ overflow: "visible", flexShrink: 0 }} aria-hidden>
      <path
        d="M46,95 C25,93 13,77 17,57 C20,41 34,29 52,30 C71,31 85,44 84,63 C83,79 71,92 58,94 C54,95 50,95 46,95 Z"
        fill="var(--text-primary)"
      />
      <path d="M53,30 C52,16 61,6 78,3 C79,17 70,28 53,30 Z" fill="var(--lime-fill)" />
    </svg>
  );
}
