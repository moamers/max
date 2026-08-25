import {
  pgTable,
  boolean,
  check,
  date,
  integer,
  text,
  numeric,
  jsonb,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type {
  TransactionKind,
  TransactionCategory,
  WeeklyCategory,
} from "./transactions";

/**
 * A person. Email is stored lowercased (normalised in `auth.ts`, and held to it
 * by a `email = lower(email)` CHECK constraint in the migration) so uniqueness
 * is genuinely case-insensitive without needing the citext extension.
 *
 * R-18: erasure reaches everything — every table below hangs off this row by a
 * cascading foreign key, so deleting a user removes their financial data in the
 * same statement. There is no orphan path.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  /**
   * What a month is worth when the user hasn't said otherwise. Nullable on
   * purpose: NULL is "hasn't told us", which is not the same claim as £0 and
   * must not be forecast against as though it were (B-8).
   */
  defaultMonthlyIncome: numeric("default_monthly_income", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Server-side session records. The cookie carries an opaque token; this table
 * stores only its SHA-256 hash, so the session can be revoked server-side on
 * logout and a leaked table dump yields no usable cookies.
 *
 * R-20 / R-9: nothing about the user is encoded in the cookie, so there is no
 * hidden state the user could be surprised by.
 */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_sessions_user").on(table.userId),
    index("idx_sessions_expires_at").on(table.expiresAt),
  ]
);

/**
 * A pay period. `userId` is the single scoping root for all financial data:
 * `line_items`, `budgets` and `period_summaries` reach the owner through this
 * row rather than carrying their own copy, so there is exactly one place the
 * ownership check can be got wrong.
 *
 * `label` is unique *per user*, not globally — two people may both have a
 * "September 2025" period.
 */
export const periods = pgTable(
  "periods",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    startDate: text("start_date"),
    endDate: text("end_date"),
    income: numeric("income", { precision: 12, scale: 2 }),
    /** The labelled rows `income` was summed from, so the total stays traceable (B-8). */
    incomeComponents: jsonb("income_components").$type<{ label: string; amount: number }[]>(),
    source: text("source").notNull().default("sheet"),
    sourceFilename: text("source_filename"),
    sourceSheetName: text("source_sheet_name"),
    sheetOrder: integer("sheet_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_periods_user").on(table.userId),
    uniqueIndex("periods_user_label_unique").on(table.userId, table.label),
  ]
);

/**
 * One line of spend. Was `line_items`; renamed and widened by `0004`, not
 * rebuilt — the rows in this table are the founder's real pay period and have
 * been mis-parsed twice already, so they are carried across rather than
 * re-derived.
 *
 * `kind` and `category` replace the sheet's five `section` headings. The pair
 * is constrained here and by a CHECK in the database, and the rule is the same
 * one `isValidKindCategory()` implements in `transactions.ts`.
 *
 * `label` is the user's own word for this (D-10). It is never normalised,
 * never mapped onto an internal vocabulary, and never inferred.
 */
export const transactions = pgTable(
  "transactions",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    periodId: integer("period_id")
      .notNull()
      .references(() => periods.id, { onDelete: "cascade" }),
    kind: text("kind").$type<TransactionKind>().notNull(),
    category: text("category").$type<TransactionCategory | null>(),
    weekNumber: integer("week_number"),
    /** Was `description`. The name on the transaction, as it arrived. */
    merchant: text("merchant"),
    note: text("note"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    /** Was `tag`. Free text, the user's vocabulary (D-10). */
    label: text("label"),
    /** Nullable: the sheet gives a week, not a day, and inventing one would be a claim. */
    occurredOn: date("occurred_on"),
    pending: boolean("pending").notNull().default(false),
    needsAttention: boolean("needs_attention").notNull().default(false),
    /** Plain-English provenance for why this row still needs the user's judgement (B-8). */
    attentionReason: text("attention_reason"),
    /** The source line this row was read from, kept so a figure can be opened up (B-8). */
    rawImport: text("raw_import"),
  },
  (table) => [
    index("idx_transactions_period").on(table.periodId),
    index("idx_transactions_period_week").on(table.periodId, table.weekNumber),
    index("idx_transactions_period_kind").on(table.periodId, table.kind),
    check(
      "transactions_kind_category",
      sql`(${table.kind} = 'weekly' AND ${table.category} IN ('everyday', 'weekend', 'transport'))
        OR (${table.kind} = 'recurring' AND ${table.category} IN ('housing', 'childcare', 'bills', 'subscriptions'))
        OR (${table.kind} = 'one_off' AND ${table.category} IS NULL)`
    ),
    check(
      "transactions_one_state",
      sql`NOT (${table.pending} AND ${table.needsAttention})`
    ),
  ]
);

export const budgets = pgTable(
  "budgets",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    periodId: integer("period_id")
      .notNull()
      .references(() => periods.id, { onDelete: "cascade" }),
    section: text("section").notNull(),
    weekNumber: integer("week_number"),
    budgetedAmount: numeric("budgeted_amount", { precision: 12, scale: 2 }).notNull(),
  },
  (table) => [index("idx_budgets_period").on(table.periodId)]
);

export const periodSummaries = pgTable("period_summaries", {
  periodId: integer("period_id")
    .primaryKey()
    .references(() => periods.id, { onDelete: "cascade" }),
  totalFixed: numeric("total_fixed", { precision: 12, scale: 2 }),
  totalVariable: numeric("total_variable", { precision: 12, scale: 2 }),
  totalWeekly: numeric("total_weekly", { precision: 12, scale: 2 }),
  income: numeric("income", { precision: 12, scale: 2 }),
  finalPosition: numeric("final_position", { precision: 12, scale: 2 }),
});

/**
 * A per-category weekly target. Three rows per user in V1 — one per weekly
 * category. Recurring groups don't get one: rent isn't a target, it's a bill.
 */
export const goals = pgTable(
  "goals",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: text("category").$type<WeeklyCategory>().notNull(),
    weeklyAmount: numeric("weekly_amount", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("goals_user_category_unique").on(table.userId, table.category),
    check("goals_category_weekly", sql`${table.category} IN ('everyday', 'weekend', 'transport')`),
    check("goals_weekly_amount_non_negative", sql`${table.weeklyAmount} >= 0`),
  ]
);

/**
 * What came in for one month. A "month" is the user's pay period, so the key is
 * `period_id`. An absent row means fall back to `users.default_monthly_income`
 * — and if that is null too, the answer is "we don't know", not zero.
 *
 * `userId` is carried here as well as being reachable through `periods` so that
 * income can be scoped without a join. A database trigger (migration `0005`)
 * holds the two to agreement.
 */
export const incomeMonths = pgTable(
  "income_months",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    periodId: integer("period_id")
      .notNull()
      .references(() => periods.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    /** True when the user typed it; false when Max derived it from an import. */
    setByUser: boolean("set_by_user").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("income_months_user_period_unique").on(table.userId, table.periodId),
    index("idx_income_months_user").on(table.userId),
  ]
);
