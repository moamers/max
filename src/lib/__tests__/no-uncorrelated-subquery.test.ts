/**
 * A raw `sql` fragment in a Drizzle SELECT projection loses table
 * qualification, and that silently breaks correlated subqueries.
 *
 * This is not hypothetical. `carryCandidates()` shipped as:
 *
 *     hasRecurring: sql<boolean>`exists (
 *       select 1 from ${transactions}
 *       where ${transactions.periodId} = ${periods.id}
 *         and ${transactions.kind} = 'recurring'
 *     )`
 *
 * which Drizzle rendered as `where "period_id" = "id"`. Inside the subquery
 * `"id"` binds to `transactions.id`, not to the outer `periods.id`, so the
 * result was correlated to nothing: it asked "is there a recurring row whose
 * period_id equals its own id", true for the entire account as soon as
 * transaction #1 was a recurring row in period #1. Every period then reported
 * that it already held recurring rows, the idempotence guard fired on a
 * brand-new empty month, and "copy recurring from last month" silently copied
 * nothing while reporting success.
 *
 * `tsc`, `lint`, `vitest` and `build` were all clean. The unit tests passed
 * because they ran against a recording driver that never evaluated the SQL.
 * It failed on first contact with a real Postgres — exactly the class of bug
 * AGENTS.md warns the four gates cannot see.
 *
 * So: a source scan, in the house style. A raw `sql` template inside
 * `store.ts` may not reference two different tables, because that is a
 * correlation Drizzle will not qualify for you. Join, or run a second query
 * and use a Set.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const STORE = path.join(process.cwd(), "src", "lib", "store.ts");
const SOURCE = fs.readFileSync(STORE, "utf8");

/** Every sql`...` template literal body in the file. */
function sqlTemplates(source: string): string[] {
  const out: string[] = [];
  const re = /\bsql(?:<[^>]*>)?`/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    let depth = 0;
    let i = re.lastIndex;
    for (; i < source.length; i++) {
      const ch = source[i];
      if (ch === "\\") { i++; continue; }
      if (ch === "$" && source[i + 1] === "{") { depth++; i++; continue; }
      if (ch === "}" && depth > 0) { depth--; continue; }
      if (ch === "`" && depth === 0) break;
    }
    out.push(source.slice(re.lastIndex, i));
    re.lastIndex = i + 1;
  }
  return out;
}

/** The Drizzle table objects store.ts imports from ./schema. */
const TABLES = ["periods", "transactions", "budgets", "periodSummaries", "goals", "incomeMonths", "users", "sessions"];

describe("store.ts never hand-writes a correlated subquery", () => {
  it("finds the sql templates it is meant to be scanning", () => {
    // Guards the scanner itself: if the regex silently matched nothing, every
    // assertion below would pass while checking no code at all.
    const templates = sqlTemplates(SOURCE);
    expect(templates.length).toBeGreaterThan(0);
  });

  it("no raw sql template references two different tables", () => {
    for (const body of sqlTemplates(SOURCE)) {
      const referenced = TABLES.filter((table) =>
        new RegExp(`\\$\\{\\s*${table}\\s*[.}]`).test(body)
      );
      expect(
        referenced,
        `this sql template correlates ${referenced.join(" and ")}, which Drizzle ` +
          `renders unqualified. Join them, or run a second query and use a Set:\n${body.trim()}`
      ).not.toHaveLength(2);
      expect(referenced.length).toBeLessThan(2);
    }
  });

  it("catches the exact shape that shipped", () => {
    // The scanner is only worth having if it fails on the original bug, so
    // feed it back in and require a hit.
    const regressed = `
      const x = tx.select({
        hasRecurring: sql<boolean>\`exists (
          select 1 from \${transactions}
          where \${transactions.periodId} = \${periods.id}
            and \${transactions.kind} = 'recurring'
        )\`,
      });
    `;
    const [body] = sqlTemplates(regressed);
    const referenced = TABLES.filter((table) => new RegExp(`\\$\\{\\s*${table}\\s*[.}]`).test(body));
    expect(referenced.sort()).toEqual(["periods", "transactions"]);
  });
});
