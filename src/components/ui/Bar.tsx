import { computeBarReading, rampBackgroundSizePct } from "./bar-grammar";

export type BarSize = "week" | "category" | "total";

const HEIGHT: Record<BarSize, number> = {
  week: 3,
  category: 8,
  total: 12,
};

export interface BarProps {
  /** Amount spent so far. */
  spend: number;
  /** The budget/target — the whole track represents this amount. */
  budget: number;
  /**
   * Bar height per the grammar: "week" rows (3px), "category" rows
   * (7–8px), "total" bars (12px). Default "category".
   */
  size?: BarSize;
  /** Use the strong variant of the over-target fill instead of the default. */
  strong?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * The one bar in the app. See src/components/ui/bar-grammar.ts for the
 * width/colour rule this renders — do not special-case colour or width
 * anywhere else; every budget bar in the product should go through here.
 */
export function Bar({ spend, budget, size = "category", strong = false, className, ...rest }: BarProps) {
  const { widthPct, tone } = computeBarReading(spend, budget);
  const height = HEIGHT[size];
  // Both fills are the GRAPHIC channel, not the ink one: a bar is a meaningful
  // non-text graphic, so its floor is 3:1 rather than the 4.5:1 text needs, and
  // it keeps far more of the hue. See the signal channels in brand-tokens.css.
  const over = strong ? "var(--bar-fill-over-strong)" : "var(--bar-fill-over)";

  /*
    Past the target the whole fill is the over colour — no ramp, because the
    state has changed and a gradient would suggest it is still on its way.

    Up to the target the fill carries the approach ramp: flat until
    `--bar-ramp-start` of the TRACK, then turning toward the over colour by
    100%. Painting it in track coordinates is the whole point — a gradient
    sized to the fill would put the warning colour at the tip of every bar,
    including a bar at 10%, which would say "nearly there" to someone who has
    spent almost nothing.

    The trick is `background-size`: the gradient is drawn at the width the
    TRACK would be, and the fill clips it. `widthPct` can be 0 here, which is
    why the ramp is skipped rather than dividing by it.
  */
  const ramping = tone === "spend" && widthPct > 0;
  const rampWidth = rampBackgroundSizePct(widthPct);

  return (
    <div
      className={className}
      style={{
        height,
        borderRadius: "var(--radius-pill)",
        background: "var(--bar-track)",
        overflow: "hidden",
      }}
      role="img"
      aria-label={rest["aria-label"] ?? `${Math.round(widthPct)}% of budget spent${tone === "over" ? ", over budget" : ""}`}
    >
      <div
        style={{
          height: "100%",
          width: `${widthPct}%`,
          background: ramping
            ? `linear-gradient(90deg, var(--bar-fill) 0%, var(--bar-fill) var(--bar-ramp-start), ${over} 100%)`
            : tone === "over"
              ? over
              : "var(--bar-fill)",
          backgroundSize: `${rampWidth}% 100%`,
          backgroundRepeat: "no-repeat",
          borderRadius: "var(--radius-pill)",
          transition: `width var(--motion-deliberate) var(--ease-standard), background-color var(--motion-quick) var(--ease-standard)`,
        }}
      />
    </div>
  );
}
