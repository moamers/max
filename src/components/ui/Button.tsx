import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "destructive";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** 54px vs 56px per the handoff's "height 54–56px" range. Default 56. */
  height?: 54 | 56;
}

/**
 * Full-width pill button. "primary" is the lime CTA (ink text, hover
 * #D4FF5F). "secondary" is a hairline border with no fill. "destructive"
 * is the hairline-red variant used for Delete.
 */
export function Button({ variant = "primary", height = 56, className, style, ...rest }: ButtonProps) {
  const base = {
    height,
    width: "100%",
    borderRadius: "var(--radius-pill)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    cursor: "pointer",
    border: "none",
    fontFamily: "var(--font-grotesk)",
  } as const;

  if (variant === "primary") {
    return (
      <button
        type="button"
        className={cn("max-btn-primary", className)}
        style={{
          ...base,
          background: "var(--lime-fill)",
          color: "var(--lime-ink-on-fill)",
          ...style,
        }}
        {...rest}
      />
    );
  }

  if (variant === "destructive") {
    return (
      <button
        type="button"
        className={cn(className)}
        style={{
          ...base,
          background: "transparent",
          color: "var(--bar-over)",
          border: "1px solid var(--tile-negative-border)",
          fontSize: 16,
          fontWeight: 600,
          ...style,
        }}
        {...rest}
      />
    );
  }

  return (
    <button
      type="button"
      className={cn("max-btn-secondary", className)}
      style={{
        ...base,
        background: "transparent",
        color: "var(--text-primary)",
        border: "1px solid var(--hairline-4)",
        ...style,
      }}
      {...rest}
    />
  );
}
