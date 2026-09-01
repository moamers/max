import type { CSSProperties, ReactNode } from "react";
import { cn } from "./cn";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  /** A second line under the label, for stating what ticking it will do. */
  hint?: ReactNode;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * A real `<input type="checkbox">` inside its own `<label>`.
 *
 * Deliberately native rather than a styled div with a click handler: it is
 * reachable by keyboard, announced as a checkbox, and toggled by the whole
 * label without any of that having to be re-implemented. The only styling is
 * `accent-color`, which recolours the browser's own control to the brand's
 * lime without replacing it.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
  className,
  style,
}: CheckboxProps) {
  return (
    <label
      className={cn(className)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.55 : 1,
        ...style,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        style={{
          width: 18,
          height: 18,
          margin: "1px 0 0",
          flexShrink: 0,
          accentColor: "var(--lime-ink)",
          cursor: disabled ? "default" : "pointer",
        }}
      />
      <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>{label}</span>
        {hint && (
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: 11,
              lineHeight: 1.5,
              color: "var(--text-tertiary)",
            }}
          >
            {hint}
          </span>
        )}
      </span>
    </label>
  );
}
