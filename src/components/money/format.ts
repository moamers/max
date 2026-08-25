const GBP = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Keeps pence when the source has them, while matching the design's whole-pound examples. */
export function formatMoney(amount: number): string {
  const sign = amount < 0 ? "−" : "";
  return `${sign}£${GBP.format(Math.abs(amount))}`;
}
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });
const DAY_MONTH = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export function formatMonth(date: Date): string {
  return MONTH.format(date);
}

export function formatDayMonth(date: Date): string {
  return DAY_MONTH.format(date);
}
