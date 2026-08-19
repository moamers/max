"use client";

import { useId, type InputHTMLAttributes } from "react";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  /** Always required — every field needs a real accessible name even when the visible label is just a placeholder. */
  label: string;
}

/**
 * The inset text field used for "where", "note" and "when" on the add sheet
 * and the transaction editor. Not one of `src/components/ui`'s primitives
 * (there is no generic text field there — `NumericField` is digits-only),
 * so this stays local to the capture flow and mirrors NumericField's own
 * surface/radius/height so it reads as the same family.
 */
export function TextField({ value, onChange, label, id, style, ...rest }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "var(--surface-inset-deep)",
        borderRadius: "var(--radius-field)",
        padding: "0 14px",
        height: 48,
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text-primary)",
          fontFamily: "var(--font-grotesk)",
          fontSize: 16,
          fontWeight: 500,
          padding: 0,
          ...style,
        }}
        {...rest}
      />
    </div>
  );
}
