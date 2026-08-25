import { recurringSharePercent } from "./derive";
import { formatMoney } from "./format";

interface ShareBarProps {
  title: string;
  amount: number;
  total: number;
  color: string;
}
/** Screen 05's proportional-share mark. Deliberately separate from budget Bar. */
export function ShareBar({ title, amount, total, color }: ShareBarProps) {
  const percentage = recurringSharePercent(amount, total);

  return (
    <div
      role="img"
      aria-label={`${title}: ${formatMoney(amount)} of ${formatMoney(total)} recurring`}
      style={{
        height: 7,
        width: "100%",
        overflow: "hidden",
        borderRadius: "var(--radius-pill)",
        background: "var(--surface-inset)",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${percentage}%`,
          borderRadius: "inherit",
          background: color,
        }}
      />
    </div>
  );
}
