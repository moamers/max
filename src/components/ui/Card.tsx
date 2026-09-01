import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type CardSize = "sm" | "lg" | "hero";

const RADIUS: Record<CardSize, string> = {
  sm: "var(--radius-card-sm)", // 20px — nested cards (category/segment rows)
  lg: "var(--radius-card-lg)", // 22px — top-level home cards
  hero: "var(--radius-hero)", // 26px — the hero card
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  size?: CardSize;
  /** Renders as a button-like interactive surface (hover step, pointer cursor). */
  interactive?: boolean;
  /** Paint the raised surface instead of the base card surface (e.g. hero "Today" state). */
  raised?: boolean;
  padding?: string;
}

export function Card({
  size = "lg",
  interactive = false,
  raised = false,
  padding = "20px",
  className,
  style,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn("max-card", interactive && "max-card--interactive", className)}
      style={{
        background: raised ? "var(--surface-raised)" : "var(--surface)",
        borderRadius: RADIUS[size],
        padding,
        display: "flex",
        flexDirection: "column",
        gap: 13,
        cursor: interactive ? "pointer" : undefined,
        transition: "background-color var(--motion-quick) var(--ease-standard)",
        ...style,
      }}
      {...rest}
    />
  );
}
