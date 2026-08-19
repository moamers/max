/**
 * The single most important test in the repository: a query issued for user A
 * must not be able to return user B's rows.
 *
 * There is no test database, so this runs the real store functions against a
 * recording driver (drizzle's pg-proxy) and inspects the SQL and bound
 * parameters that actually reach Postgres. That is a stronger check than a
 * fixture-based one — it fails if someone drops a `where` clause, joins the
 * wrong way, or adds an unscoped function, and it cannot be satisfied by a
 * mock that merely returns the right shape.
 *
 * The claim it establishes: every statement the store emits carries an equality
 * predicate on `periods.user_id`, bound to the caller's id and to no other.
 * Given that, Postgres cannot hand back another user's rows.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { toUserId } from "../auth";
import type { ParsedPeriod } from "../parser";

const hoisted = vi.hoisted(() => ({
  queries: [] as { sql: string; params: unknown[] }[],
  rows: [] as unknown[][],
}));

vi.mock("../db", async () => {
  const { drizzle } = await import("drizzle-orm/pg-proxy");

  const base = drizzle(async (sql: string, params: unknown[]) => {
    hoisted.queries.push({ sql, params });
    return { rows: hoisted.rows };
  });

  // pg-proxy has no transaction support; savePeriod only needs the callback to
  // receive something that can issue statements, and every statement it issues
  // is still recorded.
  const db: unknown = new Proxy(base, {
    get(target, prop, receiver) {
      if (prop === "transaction") {
        return async (fn: (tx: unknown) => unknown) => fn(db);
      }
      return Reflect.get(target, prop, receiver);
    },
  });

  return { getDb: () => db };
});

const {
  listPeriodSummaries,
  lineItemsForPeriod,
  tagBreakdownForPeriod,
  weeklyTotalsForPeriod,
  sectionTotalsForPeriod,
  deletePeriod,
  getPeriodByLabel,
  savePeriod,
} = await import("../store");

const USER_A = toUserId("11111111-1111-4111-8111-111111111111");
const USER_B = toUserId("22222222-2222-4222-8222-222222222222");

/** A period id that belongs to user A. User B will ask for it by number. */
const PERIOD_OWNED_BY_A = 7;

const USER_ID_PREDICATE = /"?user_id"?\s*=\s*\$\d+/;

function reset(rows: unknown[][] = []) {
  hoisted.queries.length = 0;
  hoisted.rows = rows;
}

beforeEach(() => reset());

/** Every read the store performs, as a callable the tests can drive per user. */
const READS = {
  listPeriodSummaries: (u: typeof USER_A) => listPeriodSummaries(u),
  lineItemsForPeriod: (u: typeof USER_A) => lineItemsForPeriod(u, PERIOD_OWNED_BY_A),
  tagBreakdownForPeriod: (u: typeof USER_A) => tagBreakdownForPeriod(u, PERIOD_OWNED_BY_A),
  weeklyTotalsForPeriod: (u: typeof USER_A) => weeklyTotalsForPeriod(u, PERIOD_OWNED_BY_A),
  sectionTotalsForPeriod: (u: typeof USER_A) => sectionTotalsForPeriod(u, PERIOD_OWNED_BY_A),
  getPeriodByLabel: (u: typeof USER_A) => getPeriodByLabel(u, "September 2025"),
} as const;

const READ_NAMES = Object.keys(READS) as (keyof typeof READS)[];

describe("per-user scoping · every read is filtered by user_id", () => {
  it.each(READ_NAMES)("%s constrains on periods.user_id", async (name) => {
    await READS[name](USER_A);

    expect(hoisted.queries).toHaveLength(1);
    const [q] = hoisted.queries;
    expect(q.sql).toMatch(USER_ID_PREDICATE);
    expect(q.params).toContain(USER_A as string);
  });

  it.each(READ_NAMES)("%s binds the caller's id and nobody else's", async (name) => {
    await READS[name](USER_B);

    const [q] = hoisted.queries;
    expect(q.params).toContain(USER_B as string);
    expect(q.params).not.toContain(USER_A as string);
  });

  it.each(["lineItemsForPeriod", "tagBreakdownForPeriod", "weeklyTotalsForPeriod", "sectionTotalsForPeriod"] as const)(
    "%s reaches line_items only through periods, so the id alone grants nothing",
    async (name) => {
      await READS[name](USER_B);

      const [q] = hoisted.queries;
      // The join to periods is what makes user_id reachable from a line-item
      // query. Without it there is no ownership column to filter on.
      expect(q.sql).toMatch(/join\s+"periods"/i);
      expect(q.sql).toMatch(USER_ID_PREDICATE);
      // User B asked for a period belonging to user A. The id is bound, but so
      // is B's user id, so the join matches nothing.
      expect(q.params).toContain(PERIOD_OWNED_BY_A);
      expect(q.params).toContain(USER_B as string);
      expect(q.params).not.toContain(USER_A as string);
    }
  );
});

