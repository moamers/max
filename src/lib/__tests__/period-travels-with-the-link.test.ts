/**
 * A source scan, not a unit test — because this bug passes every unit test.
 *
 * Week, Recurring, One-offs and Add all show one period's data, and none of
 * them can tell which period from the URL alone: "week 2" is week 2 of
 * *something*. When Home linked to `/week/2` with no period, the week screen
 * picked its own — and so the dashboard showed one month while the screen you
 * tapped into showed another. Every figure on both screens was correct. They
 * were just two different months, and nothing on screen said so.
 *
 * The rule this enforces: navigation into a period-scoped route carries the
 * period it came from. `resolvePeriodId` is the fallback for someone arriving
 * cold, not a substitute for saying which month you meant.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const ROOT = path.join(process.cwd(), "src");

/**
 * The module that implements the rule. Its `pathsAffectedBy` lists paths to
 * revalidate, which are route *patterns*, not links a user follows — a period
 * would be meaningless on them.
 */
const RULE_MODULE = path.join(ROOT, "lib", "routes.ts");

/** Routes whose content is one period's, and which therefore need telling. */
const PERIOD_SCOPED = ["/week/", "/recurring", "/one-offs", "/add"];

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : walk(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

/** `href=` / `router.push(` / `addHref=` — the ways a screen sends you somewhere. */
const NAVIGATION = /(?:[Hh]ref=|router\.push\(|router\.replace\()/;

function navigationLines(src: string): { line: string; number: number }[] {
  return src
    .split("\n")
    .map((line, i) => ({ line, number: i + 1 }))
    .filter(({ line }) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("*") || trimmed.startsWith("//")) return false;
      if (!NAVIGATION.test(line)) return false;
      return PERIOD_SCOPED.some((route) => line.includes(`"${route}`) || line.includes(`\`${route}`));
    });
}

describe("the period travels with the link", () => {
  const files = walk(ROOT).filter((f) => f !== RULE_MODULE);

  it("finds the navigation it is meant to be checking", () => {
    // A scan that silently matches nothing is worse than no scan at all.
    const total = files.reduce((n, f) => n + navigationLines(fs.readFileSync(f, "utf8")).length, 0);
    expect(total).toBeGreaterThanOrEqual(6);
  });

  it.each(files.map((f) => [path.relative(ROOT, f), f] as const))(
    "%s names the period on every period-scoped link",
    (_rel, file) => {
      const offenders = navigationLines(fs.readFileSync(file, "utf8"))
        .filter(({ line }) => !line.includes("period="))
        .map(({ line, number }) => `${number}: ${line.trim()}`);
      expect(offenders).toEqual([]);
    }
  );
});

/**
 * The same rule at the other end of a write. Adding, editing and deleting all
 * finished at bare `/`, which re-picks the current month — so a correction made
 * inside July ended by showing August, and the user had to navigate back to
 * what they were doing. `transactionHome()` answers this now; these files must
 * use it rather than routing by hand.
 */
const MUTATION_FILES = [
  path.join(ROOT, "app", "add", "AddView.tsx"),
  path.join(ROOT, "app", "add", "actions.ts"),
  path.join(ROOT, "app", "transaction", "[id]", "actions.ts"),
  path.join(ROOT, "app", "transaction", "[id]", "TransactionView.tsx"),
];

/** `router.push("/")`, `redirect("/")` — home with nothing said about which month. */
const BARE_HOME = /(?:\.push\(|redirect\()\s*["'`]\/["'`]\s*\)/;

describe("a write leaves you in the month you made it in", () => {
  it.each(MUTATION_FILES.map((f) => [path.relative(ROOT, f), f] as const))(
    "%s does not navigate to bare home",
    (_rel, file) => {
      const offenders = fs
        .readFileSync(file, "utf8")
        .split("\n")
        .map((line, i) => ({ line, number: i + 1 }))
        .filter(({ line }) => BARE_HOME.test(line))
        .map(({ line, number }) => `${number}: ${line.trim()}`);
      expect(offenders).toEqual([]);
    }
  );

  it("every one of those files still exists", () => {
    for (const file of MUTATION_FILES) expect(fs.existsSync(file)).toBe(true);
  });
});
