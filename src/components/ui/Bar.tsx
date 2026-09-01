import { computeBarReading } from "./bar-grammar";

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
  const fill =
    tone === "over"
      ? strong
        ? "var(--bar-fill-over-strong)"
        : "var(--bar-fill-over)"
      : "var(--bar-fill)";

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
          background: fill,
          borderRadius: "var(--radius-pill)",
          transition: `width var(--motion-deliberate) var(--ease-standard), background-color var(--motion-quick) var(--ease-standard)`,
        }}
      />
    </div>
  );
}
