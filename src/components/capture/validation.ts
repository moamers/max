/**
 * Pure logic for the Add sheet (screen 08) and the transaction editor
 * (screen 04): amount parsing/clamping, which category chips a kind shows,
 * and whether a draft is complete enough to save.
 *
 * Kept dependency-free of React and of `src/lib/**` mutations on purpose —
 * these are the rules a reviewer should be able to read and test without a
 * database. The kind/category rule itself is not re-decided here: every
 * check below defers to `isValidKindCategory` from `src/lib/transactions.ts`,
 * the same function the store and the schema's CHECK constraint agree on.
 */
import {
  isValidKindCategory,
  WEEKLY_CATEGORIES,
  WEEKLY_CATEGORY_TITLES,
  RECURRING_CATEGORIES,
  RECURRING_CATEGORY_TITLES,
  type TransactionCategory,
  type TransactionKind,
} from "@/lib/transactions";

// ------------------------------------------------------------------ amount

/** Matches NumericField's clamp ceiling — the one used everywhere else in the app. */
export const AMOUNT_MIN = 0;
export const AMOUNT_MAX = 99_999;

/** The add sheet's slider range (README: "£0–250, £0.05 steps"). */
export const SLIDER_MIN = 0;
export const SLIDER_MAX = 250;
export const SLIDER_STEP = 0.05;

/**
 * Unlike `sanitizeNumericInput` (whole pounds only, for goals/income),
 * transaction amounts carry pence. Keeps digits and a single decimal point,
 * clamps into [0, 99999], and rounds to 2dp so floating-point step math
 * (0.05 x n) can't leave a value like "12.049999999998".
 */
export function sanitizeAmountInput(raw: string): number {
  let cleaned = raw.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  if (cleaned === "" || cleaned === ".") return 0;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return 0;
  const clamped = Math.min(AMOUNT_MAX, Math.max(AMOUNT_MIN, n));
  return Math.round(clamped * 100) / 100;
}

/** Snaps a raw slider read to the nearest step and clamps to the track's range. */
export function clampSliderValue(value: number, min: number = SLIDER_MIN, max: number = SLIDER_MAX, step: number = SLIDER_STEP): number {
  const snapped = Math.round(value / step) * step;
  const clamped = Math.min(max, Math.max(min, snapped));
  return Math.round(clamped * 100) / 100;
}

export function formatAmount(n: number): string {
  return n % 1 === 0 ? n.toFixed(0) : n.toFixed(2);
}

// -------------------------------------------------------------- categories

export interface CategoryOption {
  value: TransactionCategory;
  title: string;
}

/** The conditional sub-category chip row (README screen 08): Weekly / Recurring get one, One-off gets none. */
export function categoriesForKind(kind: TransactionKind): CategoryOption[] {
  if (kind === "weekly") {
    return WEEKLY_CATEGORIES.map((value) => ({ value, title: WEEKLY_CATEGORY_TITLES[value] }));
  }
  if (kind === "recurring") {
    return RECURRING_CATEGORIES.map((value) => ({ value, title: RECURRING_CATEGORY_TITLES[value] }));
  }
  return [];
}

/** A category chosen for one kind is meaningless after switching kind — this is the reset rule. */
export function categoryStillValidForKind(kind: TransactionKind, category: TransactionCategory | null): boolean {
  return isValidKindCategory(kind, category);
}

// -------------------------------------------------------------- add draft

export interface AddDraft {
  amount: number;
  where: string;
  kind: TransactionKind;
  category: TransactionCategory | null;
}

export interface AddValidation {
  valid: boolean;
  errors: Partial<Record<"amount" | "where" | "category", string>>;
}

/**
 * The add form's validation. B-23: every message here is plain description,
 * never a verdict on the user — "add an amount" describes a gap, not a
 * failing.
 */
export function validateAddDraft(draft: AddDraft): AddValidation {
  const errors: AddValidation["errors"] = {};
  if (!(draft.amount > 0)) errors.amount = "Add an amount.";
  if (!draft.where.trim()) errors.where = "Add where this went.";
  if (!isValidKindCategory(draft.kind, draft.category)) errors.category = "Pick a category.";
  return { valid: Object.keys(errors).length === 0, errors };
}
