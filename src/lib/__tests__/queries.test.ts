/**
 * Three claims, in order of how much money they protect:
 *
 * 1. The migration is a transcription of `SECTION_MAPPING`, not a second
 *    opinion about it. The mapping lives in TypeScript and is applied in SQL,
 *    which is exactly the kind of gap a figure goes wrong in — so the SQL is
 *    read back and compared against the table it came from.
 * 2. The new query layer is scoped like the old one: every statement it emits
 *    carries an equality predicate on a user id.
 * 3. The forecast says what it claims to say, and says nothing when it can't.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SECTION_MAPPING, sectionForKindCategory, SHEET_SECTIONS } from "../transactions";
import { periodWindow } from "../queries/period-window";
import { toUserId } from "../auth";

const MIGRATION_0004 = readFileSync(
  join(process.cwd(), "drizzle", "0004_transactions_from_line_items.sql"),
  "utf8"
);
const MIGRATION_0005 = readFileSync(
  join(process.cwd(), "drizzle", "0005_goals_income_months.sql"),
  "utf8"
);

// --------------------------------------------------------------- migration

/** Pulls `WHEN 'x' THEN 'y'` pairs out of the named CASE arm of the backfill. */
function caseArms(sql: string, column: string): Record<string, string | null> {
  // No `i` flag, and END anchored to its own line: 'weekend' contains "end",
  // and a case-insensitive non-greedy match would stop dead inside it.
  const block = new RegExp(`"${column}" = CASE "section"([\\s\\S]*?)\\n\\s*END`).exec(sql);
  if (!block) throw new Error(`no CASE arm for ${column} in migration 0004`);
  const arms: Record<string, string | null> = {};
  const re = /WHEN\s+'([a-z_]+)'\s+THEN\s+(?:'([a-z_]+)'|NULL)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block[1])) !== null) arms[m[1]] = m[2] ?? null;
  return arms;
}

describe("migration 0004 · the section mapping is transcribed, not re-decided", () => {
  const kinds = caseArms(MIGRATION_0004, "kind");
  const categories = caseArms(MIGRATION_0004, "category");

  it.each(SHEET_SECTIONS)("%s maps to the same kind and category as SECTION_MAPPING", (section) => {
    expect(kinds[section]).toBe(SECTION_MAPPING[section].kind);
    expect(categories[section]).toBe(SECTION_MAPPING[section].category);
  });

  it("covers every section and invents none", () => {
    expect(Object.keys(kinds).sort()).toEqual([...SHEET_SECTIONS].sort());
    expect(Object.keys(categories).sort()).toEqual([...SHEET_SECTIONS].sort());
  });

  it("refuses to guess at a section it doesn't know", () => {
    expect(MIGRATION_0004).toMatch(/RAISE EXCEPTION/);
    expect(MIGRATION_0004).toMatch(/will not guess/);
  });

  it("renames rather than rebuilds, so an amount cannot change", () => {
    expect(MIGRATION_0004).toMatch(/RENAME COLUMN "description" TO "merchant"/);
    expect(MIGRATION_0004).toMatch(/RENAME COLUMN "tag" TO "label"/);
    expect(MIGRATION_0004).toMatch(/ALTER TABLE "line_items" RENAME TO "transactions"/);
    // No row-level delete or insert anywhere in the file: the existing pay
    // period is carried across, never re-created.
    expect(MIGRATION_0004).not.toMatch(/\bDELETE FROM\b/i);
    expect(MIGRATION_0004).not.toMatch(/\bINSERT INTO\b/i);
  });

  it("enforces the kind/category rule the application enforces", () => {
    const check = /CHECK \(([\s\S]*?)\);/.exec(MIGRATION_0004);
    expect(check).not.toBeNull();
    const body = check![1];
    expect(body).toContain("'everyday', 'weekend', 'transport'");
    expect(body).toContain("'housing', 'childcare', 'bills', 'subscriptions'");
    expect(body).toMatch(/'one_off'\s+AND "category" IS NULL/);
  });
});

describe("migration 0005 · goals and income", () => {
  it("adds the fallback income to users", () => {
    expect(MIGRATION_0005).toMatch(/ALTER TABLE "users"\s+ADD COLUMN IF NOT EXISTS "default_monthly_income"/);
  });

  it("keeps one goal per category per user and one income row per month", () => {
    expect(MIGRATION_0005).toMatch(/UNIQUE INDEX IF NOT EXISTS "goals_user_category_unique"/);
    expect(MIGRATION_0005).toMatch(/UNIQUE INDEX IF NOT EXISTS "income_months_user_period_unique"/);
  });

  it("will not let one user's income attach to another user's month", () => {
    expect(MIGRATION_0005).toMatch(/income_months_owner_matches_period/);
    expect(MIGRATION_0005).toMatch(/CREATE TRIGGER "income_months_owner_check"/);
  });
});

