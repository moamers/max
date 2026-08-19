import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import { IconButton } from "./IconButton";
import { BackArrowIcon } from "./icons";
import { Scrim } from "./Scrim";

export type SheetVariant = "full" | "bottom";

export interface SheetProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SheetVariant;
  /** Renders the circular back button and calls this when it's tapped. Omit to render no back control. */
  onBack?: () => void;
  /** Renders a Scrim behind the sheet and wires it to dismiss. */
  onDismiss?: () => void;
  children: ReactNode;
}

/**
 * The one navigation surface below home: `sheetUp` in, a circular back
 * button, absolutely positioned below the 46px status bar.
 *
 * - "full" covers the whole screen (week, transaction, recurring,
 *   one-offs, year, goals, income, add, menu-adjacent full screens).
 * - "bottom" is rounded-top-corners only, anchored to the bottom of the
 *   frame (the month picker uses this shape in the handoff).
 */
export function Sheet({ variant = "full", onBack, onDismiss, children, className, style, ...rest }: SheetProps) {
  const body = (
    <div
      className={cn(variant === "full" ? "max-sheet--full" : "max-sheet--bottom", className)}
      style={
        variant === "full"
          ? {
              position: "absolute",
              top: 46,
              left: 0,
              right: 0,
              bottom: 0,
              background: "var(--bg)",
              display: "flex",
              flexDirection: "column",
              ...style,
            }
          : {
              background: "var(--surface)",
              borderTop: "1px solid var(--hairline-3)",
              borderRadius: "var(--radius-sheet-top) var(--radius-sheet-top) 44px 44px",
              padding: "16px 20px 30px",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              ...style,
            }
      }
      {...rest}
    >
      {onBack && variant === "full" && (
        <div style={{ padding: "8px 20px 0" }}>
          <IconButton size="lg" outline icon={<BackArrowIcon />} onClick={onBack} aria-label="Back" />
        </div>
      )}
      {children}
    </div>
  );

  if (variant === "bottom") {
    return (
      <div style={{ position: "absolute", top: 46, left: 0, right: 0, bottom: 0, zIndex: 6, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        {onDismiss && <Scrim onDismiss={onDismiss} />}
        {body}
      </div>
    );
  }

  return body;
}
