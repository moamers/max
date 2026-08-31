import {
  COUNTERBALANCE_A,
  COUNTERBALANCE_B,
  COUNTERBALANCE_VIEWBOX,
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
 * The mark plus the name — the kit's "lockup", used where the name still has to
 * be introduced (the auth screens, the menu drawer). The wordmark is live text
 * rather than the kit's outlined SVG so it inherits the app's own type and
 * stays legible at any size; the kit keeps the vector version for print.
 */
export function Wordmark({
  size = 26,
  idSuffix = "wordmark",
}: {
  size?: number;
  idSuffix?: string;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.42 }}>
      <Counterbalance size={size} idSuffix={idSuffix} />
      <span
        style={{
          fontSize: Math.round(size * 0.73),
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        Ravel
      </span>
    </span>
  );
}