describe("the mapping is reversible, which is why 0004 may drop `section`", () => {
  it.each(SHEET_SECTIONS)("%s survives the round trip", (section) => {
    const { kind, category } = SECTION_MAPPING[section];
    expect(sectionForKindCategory(kind, category)).toBe(section);
  });
});

// ------------------------------------------------------------ period window

describe("periodWindow · how far through the month we are", () => {
  const period = { label: "Jun 30th - Aug 3rd", startDate: "2025-06-30", endDate: "2025-08-03" };

  it("counts inclusive days from the dates on the period", () => {
    const w = periodWindow(period, new Date(Date.UTC(2025, 6, 14)))!;
    expect(w.totalDays).toBe(35);
    expect(w.daysElapsed).toBe(15);
    expect(w.daysRemaining).toBe(20);
    expect(w.complete).toBe(false);
  });

  it("falls back to the label when the dates were never populated", () => {
    const w = periodWindow(
      { label: "Jun 30th - Aug 3rd", startDate: null, endDate: null },
      new Date(Date.UTC(2025, 6, 14))
    )!;
    expect(w.totalDays).toBe(35);
  });

  it("clamps rather than reporting negative or overflowing days", () => {
    const before = periodWindow(period, new Date(Date.UTC(2025, 5, 1)))!;
    expect(before.daysElapsed).toBe(0);
    const after = periodWindow(period, new Date(Date.UTC(2025, 8, 1)))!;
    expect(after.daysElapsed).toBe(35);
    expect(after.daysRemaining).toBe(0);
    expect(after.complete).toBe(true);
  });

  it("returns null rather than a guess when there is nothing to read", () => {
    expect(periodWindow({ label: "August", startDate: null, endDate: null })).toBeNull();
  });
});

// ------------------------------------------------- scoping and the forecast

const hoisted = vi.hoisted(() => ({
  queries: [] as { sql: string; params: unknown[] }[],
  rows: [] as unknown[][],
  responses: [] as unknown[][][],
}));

vi.mock("../db", async () => {
  const { drizzle } = await import("drizzle-orm/pg-proxy");
  const db = drizzle(async (sql: string, params: unknown[]) => {
    hoisted.queries.push({ sql, params });
    const next = hoisted.responses.shift();
    return { rows: next ?? hoisted.rows };
  });
  return { getDb: () => db };
});

const { monthOverview } = await import("../queries/month");
const { weeklyBreakdown } = await import("../queries/weeks");
const { recurringForPeriod, oneOffsForPeriod } = await import("../queries/recurring");
const { incomeForPeriod } = await import("../queries/income");

const USER_A = toUserId("11111111-1111-4111-8111-111111111111");
const USER_B = toUserId("22222222-2222-4222-8222-222222222222");
const PERIOD_OWNED_BY_A = 7;

const USER_ID_PREDICATE = /"?user_id"?\s*=\s*\$\d+/;

beforeEach(() => {
  hoisted.queries.length = 0;
  hoisted.rows = [];
  hoisted.responses.length = 0;
});

describe("per-user scoping · the query layer inherits the store's rule", () => {
  const READS = {
    weeklyBreakdown: (u: typeof USER_A) => weeklyBreakdown(u, PERIOD_OWNED_BY_A),
    recurringForPeriod: (u: typeof USER_A) => recurringForPeriod(u, PERIOD_OWNED_BY_A),
    oneOffsForPeriod: (u: typeof USER_A) => oneOffsForPeriod(u, PERIOD_OWNED_BY_A),
    incomeForPeriod: (u: typeof USER_A) => incomeForPeriod(u, PERIOD_OWNED_BY_A),
    monthOverview: (u: typeof USER_A) => monthOverview(u, PERIOD_OWNED_BY_A),
  } as const;

  it.each(Object.keys(READS) as (keyof typeof READS)[])(
    "%s binds the caller's id to every statement and nobody else's",
    async (name) => {
      await READS[name](USER_B);

      expect(hoisted.queries.length).toBeGreaterThan(0);
      for (const q of hoisted.queries) {
        expect(q.sql).toMatch(USER_ID_PREDICATE);
        expect(q.params).toContain(USER_B as string);
        expect(q.params).not.toContain(USER_A as string);
      }
    }
  );

  it("monthOverview stops at the period lookup when the period isn't yours", async () => {
    hoisted.responses.push([]);
    await expect(monthOverview(USER_B, PERIOD_OWNED_BY_A)).resolves.toBeNull();
    expect(hoisted.queries).toHaveLength(1);
  });
});

