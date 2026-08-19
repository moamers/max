import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type IconButtonSize = "sm" | "md" | "lg";

const DIMENSION: Record<IconButtonSize, number> = {
  sm: 34,
  md: 38,
  lg: 54, // the sheet back button
};

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: IconButtonSize;
  /** Hairline-bordered circle (used for the sheet back button) instead of a filled one. */
  outline?: boolean;
  icon: ReactNode;
}

/** 34–38px circle on the card surface — the menu hamburger, sheet close, stepper arrows. */
export function IconButton({ size = "md", outline = false, icon, className, style, ...rest }: IconButtonProps) {
  const dimension = DIMENSION[size];
  return (
    <button
      type="button"
      className={cn("max-icon-button", className)}
      style={{
        width: dimension,
        height: dimension,
        flexShrink: 0,
        borderRadius: "var(--radius-pill)",
        background: outline ? "transparent" : "var(--surface)",
        border: outline ? "1px solid var(--hairline-4)" : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: "var(--text-primary)",
        ...style,
      }}
      {...rest}
    >
      {icon}
    </button>
  );
}
