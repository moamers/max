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
  /** Use the strong red variant (--bar-over-strong) instead of the default. */
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
  const { widthPct, tone, gradientSizePct } = computeBarReading(spend, budget);
  const height = HEIGHT[size];
  // Over budget stays a single flat red: the ramp is about approaching a
  // limit, and once it is passed there is nothing left to approach.
  const overColor = strong ? "var(--bar-over-strong)" : "var(--bar-over)";

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
          ...(tone === "over"
            ? { background: overColor }
            : {
                backgroundImage: "var(--bar-ramp)",
                backgroundSize: `${gradientSizePct}% 100%`,
                backgroundRepeat: "no-repeat",
              }),
          borderRadius: "var(--radius-pill)",
          transition: `width var(--duration-bar) ease, background-color var(--duration-bar) ease`,
        }}
      />
    </div>
  );
}
