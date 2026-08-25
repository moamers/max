export interface YearCsvPeriod {
  label: string;
  weekly: number;
  fixed: number;
  variable: number;
  income: number | null;
}

const HEADER = [
  "Period",
  "Total weekly",
  "%",
  "Total fixed",
  "%",
  "Total variable",
  "%",
  "Income",
  "Final position",
  "%",
] as const;

const BIG_ZERO = BigInt(0);
const BIG_ONE = BigInt(1);
const BIG_TWO = BigInt(2);
const BIG_HUNDRED = BigInt(100);
const BIG_TEN_THOUSAND = BigInt(10_000);

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function safeSpreadsheetText(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function toCents(value: number): number {
  return Math.round(value * 100);
}

function roundFraction(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= BIG_ZERO) throw new Error("A positive denominator is required");
  const sign = numerator < BIG_ZERO ? -BIG_ONE : BIG_ONE;
  const absolute = numerator < BIG_ZERO ? -numerator : numerator;
  const quotient = absolute / denominator;
  const remainder = absolute % denominator;
  return sign * (remainder * BIG_TWO >= denominator ? quotient + BIG_ONE : quotient);
}

function fixedHundredths(value: bigint): string {
  const sign = value < BIG_ZERO ? "-" : "";
  const absolute = value < BIG_ZERO ? -value : value;
  return `${sign}${absolute / BIG_HUNDRED}.${String(absolute % BIG_HUNDRED).padStart(2, "0")}`;
}

function amountFromCents(value: number): string {
  return fixedHundredths(BigInt(value));
}

function meanAmountFromCents(values: number[]): string {
  if (values.length === 0) return "";
  const total = values.reduce((sum, value) => sum + BigInt(value), BIG_ZERO);
  return fixedHundredths(roundFraction(total, BigInt(values.length)));
}

function gcd(a: bigint, b: bigint): bigint {
  let left = a < BIG_ZERO ? -a : a;
  let right = b < BIG_ZERO ? -b : b;
  while (right !== BIG_ZERO) [left, right] = [right, left % right];
  return left;
}

function formatPercentageFraction(numerator: bigint, denominator: bigint): string {
  const hundredthsOfPercent = roundFraction(numerator * BIG_TEN_THOUSAND, denominator);
  return `${fixedHundredths(hundredthsOfPercent)}%`;
}

function percentageFromCents(numerator: number, income: number | null): string {
  if (income === null || income === 0) return "";
  return formatPercentageFraction(BigInt(numerator), BigInt(income));
}

function meanPercentage(
  periods: YearCsvPeriod[],
  valueInCents: (period: YearCsvPeriod) => number | null
): string {
  let numerator = BIG_ZERO;
  let denominator = BIG_ONE;
  let count = BIG_ZERO;

  for (const period of periods) {
    const value = valueInCents(period);
    const income = period.income === null ? null : toCents(period.income);
    if (value === null || income === null || income === 0) continue;
    numerator = numerator * BigInt(income) + BigInt(value) * denominator;
    denominator *= BigInt(income);
    const divisor = gcd(numerator, denominator);
    numerator /= divisor;
    denominator /= divisor;
    count += BIG_ONE;
  }

  return count === BIG_ZERO ? "" : formatPercentageFraction(numerator, denominator * count);
}

/** Deterministic reproduction of the founder's aggregates columns (T-2/T-11). */
export function buildYearRoundupCsv(periods: YearCsvPeriod[]): string {
  const rows: (string | number)[][] = [Array.from(HEADER)];
  const positions: (number | null)[] = [];
  const incomeCents = periods.map((period) => period.income === null ? null : toCents(period.income));

  periods.forEach((period, index) => {
    const weekly = toCents(period.weekly);
    const fixed = toCents(period.fixed);
    const variable = toCents(period.variable);
    const income = incomeCents[index];
    const position = income === null ? null : income - weekly - fixed - variable;
    positions.push(position);
    rows.push([
      safeSpreadsheetText(period.label),
      amountFromCents(weekly),
      percentageFromCents(weekly, income),
      amountFromCents(fixed),
      percentageFromCents(fixed, income),
      amountFromCents(variable),
      percentageFromCents(variable, income),
      income === null ? "" : amountFromCents(income),
      position === null ? "" : amountFromCents(position),
      position === null ? "" : percentageFromCents(position, income),
    ]);
  });

  const allIncomeKnown = periods.length > 0 && periods.every((period) => period.income !== null);
  const netIncome = allIncomeKnown
    ? incomeCents.reduce<number>((sum, value) => sum + (value ?? 0), 0)
    : null;
  const netPosition = positions.length > 0 && positions.every((position) => position !== null)
    ? positions.reduce((sum, position) => sum + (position ?? 0), 0)
    : null;
  rows.push([]);
  rows.push(["Net income", "", "", "", "", "", "", netIncome === null ? "" : amountFromCents(netIncome), "", ""]);
  rows.push(["Net position", "", "", "", "", "", "", "", netPosition === null ? "" : amountFromCents(netPosition), ""]);

  const knownIncome = incomeCents.flatMap((value) => value === null ? [] : [value]);
  const knownPositions = positions.flatMap((position) => position === null ? [] : [position]);
  rows.push([
    "Average",
    meanAmountFromCents(periods.map((period) => toCents(period.weekly))),
    meanPercentage(periods, (period) => toCents(period.weekly)),
    meanAmountFromCents(periods.map((period) => toCents(period.fixed))),
    meanPercentage(periods, (period) => toCents(period.fixed)),
    meanAmountFromCents(periods.map((period) => toCents(period.variable))),
    meanPercentage(periods, (period) => toCents(period.variable)),
    meanAmountFromCents(knownIncome),
    meanAmountFromCents(knownPositions),
    meanPercentage(periods, (period) => period.income === null
      ? null
      : toCents(period.income) - toCents(period.weekly) - toCents(period.fixed) - toCents(period.variable)),
  ]);

  return `${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