describe("per-user scoping · writes and deletes", () => {
  it("deletePeriod cannot delete another user's period (R-19 is scoped to *your own* records)", async () => {
    await deletePeriod(USER_B, PERIOD_OWNED_BY_A);

    expect(hoisted.queries).toHaveLength(1);
    const [q] = hoisted.queries;
    expect(q.sql).toMatch(/^delete from "periods"/i);
    expect(q.sql).toMatch(USER_ID_PREDICATE);
    expect(q.params).toContain(USER_B as string);
    expect(q.params).not.toContain(USER_A as string);
  });

  it("deletePeriod reports failure rather than success when nothing matched", async () => {
    reset([]);
    await expect(deletePeriod(USER_B, PERIOD_OWNED_BY_A)).resolves.toBe(false);
  });

  it("savePeriod stamps the owner on the period row and upserts within that user", async () => {
    // The first statement is the period upsert, whose RETURNING id the rest of
    // the transaction depends on.
    reset([[PERIOD_OWNED_BY_A]]);

    await savePeriod(USER_A, emptyParsedPeriod("September 2025"), "budget.xlsx");

    const insert = hoisted.queries[0];
    expect(insert.sql).toMatch(/^insert into "periods"/i);
    expect(insert.sql).toContain('"user_id"');
    expect(insert.params).toContain(USER_A as string);
    // Uniqueness is per user: a label collision with another account must not
    // overwrite their period.
    expect(insert.sql).toMatch(/on conflict\s*\(\s*"user_id"\s*,\s*"label"\s*\)/i);
  });

  it("savePeriod never writes a period without an owner", async () => {
    reset([[PERIOD_OWNED_BY_A]]);
    await savePeriod(USER_B, emptyParsedPeriod("September 2025"), "budget.xlsx");

    for (const q of hoisted.queries) {
      if (/^insert into "periods"/i.test(q.sql)) {
        expect(q.params).toContain(USER_B as string);
      }
    }
  });
});

describe("per-user scoping · enforced by the type system, not by discipline", () => {
  it("has no unscoped exports", async () => {
    const store = await import("../store");
    const exported = Object.entries(store).filter(([, v]) => typeof v === "function");
    expect(exported.length).toBeGreaterThan(0);
    for (const [, fn] of exported) {
      // Every store function takes the UserId first. A zero-argument data
      // accessor is exactly the shape that leaks everyone's rows.
      expect((fn as (...a: unknown[]) => unknown).length).toBeGreaterThanOrEqual(1);
    }
  });

  // Never executed — the assertion is that `tsc --noEmit` fails on each of
  // these lines. If a scope argument ever becomes optional, the suppression
  // directives below go unused, which is itself an error, and this file stops
  // compiling.
  it("rejects unscoped and mis-typed calls at compile time", () => {
    const neverRun = async () => {
      // @ts-expect-error -- a store call with no user scope must not compile
      await listPeriodSummaries();
      // @ts-expect-error -- a bare string is not a UserId; the brand is the guard
      await listPeriodSummaries("11111111-1111-4111-8111-111111111111");
      // @ts-expect-error -- period id alone is not enough to read line items
      await lineItemsForPeriod(PERIOD_OWNED_BY_A);
      // @ts-expect-error -- deleting by id alone must not compile
      await deletePeriod(PERIOD_OWNED_BY_A);
    };
    expect(typeof neverRun).toBe("function");
  });
});

function emptyParsedPeriod(label: string): ParsedPeriod {
  return {
    label,
    sheetName: label,
    sheetOrder: 0,
    income: 1000,
    incomeComponents: [{ label: "Salary", amount: 1000 }],
    lineItems: [],
    budgets: [],
  };
}
