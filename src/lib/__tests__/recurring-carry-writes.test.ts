/**
 * What the carry actually sends to Postgres.
 *
 * AGENTS.md is blunt about why this test exists: every gate passed on the
 * write-per-keystroke bug, because a gate checks that code is correct and says
 * nothing about how often it runs or how much it writes. So this drives the
 * real store function against a recording driver and asserts the shape of the
 * traffic — **one** insert for fourteen bills, not fourteen — and the one rule
 * that cannot be got wrong twice: a month that already has recurring rows is
 * left alone.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { toUserId } from "../auth";

const hoisted = vi.hoisted(() => ({
  queries: [] as { sql: string; params: unknown[] }[],
  responses: [] as unknown[][][],
}));

vi.mock("../db", async () => {
  const { drizzle } = await import("drizzle-orm/pg-proxy");

  const base = drizzle(async (sql: string, params: unknown[]) => {
    hoisted.queries.push({ sql, params });
    return { rows: hoisted.responses.shift() ?? [] };
  });

  // pg-proxy has no transaction support; the callback only needs something that
  // can issue statements, and every statement it issues is still recorded.
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

const { copyRecurringFromLastMonth } = await import("../store");

const USER = toUserId("11111111-1111-4111-8111-111111111111");
const TARGET = 10;
const SOURCE = 9;

/** `select({ id, startDate, endDate })` — column order follows the select. */
const targetRow = [[TARGET, "2026-08-31", "2026-09-27"]];
/** `select({ id, label, startDate, endDate, sheetOrder, hasRecurring })`. */
function candidateRows(targetHasRecurring: boolean) {
  return [
    [TARGET, "Aug 31st – Sep 27th", "2026-08-31", "2026-09-27", 1, targetHasRecurring],
    [SOURCE, "Aug 3rd – Aug 30th", "2026-08-03", "2026-08-30", 0, true],
  ];
}
/** `select({ category, merchant, note, amount, label, occurredOn })`. */
const sourceRows = [
  ["bills", "Rent", null, "2285.00", "home", "2026-08-06"],
  ["bills", "Netflix", null, "12.99", null, null],
  ["bills", "Nursery", null, "780.00", null, "2026-08-28"],
];

function inserts() {
  return hoisted.queries.filter((q) => /^insert into "transactions"/i.test(q.sql));
}

beforeEach(() => {
  hoisted.queries.length = 0;
  hoisted.responses.length = 0;
});

describe("copying last month's recurring into this one", () => {
  it("writes every bill in a single insert, not one insert per bill", async () => {
    hoisted.responses.push(targetRow, candidateRows(false), sourceRows, []);

    const result = await copyRecurringFromLastMonth(USER, TARGET);

    expect(result.copied).toBe(3);
    expect(result.sourceLabel).toBe("Aug 3rd – Aug 30th");
    expect(inserts()).toHaveLength(1);
    const [insert] = inserts();
    expect(insert.params).toContain("Rent");
    expect(insert.params).toContain("Netflix");
    expect(insert.params).toContain("Nursery");
    // Three rows arrive as three value groups in one statement. Three
    // statements would be three round trips from a phone.
    expect(insert.sql.split("(default,").length - 1).toBe(3);
    expect(hoisted.queries).toHaveLength(4);
  });

  it("marks every copied row pending, and clears the flags that were about last month", async () => {
    hoisted.responses.push(targetRow, candidateRows(false), sourceRows, []);
    await copyRecurringFromLastMonth(USER, TARGET);

    const [insert] = inserts();
    // A copied bill is a prediction until Ravel has seen it leave the account.
    expect(insert.params.filter((value) => value === true)).toHaveLength(3);
    expect(insert.params).not.toContain("home-ish");
    // No provenance is invented: these rows did not come from a file.
    expect(insert.sql).toContain('"raw_import"');
    expect(insert.params).toContain(null);
  });

  it("moves a recorded day the same distance into the new month, and drops one that would not fit", async () => {
    hoisted.responses.push(targetRow, candidateRows(false), sourceRows, []);
    await copyRecurringFromLastMonth(USER, TARGET);

    const [insert] = inserts();
    // Aug 6th is 3 days into Aug 3rd – Aug 30th, so it becomes Sep 3rd.
    expect(insert.params).toContain("2026-09-03");
    // Aug 28th is 25 days in; Aug 31st + 25 days is Sep 25th, still inside.
    expect(insert.params).toContain("2026-09-25");
  });

  it("refuses to copy into a month that already holds recurring rows", async () => {
    hoisted.responses.push(targetRow, candidateRows(true));

    const result = await copyRecurringFromLastMonth(USER, TARGET);

    expect(result).toEqual({ copied: 0, sourceLabel: null });
    expect(inserts()).toHaveLength(0);
    // It stops as soon as it knows: the source rows are never even read.
    expect(hoisted.queries).toHaveLength(2);
  });

  it("writes nothing for a period that is not this user's", async () => {
    hoisted.responses.push([]);

    const result = await copyRecurringFromLastMonth(USER, TARGET);

    expect(result).toEqual({ copied: 0, sourceLabel: null });
    expect(hoisted.queries).toHaveLength(1);
    // The ownership question is asked first, and it is asked of periods.
    expect(hoisted.queries[0].sql).toMatch(/from "periods"/i);
    expect(hoisted.queries[0].sql).toMatch(/"?user_id"?\s*=\s*\$\d+/);
    expect(hoisted.queries[0].params).toContain(USER as string);
  });

  it("writes nothing when no earlier month has any recurring in it", async () => {
    hoisted.responses.push(targetRow, [[TARGET, "Aug 31st – Sep 27th", "2026-08-31", "2026-09-27", 1, false]]);

    const result = await copyRecurringFromLastMonth(USER, TARGET);

    expect(result.copied).toBe(0);
    expect(inserts()).toHaveLength(0);
  });
});
