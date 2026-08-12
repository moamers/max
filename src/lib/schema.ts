import {
  pgTable,
  integer,
  text,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const periods = pgTable("periods", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  label: text("label").notNull().unique(),
  startDate: text("start_date"),
  endDate: text("end_date"),
  income: numeric("income", { precision: 12, scale: 2 }),
  source: text("source").notNull().default("sheet"),
  sourceFilename: text("source_filename"),
  sourceSheetName: text("source_sheet_name"),
  sheetOrder: integer("sheet_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

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
