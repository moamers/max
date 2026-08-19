import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export interface ScrimProps extends HTMLAttributes<HTMLDivElement> {
  onDismiss?: () => void;
}

/**
 * The dimming layer behind a Sheet or the menu drawer. Tapping it dismisses
 * whatever it sits behind (README: "the menu is a left drawer over a
 * scrim; tapping the scrim closes it").
 */
export function Scrim({ onDismiss, className, style, ...rest }: ScrimProps) {
  return (
    <div
      className={cn("max-scrim", className)}
      onClick={onDismiss}
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--scrim)",
        zIndex: 6,
        ...style,
      }}
      {...rest}
    />
  );
}
