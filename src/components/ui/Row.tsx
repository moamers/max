import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export interface RowProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  /** Hairline separator above the row (list rows are hairline-separated, not margin-spaced). */
  divider?: boolean;
  padding?: string;
}

/** A hairline-separated list row — transaction rows, month rows, weekly category rows. */
export function Row({ interactive = false, divider = false, padding = "13px 0", className, style, ...rest }: RowProps) {
  return (
    <div
      className={cn(interactive && "max-row--interactive", className)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 5,
        padding,
        borderTop: divider ? "1px solid var(--hairline-2)" : undefined,
        cursor: interactive ? "pointer" : undefined,
        transition: "opacity var(--motion-quick) var(--ease-standard)",
        ...style,
      }}
      {...rest}
    />
  );
}
