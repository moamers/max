import type { IncomeSource } from "@/lib/queries";

export const MAX_MONEY_INPUT = 99_999;

/** Server-side counterpart to NumericField's input guard. */
/** Rounds to pence rather than truncating to pounds — see sanitizeNumericInput. */
export function moneyInputAmount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const pence = Math.round(value * 100) / 100;
  return Math.min(MAX_MONEY_INPUT, Math.max(0, pence));
}

/** The design's weekly total is derived from its three editable targets. */
export function weeklyGoalTotal(values: readonly number[]): number {
  return values.reduce((total, value) => total + moneyInputAmount(value), 0);
}

export function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * B-8: the income figure keeps the tier that supplied it visible in the UI.
 * `month` is the only tier that is a period-specific user override.
 */
export function incomeSourceText(source: IncomeSource, setByUser: boolean): string {
  if (source === "month" && setByUser) return "set by you";
  if (source === "period") return "from your import";
  if (source === "default") return "your monthly default";
  return "no figure yet";
}
