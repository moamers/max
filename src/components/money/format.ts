/** One money formatter, in `@/lib/money` — see the note there. */
export { formatMoney } from "@/lib/money";

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
