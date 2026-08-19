import { cn } from "./cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Text colour to use while this option is the active one (e.g. amber for "Pending"). Defaults to text-primary. */
  activeColor?: string;
  /** Fill colour to use while this option is active. Defaults to the neutral control-active fill; the Appearance (Dark|Light) control overrides this to var(--lime-fill). */
  activeBackground?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
  /** The hero card renders this control over a light gradient/dark surface instead of the usual inset track. */
  tone?: "default" | "onGradient" | "onSurface";
}

/**
 * Used for Today|End of month, Final|Pending, and Dark|Light. One pill
 * track (inset surface), one active segment (raised/control-active fill,
 * bold), the rest transparent with tertiary text.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  tone = "default",
}: SegmentedControlProps<T>) {
  const trackBg = tone === "onGradient" ? "transparent" : tone === "onSurface" ? "var(--surface-raised)" : "var(--surface-inset)";

  return (
    <div
      role="tablist"
      className={cn(className)}
      style={{
        display: "inline-flex",
        gap: 4,
        background: trackBg,
        borderRadius: "var(--radius-pill)",
        padding: 3,
        flexShrink: 0,
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        const activeBg = option.activeBackground ?? (tone === "onGradient" ? "rgba(255,255,255,0.82)" : "var(--control-active)");
        const activeColor = option.activeColor ?? (tone === "onGradient" ? "var(--lime-ink-on-fill)" : "var(--text-primary)");
        const inactiveColor = tone === "onGradient" ? "var(--hero-ink-3)" : "var(--text-tertiary)";

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            style={{
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: 11,
              letterSpacing: "0.04em",
              padding: "6px 12px",
              borderRadius: "var(--radius-pill)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              border: "none",
              background: active ? activeBg : "transparent",
              color: active ? activeColor : inactiveColor,
              fontWeight: active ? 700 : 500,
              transition: "background-color 0.15s ease, color 0.15s ease",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
