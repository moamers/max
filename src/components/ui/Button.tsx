import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "destructive";

interface ButtonOwnProps {
  variant?: ButtonVariant;
  /** 54px vs 56px per the handoff's "height 54–56px" range. Default 56. */
  height?: 54 | 56;
}

type ButtonElementProps = ButtonOwnProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };

type ButtonLinkProps = ButtonOwnProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export type ButtonProps = ButtonElementProps | ButtonLinkProps;

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
    textDecoration: "none",
  } satisfies CSSProperties;

  const appearance =
    variant === "primary"
      ? {
          className: cn("max-btn-primary", className),
          style: {
            ...base,
            background: "var(--lime-fill)",
            color: "var(--lime-ink-on-fill)",
            ...style,
          },
        }
      : variant === "destructive"
        ? {
            className: cn(className),
            style: {
              ...base,
              background: "transparent",
              color: "var(--bar-over)",
              border: "1px solid var(--tile-negative-border)",
              fontSize: 16,
              fontWeight: 600,
              ...style,
            },
          }
        : {
            className: cn("max-btn-secondary", className),
            style: {
              ...base,
              background: "transparent",
              color: "var(--text-primary)",
              border: "1px solid var(--hairline-4)",
              ...style,
            },
          };

  if ("href" in rest && typeof rest.href === "string") {
    return (
      <a
        className={appearance.className}
        style={appearance.style}
        {...rest}
      />
    );
  }

  return (
    <button
      type="button"
      className={appearance.className}
      style={appearance.style}
      {...rest}
    />
  );
}
