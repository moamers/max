"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Slider } from "./Slider";
import { formatAmount, sanitizeAmountInput, SLIDER_MAX, SLIDER_STEP } from "./validation";

export interface AmountEditorProps {
  amount: number;
  onAmountChange: (amount: number) => void;
  pending: boolean;
  onPendingChange: (pending: boolean) => void;
  /** The add sheet shows the drag slider; the transaction editor doesn't (README screens 04 vs 08). */
  showSlider?: boolean;
}

/**
 * The 34px/800 amount, amber when pending, beside the Final|Pending pill —
 * shared by the add sheet (with its slider) and the transaction editor
 * (without one). Typing the number directly is additional to the slider,
 * not a replacement: the slider's own range is capped at £250, but a
 * recurring bill or one-off can be far more than that, and every field is
 * meant to be exactly editable (see the transaction editor's own remit).
 */
export function AmountEditor({ amount, onAmountChange, pending, onPendingChange, showSlider = false }: AmountEditorProps) {
  // `draft` is non-null only while the field is focused. Outside that, the text
  // *is* the amount rather than a copy of it kept in step by an effect — so the
  // slider and a parent update can't race a stale mirror, and there is no
  // synchronous setState during render to cascade.
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? formatAmount(amount);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <span
            style={{
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: pending ? "var(--amber-ink)" : "var(--text-primary)",
            }}
          >
            £
          </span>
          <input
            inputMode="decimal"
            value={text}
            aria-label="Amount"
            onFocus={() => setDraft(formatAmount(amount))}
            onChange={(e) => setDraft(e.target.value.replace(/[^0-9.]/g, ""))}
            onBlur={() => {
              onAmountChange(sanitizeAmountInput(text));
              setDraft(null);
            }}
            style={{
              width: `${Math.max(2, text.length + 1)}ch`,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "var(--font-grotesk)",
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: pending ? "var(--amber-ink)" : "var(--text-primary)",
              padding: 0,
            }}
          />
        </div>
        <SegmentedControl
          value={pending ? "pending" : "final"}
          onChange={(v) => onPendingChange(v === "pending")}
          options={[
            { value: "final", label: "Final" },
            { value: "pending", label: "Pending", activeColor: "var(--amber-ink)" },
          ]}
        />
      </div>
      {showSlider && (
        <Slider
          value={Math.min(amount, SLIDER_MAX)}
          min={0}
          max={SLIDER_MAX}
          step={SLIDER_STEP}
          onChange={onAmountChange}
          aria-label="Drag to set the amount"
        />
      )}
    </div>
  );
}
