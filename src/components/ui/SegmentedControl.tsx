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
              fontVariantNumeric: "tabular-nums",
              fontSize: "var(--type-caption)",
              letterSpacing: "0.04em",
              padding: "6px 12px",
              borderRadius: "var(--radius-pill)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              // Drawn on every segment so the track does not jump by 3px when
              // the selection moves; only the active one is opaque. Zero-width
              // in quiet-voltage, so nothing changes there.
              border: `var(--outline-width) solid ${active ? "var(--color-outline)" : "transparent"}`,
              background: active ? activeBg : "transparent",
              color: active ? activeColor : inactiveColor,
              fontWeight: active ? 700 : 500,
              transition: "background-color var(--motion-quick) var(--ease-standard), color var(--motion-quick) var(--ease-standard)",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
