import { useId, useState, type InputHTMLAttributes } from "react";
import { cn } from "./cn";

const MIN = 0;
const MAX = 99_999;

/** Strips everything but digits and clamps into [0, 99999] — the rule for every numeric input in the app. */
/**
 * Money, not integers. The founder's own sheet is full of 28.65 and 96.76 and
 * the amount column stores pence, so stripping the decimal point silently
 * rounded away real money the user had typed.
 *
 * Keeps the first point and at most two places after it; everything else that
 * isn't a digit goes.
 */
export function sanitizeNumericInput(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const [whole = "", ...rest] = cleaned.split(".");
  // A second point is a typo, not a second decimal — fold the digits in rather
  // than discarding what follows it.
  const fraction = rest.join("").slice(0, 2);
  const text = rest.length > 0 ? `${whole || "0"}.${fraction}` : whole;
  if (text === "" || text === ".") return 0;
  const n = Number(text);
  if (!Number.isFinite(n)) return 0;
  return Math.min(MAX, Math.max(MIN, Math.round(n * 100) / 100));
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
 * clamped 0–99,999, with pence.
 *
 * `draft` exists so a decimal point can be typed at all. Bound directly to a
 * number, the field re-rendered "123" the instant you typed "123." — the point
 * never survived a keystroke, so no amount could ever carry pence. While the
 * field is focused the text is the user's; the moment it isn't, the number is
 * the truth again.
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
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? String(value);

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
        // "decimal" is what puts a point on a phone keypad; "numeric" does not.
        inputMode="decimal"
        value={text}
        onFocus={() => setDraft(String(value))}
        onChange={(e) => {
          // Keep what was typed, including a trailing point mid-entry, and
          // report the parsed value alongside it.
          const raw = e.target.value.replace(/[^0-9.]/g, "");
          setDraft(raw);
          onChange(sanitizeNumericInput(raw));
        }}
        onBlur={() => setDraft(null)}
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
