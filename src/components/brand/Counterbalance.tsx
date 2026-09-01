import {
  COUNTERBALANCE_A,
  COUNTERBALANCE_B,
  COUNTERBALANCE_VIEWBOX,
  LOCKUP_VIEWBOX,
  MARK_TO_LOCKUP,
  WORDMARK_PATHS,
} from "./counterbalance-paths";

/**
 * Counterbalance — the Ravel mark.
 *
 * Three paths: two forms plus their intersection. The fills come from the kit
 * tokens (`--color-primary`, `--color-health`, `--color-spark`), so the mark
 * re-colours itself with the theme and the mode without this component knowing
 * which one is active. That is exactly how the kit ships it: four colour
 * variants of one unchanged geometry.
 *
 * The clip path needs an id that is unique per rendered instance — two marks on
 * one page sharing an id would both take the first one's clip. `useId` is not
 * used because this is a server component in most of its call sites; the id is
 * derived from the caller-supplied `idSuffix` where more than one can appear.
 */
export function Counterbalance({
  size = 24,
  idSuffix = "default",
  title,
}: {
  size?: number;
  /** Unique per instance on a page. Only matters when two marks are rendered together. */
  idSuffix?: string;
  /** Supply to make the mark an accessible image; omitted it is decorative. */
  title?: string;
}) {
  const clipId = `counterbalance-clip-${idSuffix}`;

  return (
    <svg
      viewBox={COUNTERBALANCE_VIEWBOX}
      width={size}
      height={size}
      style={{ flexShrink: 0, display: "block" }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={COUNTERBALANCE_A} />
        </clipPath>
      </defs>
      <path d={COUNTERBALANCE_A} fill="var(--color-primary)" />
      <path d={COUNTERBALANCE_B} fill="var(--color-health)" />
      <path d={COUNTERBALANCE_B} fill="var(--color-spark)" clipPath={`url(#${clipId})`} />
    </svg>
  );
}

/**
 * The kit's lockup — the mark and the name as one drawn asset, used where the
 * name still has to be introduced (the auth screens, the menu drawer).
 *
 * This was previously the mark beside live text. Live text meant the wordmark
 * was set in whatever face the app's UI happened to use, at whatever weight the
 * component asked for, which is how the name came to be rendered in a
 * neo-grotesque at weight 800 while the kit draws it in URW Gothic at 400. A
 * lockup is a fixed brand asset, not styled UI text; drawing the kit's own
 * outlines is what makes it one.
 *
 * `size` is still the MARK's size, so every existing call site keeps the mark
 * at the pixel size it asked for. The lockup around it is scaled from that —
 * see MARK_TO_LOCKUP. Only the fills change per theme, exactly as the kit
 * ships it.
 */
export function Wordmark({
  size = 26,
  idSuffix = "wordmark",
}: {
  /** The MARK's height in pixels. The lockup is drawn around it. */
  size?: number;
  idSuffix?: string;
}) {
  const clipId = `lockup-clip-${idSuffix}`;
  const height = size * MARK_TO_LOCKUP;
  const [, , vbWidth, vbHeight] = LOCKUP_VIEWBOX.split(" ").map(Number);

  return (
    <svg
      viewBox={LOCKUP_VIEWBOX}
      height={height}
      width={height * (vbWidth / vbHeight)}
      style={{ flexShrink: 0, display: "block" }}
      role="img"
      aria-label="Ravel"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={COUNTERBALANCE_A} />
        </clipPath>
      </defs>
      <path d={COUNTERBALANCE_A} fill="var(--color-primary)" />
      <path d={COUNTERBALANCE_B} fill="var(--color-health)" />
      <path d={COUNTERBALANCE_B} fill="var(--color-spark)" clipPath={`url(#${clipId})`} />
      {/* One group, one fill — the kit's own structure. */}
      <g fill="var(--color-text)">
        {WORDMARK_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
