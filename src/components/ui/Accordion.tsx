import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import { CaretIcon } from "./icons";

export interface CaretProps {
  open: boolean;
  className?: string;
}

/** The rotating caret ("›" turning 90° on expand) used by every accordion in the app. */
export function Caret({ open, className }: CaretProps) {
  return <CaretIcon className={cn("max-caret", open && "max-caret--open", className)} />;
}

export interface AccordionProps extends Omit<HTMLAttributes<HTMLDivElement>, "onToggle"> {
  open: boolean;
  onToggle: () => void;
  header: ReactNode;
  children: ReactNode;
  /** Card padding for the whole accordion shell. Default matches nested-card radius (20px). */
  radius?: string;
}

/**
 * Header row + rotating caret + collapsible body. Used for weeks/category
 * groups, recurring groups, one-off groups and year months. Per the
 * handoff, most of these are a single-open accordion within their parent
 * list — that policy belongs to the parent (which member is "open" is
 * caller state), this component only renders one member.
 */
export function Accordion({ open, onToggle, header, children, radius = "var(--radius-card-sm)", className, style, ...rest }: AccordionProps) {
  return (
    <div
      className={cn(className)}
      style={{
        background: "var(--surface)",
        borderRadius: radius,
        overflow: "hidden",
        ...style,
      }}
      {...rest}
    >
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12, cursor: "pointer" }}
      >
        {header}
      </div>
      {open && <div style={{ padding: "0 18px 8px", display: "flex", flexDirection: "column" }}>{children}</div>}
    </div>
  );
}
