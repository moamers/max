import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import { PlusIcon } from "./icons";

export interface FABProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
}

/** The 52–54px lime circle, bottom-right, over a bottom fade. Opens Add. */
export function FAB({ icon, className, style, ...rest }: FABProps) {
  return (
    <button
      type="button"
      className={cn("max-fab", className)}
      style={{
        width: 52,
        height: 52,
        flexShrink: 0,
        borderRadius: "var(--radius-pill)",
        background: "var(--lime-fill)",
        color: "var(--lime-ink-on-fill)",
        // See Button: 0 in quiet-voltage, a real outline in butter-static.
        border: "var(--fill-outline)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        ...style,
      }}
      aria-label="Add"
      {...rest}
    >
      {icon ?? <PlusIcon />}
    </button>
  );
}
