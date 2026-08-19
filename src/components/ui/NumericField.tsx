import { useId, type InputHTMLAttributes } from "react";
import { cn } from "./cn";

const MIN = 0;
const MAX = 99_999;

/** Strips everything but digits and clamps into [0, 99999] — the rule for every numeric input in the app. */
export function sanitizeNumericInput(raw: string): number {
  const digitsOnly = raw.replace(/[^0-9]/g, "");
  if (digitsOnly === "") return 0;
  const n = parseInt(digitsOnly, 10);
  return Math.min(MAX, Math.max(MIN, n));
}

export interface NumericFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size"> {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  /** Field height: 48px (goals rows) or 44px (income-by-month rows). Default 48. */
  height?: 44 | 48;
  /** Value font size: 21px (goals) or 18px (income by month). Default 21. */
  valueFontSize?: 18 | 21;
}

/**
 * Inset numeric field: "£" prefix, right-aligned value, no visible border,
 * digits only, clamped 0–99,999, applied on change (no explicit save
 * step — the surrounding sheet closes with "Done").
 */
export function NumericField({
  value,
  onChange,
  label,
  height = 48,
  valueFontSize = 21,
  className,
  id,
  ...rest
}: NumericFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div
      className={cn(className)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "var(--surface-inset-deep)",
        borderRadius: "var(--radius-field)",
        padding: "0 14px",
        height,
      }}
    >
      {label && (
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
      )}
      <span style={{ fontSize: 17, fontWeight: 600, color: "var(--text-disabled-2)" }}>£</span>
      <input
        id={inputId}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(sanitizeNumericInput(e.target.value))}
        style={{
          width: 76,
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text-primary)",
          fontFamily: "var(--font-grotesk)",
          fontSize: valueFontSize,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          textAlign: "right",
          padding: 0,
        }}
        {...rest}
      />
    </div>
  );
}
