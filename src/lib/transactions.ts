/**
 * The V1 transaction vocabulary: three *kinds* of spend, and the categories
 * that live inside two of them.
 *
 * Kept in one small pure module because three separate things have to agree on
 * it and must never drift: the parser (what gets written on import), the
 * schema/CHECK constraint (what the database will accept), and the migration
 * SQL that will carry the old `line_items.section` values across.
 *
 * `SECTION_MAPPING` below is the single source of truth for that migration.
 * When the SQL is written it must be a transcription of this table, not a
 * second opinion about it — `__tests__/transactions.test.ts` pins the mapping
 * so a drift shows up as a failing test rather than as wrong money on a screen.
 *
 * D-2: these are behavioural modes (an ordinary week, a weekend, the fixed
 * floor, everything else), not merchant classes. D-10: none of this touches
 * `label`, which stays the user's own words.
 */

// --------------------------------------------------------------------- kinds

export const TRANSACTION_KINDS = ["weekly", "recurring", "one_off"] as const;
export type TransactionKind = (typeof TRANSACTION_KINDS)[number];

/** Weekly categories: how an ordinary week is actually lived. */
export const WEEKLY_CATEGORIES = ["everyday", "weekend", "transport"] as const;
export type WeeklyCategory = (typeof WEEKLY_CATEGORIES)[number];

/** Recurring groups: the fixed floor, split the way the design displays it. */
export const RECURRING_CATEGORIES = ["housing", "childcare", "bills", "subscriptions"] as const;
export type RecurringCategory = (typeof RECURRING_CATEGORIES)[number];

export type TransactionCategory = WeeklyCategory | RecurringCategory;

/**
 * A kind and the category it is allowed to carry. `one_off` carries none —
 * that is the point of it: spend that doesn't belong to a repeating shape.
 */
export type KindCategory =
  | { kind: "weekly"; category: WeeklyCategory }
  | { kind: "recurring"; category: RecurringCategory }
  | { kind: "one_off"; category: null };

export function isTransactionKind(v: unknown): v is TransactionKind {
  return typeof v === "string" && (TRANSACTION_KINDS as readonly string[]).includes(v);
}

export function isWeeklyCategory(v: unknown): v is WeeklyCategory {
  return typeof v === "string" && (WEEKLY_CATEGORIES as readonly string[]).includes(v);
}

export function isRecurringCategory(v: unknown): v is RecurringCategory {
  return typeof v === "string" && (RECURRING_CATEGORIES as readonly string[]).includes(v);
}

/** The same rule the database CHECK constraint enforces, available to callers. */
export function isValidKindCategory(kind: unknown, category: unknown): boolean {
  if (kind === "weekly") return isWeeklyCategory(category);
  if (kind === "recurring") return isRecurringCategory(category);
  if (kind === "one_off") return category === null || category === undefined;
  return false;
}

// ------------------------------------------------------------ sheet sections

/**
 * The five section headings the founder's spreadsheet uses. This is the *input*
 * vocabulary — it describes the sheet, not the product — and it stays because
 * the parser still scans that sheet.
 */
export const SHEET_SECTIONS = ["grocery", "weekend", "transport", "bills", "extras"] as const;
export type SheetSection = (typeof SHEET_SECTIONS)[number];

/**
 * Delivery plan §2, "Migrating the existing rows".
 *
 * `bills` maps to `recurring` + `bills` for *every* row, deliberately. Splitting
 * the flat bills list into Housing / Childcare / Bills / Subscriptions by
 * reading merchant names is a judgement, and a judgement made silently inside a
 * migration is exactly what produced F-3 (a rent line read as salary). The user
 * re-files from the transaction editor; the migration does not guess.
 */
export const SECTION_MAPPING: Readonly<Record<SheetSection, KindCategory>> = {
  grocery: { kind: "weekly", category: "everyday" },
  weekend: { kind: "weekly", category: "weekend" },
  transport: { kind: "weekly", category: "transport" },
  bills: { kind: "recurring", category: "bills" },
  extras: { kind: "one_off", category: null },
};

export function isSheetSection(v: unknown): v is SheetSection {
  return typeof v === "string" && (SHEET_SECTIONS as readonly string[]).includes(v);
}

export function mapSection(section: SheetSection): KindCategory {
  return SECTION_MAPPING[section];
}

/** The weekly categories a sheet section maps onto, for reading old `budgets` rows. */
export function weeklyCategoryForSection(section: string): WeeklyCategory | null {
  if (!isSheetSection(section)) return null;
  const mapped = SECTION_MAPPING[section];
  return mapped.kind === "weekly" ? mapped.category : null;
}

// -------------------------------------------------------------------- titles

/**
 * Display names, taken verbatim from the design (screens 03, 05, 11). They live
 * here rather than in a screen because more than one screen shows them and the
 * query layer groups by them; the strings themselves are the design's, which is
 * final copy and already passes the tone gate.
 */
export const WEEKLY_CATEGORY_TITLES: Readonly<Record<WeeklyCategory, string>> = {
  everyday: "Everyday",
  weekend: "Weekend",
  transport: "Transport",
};

export const RECURRING_CATEGORY_TITLES: Readonly<Record<RecurringCategory, string>> = {
  housing: "Housing",
  childcare: "Childcare",
  bills: "Bills",
  subscriptions: "Subscriptions & services",
};

export const KIND_TITLES: Readonly<Record<TransactionKind, string>> = {
  weekly: "Weekly",
  recurring: "Recurring",
  one_off: "One-off spend",
};

/**
 * The inverse of `SECTION_MAPPING`. Forward the mapping is one-to-one; back it
 * is not, and the difference matters.
 *
 * Every recurring group maps back to `bills`, because that is what the founder's
 * sheet has — one flat list. So `housing`, `childcare`, `bills` and
 * `subscriptions` are four kinds of thing collapsing into one, and the function
 * is total but lossy in that direction.
 *
 * Two consequences worth stating plainly:
 *
 *  - Migration `0004` can still drop `line_items.section` without losing
 *    anything, because at migration time every recurring row *is* `bills`. That
 *    is a fact about the data being migrated, not a property of the mapping.
 *  - **A sheet round-trip loses the recurring group.** Re-file rent under
 *    Housing, export, re-import, and it comes back as `bills` — because the
 *    sheet has nowhere to record the distinction. That is a real limitation of
 *    the founder's template, not a bug to fix here, and export must not pretend
 *    otherwise. See `G-4` in docs/00-open-decisions.md.
 */
export function sectionForKindCategory(kind: string, category: string | null): SheetSection | null {
  if (kind === "recurring") return "bills";
  if (kind === "one_off") return "extras";
  if (kind === "weekly") {
    if (category === "everyday") return "grocery";
    if (category === "weekend") return "weekend";
    if (category === "transport") return "transport";
  }
  return null;
}

/**
 * Why a row is flagged when *the user* flagged it, rather than Ravel on import.
 *
 * `attention_reason` is what keeps the flag traceable (B-8) — a marker with no
 * stated cause is just anxiety. Add and the transaction editor both write this
 * one string, so a row flagged on the way in reads the same as one flagged
 * later.
 */
export const USER_ATTENTION_REASON = "Marked for a look by you.";
