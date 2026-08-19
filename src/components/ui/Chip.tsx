import type { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { cn } from "./cn";

export type ChipTone = "quiet" | "cyan" | "amber";

const TONE_STYLE: Record<ChipTone, { color: string; background: string }> = {
  quiet: { color: "var(--text-secondary)", background: "transparent" },
  cyan: { color: "var(--cyan-ink)", background: "var(--cyan-tint-bg)" },
  amber: { color: "var(--amber-ink)", background: "var(--amber-tint-bg)" },
};

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ChipTone;
  /** Selected/confirmed state (used for the import screen's category chips). */
  selected?: boolean;
}

/**
 * Outline, tappable chip — mono meta text. "quiet" is a hairline outline
 * (spreadsheet/screenshot/statement/pdf pills, category pickers); "cyan"
 * is the filled label chip (dxb-26, home-improvements…); "amber" is the
 * pending flag rendered as a chip rather than a pill.
 */
export function Chip({ tone = "quiet", selected = false, className, style, ...rest }: ChipProps) {
  const toneStyle = TONE_STYLE[tone];
  return (
    <button
      type="button"
      className={cn(tone === "quiet" && "max-chip--quiet", className)}
      style={{
        fontFamily: "var(--font-jetbrains-mono)",
        fontSize: 11,
        color: selected ? "var(--lime-ink)" : toneStyle.color,
        background: toneStyle.background,
        border: tone === "quiet" ? `1px solid ${selected ? "var(--lime-fill)" : "var(--hairline-4)"}` : "none",
        borderRadius: "var(--radius-chip)",
        padding: "7px 12px",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "border-color 0.15s ease, color 0.15s ease",
        ...style,
      }}
      {...rest}
    />
  );
}

export type PillTone = "lime" | "cyan" | "amber" | "neutral";

const PILL_TONE_STYLE: Record<PillTone, { color: string; background: string }> = {
  lime: { color: "var(--lime-ink-on-fill)", background: "var(--lime-fill)" },
  cyan: { color: "var(--cyan-ink)", background: "var(--cyan-tint-bg)" },
  amber: { color: "var(--amber-ink)", background: "var(--amber-tint-bg)" },
  neutral: { color: "var(--text-tertiary)", background: "var(--control-active)" },
};

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  uppercase?: boolean;
}

/**
 * Small mono meta pill — the lime "now" pill on the live week, the cyan
 * uppercase "set by you" tag, the uppercase amber "pending" flag.
 */
export function Pill({ tone = "neutral", uppercase = false, className, style, ...rest }: PillProps) {
  const toneStyle = PILL_TONE_STYLE[tone];
  return (
    <span
      className={cn(className)}
      style={{
        fontFamily: "var(--font-jetbrains-mono)",
        fontSize: 10,
        letterSpacing: "0.06em",
        textTransform: uppercase ? "uppercase" : "none",
        color: toneStyle.color,
        background: toneStyle.background,
        borderRadius: "var(--radius-pill)",
        padding: "4px 8px",
        display: "inline-block",
        fontWeight: tone === "lime" ? 700 : 400,
        ...style,
      }}
      {...rest}
    />
  );
}
