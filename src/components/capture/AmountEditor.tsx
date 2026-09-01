"use client";

import { useEffect, useRef, useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Slider } from "./Slider";
import { formatAmount, sanitizeAmountInput, SLIDER_MAX, SLIDER_STEP } from "./validation";

export interface AmountEditorProps {
  amount: number;
  onAmountChange: (amount: number) => void;
  pending: boolean;
  onPendingChange: (pending: boolean) => void;
  /**
   * Optional only so a caller can render a two-state control deliberately.
   * Both Add and the transaction editor pass it: a row can be flagged when it
   * is written down, not only afterwards (docs/design/15, §1).
   */
  needsAttention?: boolean;
  onNeedsAttentionChange?: (needsAttention: boolean) => void;
  /** The add sheet shows the drag slider; the transaction editor doesn't (README screens 04 vs 08). */
  showSlider?: boolean;
  /**
   * Put the cursor here on mount. The amount is the first field on both the add
   * sheet and the transaction editor, and both screens exist to fill this form
   * in — which is the one case where taking focus is help rather than theft.
   */
  autoFocus?: boolean;
}

/**
 * The 34px/800 amount, amber when pending, beside the Final|Pending pill —
 * shared by the add sheet (with its slider) and the transaction editor
 * (without one). Typing the number directly is additional to the slider,
 * not a replacement: the slider's own range is capped at £250, but a
 * recurring bill or one-off can be far more than that, and every field is
 * meant to be exactly editable (see the transaction editor's own remit).
 */
export function AmountEditor({
  amount,
  onAmountChange,
  pending,
  onPendingChange,
  needsAttention = false,
  onNeedsAttentionChange,
  showSlider = false,
  autoFocus = false,
}: AmountEditorProps) {
  // `draft` is non-null only while the field is focused. Outside that, the text
  // *is* the amount rather than a copy of it kept in step by an effect — so the
  // slider and a parent update can't race a stale mirror, and there is no
  // synchronous setState during render to cascade.
  const [draft, setDraft] = useState<string | null>(null);
  // An unset amount shows the `0` as a placeholder rather than as text you have
  // to delete first. Nothing is lost by treating 0 as empty here: the add form
  // will not save an amount of zero (`validateAddDraft`), so a zero in this
  // field is always an amount nobody has typed yet.
  const text = draft ?? (amount === 0 ? "" : formatAmount(amount));
  const inputRef = useRef<HTMLInputElement>(null);

  // Focused through a ref rather than the `autoFocus` attribute so the scroll
  // can be suppressed: this input sits inside a sheet that scrolls, and the
  // browser's default focus scroll pulls the header off the top of a phone
  // screen before the user has read it. Selecting the existing text means the
  // editor's first keystroke replaces the amount instead of appending to it.
  useEffect(() => {
    if (!autoFocus) return;
    const input = inputRef.current;
    if (!input) return;
    input.focus({ preventScroll: true });
    input.select();
  }, [autoFocus]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <span
            style={{
              fontSize: "var(--type-display)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: needsAttention ? "var(--status-review-ink)" : pending ? "var(--status-pending-ink)" : "var(--text-primary)",
            }}
          >
            £
          </span>
          <input
            ref={inputRef}
            className="max-money-input"
            inputMode="decimal"
            value={text}
            placeholder="0"
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
              fontSize: "var(--type-display)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: needsAttention ? "var(--status-review-ink)" : pending ? "var(--status-pending-ink)" : "var(--text-primary)",
              padding: 0,
            }}
          />
        </div>
        <SegmentedControl
          value={needsAttention ? "attention" : pending ? "pending" : "final"}
          onChange={(value) => {
            onPendingChange(value === "pending");
            onNeedsAttentionChange?.(value === "attention");
          }}
          options={[
            { value: "final", label: "Final" },
            { value: "pending", label: "Pending", activeColor: "var(--status-pending-ink)" },
            ...(onNeedsAttentionChange
              ? [{ value: "attention" as const, label: "Needs a look", activeColor: "var(--status-review-ink)", activeBackground: "var(--attention-tint-bg)" }]
              : []),
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
