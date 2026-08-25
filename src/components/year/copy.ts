export const YEAR_EMPTY_COPY = {
  title: "Not enough history yet",
  none: "A year round-up appears after you import at least two dated periods.",
  one: "Your first dated period is here. A year round-up appears after the next one.",
  action: "Import a file",
} as const;

export const YEAR_UNKNOWN_INCOME_COPY = "Income is not set for every period.";
export const YEAR_UNKNOWN_RUNNING_COPY = "The running position appears when income is set for every period.";

export function yearNetSentence(
  netPosition: number,
  percent: string,
  income: string
): string {
  return netPosition >= 0
    ? `kept ${percent} of the ${income} you earned`
    : `net position ${percent} of the ${income} you earned`;
}
