import {
  pgTable,
  integer,
  text,
  numeric,
  jsonb,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

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

export const lineItems = pgTable(
  "line_items",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    periodId: integer("period_id")
      .notNull()
      .references(() => periods.id, { onDelete: "cascade" }),
    section: text("section").notNull(),
    weekNumber: integer("week_number"),
    description: text("description"),
    note: text("note"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    tag: text("tag"),
  },
  (table) => [index("idx_line_items_period").on(table.periodId)]
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
