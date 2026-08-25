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
        // No z-index of its own. The wrapper that renders a Scrim already sits
        // in its own layer, and an explicit z-index here lifted the dimming
        // above the very panel it is meant to sit behind — which both greyed
        // the panel out and swallowed every click as a dismiss.
        zIndex: 0,
        ...style,
      }}
      {...rest}
    />
  );
}
