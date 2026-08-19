/**
 * Small inline stroked icons, matching the handoff's asset note: "all
 * other icons are inline stroked SVGs at 1.6–2.4 stroke width,
 * stroke-linecap:round." No icon library — these are the few the
 * primitives need.
 */

interface IconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function BackArrowIcon({ size = 18, strokeWidth = 2.2, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 15, strokeWidth = 2.4, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 9.5l6 6 6-6" />
    </svg>
  );
}

export function PlusIcon({ size = 22, strokeWidth = 2.2, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function HamburgerIcon({ size = 16, className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} className={className} aria-hidden>
      <rect x="2" y="4" width="12" height="2" rx="1" fill="currentColor" />
      <rect x="2" y="10" width="12" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

/** The caret ("›") used on rows and accordions — rotates 90° when open. */
export function CaretIcon({ size = 18, className }: IconProps) {
  return (
    <span
      className={className}
      style={{ fontSize: size, color: "var(--text-disabled)", display: "inline-block", lineHeight: 1 }}
      aria-hidden
    >
      &rsaquo;
    </span>
  );
}
