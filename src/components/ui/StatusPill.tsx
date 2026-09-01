import type { HTMLAttributes } from "react";

/**
 * The four states a row can be in, and the only place their treatment is
 * decided.
 *
 * Colour is never the sole carrier. Each pill has a label that says the state
 * in words, a dot in the status's graphic channel, and a leading rule whose
 * weight rises with emphasis — so the ordering
 *
 *     settled < pending < review < over
 *
 * holds even where the over-target pink is visually softer than the settled
 * green, and settled does not read as the loudest thing on the screen merely
 * because health has high chroma.
 *
 * The label is `--text-primary` on the status tint, not the status ink on a
 * faded wash. That is what lets the tint keep the kit's actual colour: the
 * readable text and the dot carry the contrast, so the fill does not have to
 * be pulled toward the ink until a coloured label survives on it. Checked at
 * 4.5:1 on every tint in all four theme/mode combinations.
 *
 * Deliberately absent: red, warning triangles, exclamation marks. "Needs a
 * look" means the app could not place a row, not that the user did something
 * wrong (TONE > METHOD).
 */
export type Status = "settled" | "pending" | "review" | "over";

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  status: Status;
  /** The state in the user's terms. Never omit it — it is the non-colour cue. */
  children: React.ReactNode;
}

export function StatusPill({ status, children, style, ...rest }: StatusPillProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 11px",
        borderRadius: "var(--radius-pill)",
        background: `var(--status-${status}-tint)`,
        color: "var(--text-primary)",
        // The rule is the structural half of the ordering: 0, 1, 1, 2px.
        borderLeft: `var(--status-${status}-rule) solid var(--status-${status}-graphic)`,
        fontSize: "var(--type-caption)",
        fontWeight: 600,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: "var(--radius-pill)",
          flexShrink: 0,
          // Pending is in progress, so its dot is hollow: the one state that is
          // waiting rather than resolved reads as an outline, not a mark.
          background: status === "pending" ? "transparent" : `var(--status-${status}-graphic)`,
          boxShadow: status === "pending" ? `inset 0 0 0 1.5px var(--status-pending-graphic)` : undefined,
        }}
      />
      {children}
    </span>
  );
}