describe("monthOverview · the forecast shows its working", () => {
  /** period row, totals by kind, the income lookup, then the weekly targets. */
  function respond(kindRows: unknown[][], incomeRow: unknown[][], goalRows: unknown[][] = [["everyday", "200"]]) {
    hoisted.responses.push(
      [[PERIOD_OWNED_BY_A, "Jun 30th - Aug 3rd", "2025-06-30", "2025-08-03"]],
      kindRows,
      incomeRow,
      goalRows
    );
  }

  it("adds the unspent weekly allowance, not a run-rate", async () => {
    // 35-day period = 5 weeks at 200/week = 1000 of allowance. 300 spent, so
    // 700 still to come. Recurring and one-offs are not projected forward —
    // rent does not get charged twice.
    respond(
      [
        ["weekly", "300", "0"],
        ["recurring", "1000", "0"],
        ["one_off", "50", "0"],
      ],
      [["2000", null, null, null]]
    );

    const m = (await monthOverview(USER_A, PERIOD_OWNED_BY_A, new Date(Date.UTC(2025, 6, 14))))!;

    expect(m.spent).toMatchObject({ weekly: 300, recurring: 1000, oneOff: 50, total: 1350 });
    expect(m.forecast).toBeCloseTo(2050, 6);
    expect(m.forecastBasis).toMatchObject({
      weeklySpentSoFar: 300,
      weeklyBudget: 1000,
      weeklyRemaining: 700,
      weeksInPeriod: 5,
    });
    expect(m.income).toMatchObject({ amount: 2000, source: "period" });
    expect(m.leftToday).toBeCloseTo(650, 6);
    // Spending the rest of the allowance lands 50 under. The old run-rate rule
    // reported this same month as comfortably positive.
    expect(m.projectedLeft).toBeCloseTo(-50, 6);
  });

  it("does not credit back an allowance already overspent", async () => {
    respond([["weekly", "1200", "0"]], [["2000", null, null, null]]);
    const m = (await monthOverview(USER_A, PERIOD_OWNED_BY_A, new Date(Date.UTC(2025, 6, 14))))!;
    expect(m.forecastBasis).toMatchObject({ weeklyRemaining: 0 });
    expect(m.forecast).toBeCloseTo(1200, 6);
  });

  it("gives no forecast when no weekly target has been set", async () => {
    respond([["weekly", "300", "0"]], [["2000", null, null, null]], []);
    const m = (await monthOverview(USER_A, PERIOD_OWNED_BY_A, new Date(Date.UTC(2025, 6, 14))))!;
    // A projection with no target is a guess wearing a number's clothes.
    expect(m.forecast).toBeNull();
    expect(m.projectedLeft).toBeNull();
  });

  it("says nothing about what is left when income is unknown", async () => {
    respond([["weekly", "300", "0"]], [[null, null, null, null]]);

    const m = (await monthOverview(USER_A, PERIOD_OWNED_BY_A, new Date(Date.UTC(2025, 6, 14))))!;

    expect(m.income).toMatchObject({ amount: null, source: "unknown" });
    // Not 0 − 300. An unknown income yields no claim at all.
    expect(m.leftToday).toBeNull();
    expect(m.projectedLeft).toBeNull();
  });
});

describe("weeklyBreakdown · an empty rolled-over period keeps its targets", () => {
  it("returns a zero-spend seed week carrying the user's goals", async () => {
    hoisted.responses.push([], [["everyday", "190"], ["weekend", "150"], ["transport", "80"]]);
    const weeks = await weeklyBreakdown(USER_A, PERIOD_OWNED_BY_A);
    expect(weeks).toHaveLength(1);
    expect(weeks[0]).toMatchObject({ weekNumber: 1, spent: 0, goal: 420, remaining: 420 });
    expect(weeks[0].categories.map((category) => [category.category, category.goal])).toEqual([
      ["everyday", 190],
      ["weekend", 150],
      ["transport", 80],
    ]);
  });
});

describe("incomeForPeriod · a figure that says where it came from", () => {
  const cases = [
    { row: ["1500", "2400", true, "1800"], amount: 2400, source: "month" },
    { row: ["1500", null, null, "1800"], amount: 1500, source: "period" },
    { row: [null, null, null, "1800"], amount: 1800, source: "default" },
    { row: [null, null, null, null], amount: null, source: "unknown" },
  ] as const;

  it.each(cases)("resolves to $source", async ({ row, amount, source }) => {
    hoisted.responses.push([[...row]]);
    const got = await incomeForPeriod(USER_A, PERIOD_OWNED_BY_A);
    expect(got.amount).toBe(amount);
    expect(got.source).toBe(source);
  });
});
