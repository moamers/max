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
    //
    // This used to assert a global count, which is a ratchet: it broke when
    // home stopped linking out to /recurring and /one-offs and showed them
    // inline instead — a change that removed navigation without removing any
    // guarantee. Naming the files says what the scan must actually reach, and
    // does not have to be re-tuned every time a link moves.
    const mustBeCovered = ["components/home/MonthSections.tsx", "app/week/[weekNumber]/WeekView.tsx"];
    for (const suffix of mustBeCovered) {
      const file = files.find((f) => f.endsWith(suffix));
      expect(file, `${suffix} is not being scanned`).toBeDefined();
      expect(
        navigationLines(fs.readFileSync(file!, "utf8")).length,
        `no period-scoped navigation found in ${suffix}`
      ).toBeGreaterThan(0);
    }
    const total = files.reduce((n, f) => n + navigationLines(fs.readFileSync(f, "utf8")).length, 0);
    expect(total).toBeGreaterThanOrEqual(4);
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
/** Every .ts/.tsx file under src, excluding tests. */
function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      out.push(...sourceFiles(full));
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

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

  /**
   * A write must leave the screen it finished with off the history stack, or
   * Back returns to it — and after a delete that is a row which no longer
   * exists, rendering a bare 404. So: `replace`, never `push`.
   */
  it("leaves the finished screen behind rather than on the history stack", () => {
    const editor = fs.readFileSync(path.join(ROOT, "app", "transaction", "[id]", "TransactionView.tsx"), "utf8");
    expect(editor).toContain("router.replace(next)");
    expect(editor).not.toContain("router.push(next)");

    const add = fs.readFileSync(path.join(ROOT, "app", "add", "AddView.tsx"), "utf8");
    expect(add).toContain("router.replace(transactionHome(");
    expect(add).not.toContain("router.push(transactionHome(");
  });

  /**
   * `redirect()` signals by throwing NEXT_REDIRECT. A client component that
   * awaits such an action inside a try/catch catches that throw and renders it
   * to the user as the literal text "next_redirect", in red, next to the
   * button they just pressed. Actions return their destination instead and the
   * client navigates.
   *
   * Discovered rather than listed. The first version of this test named two
   * files by hand and so missed `rollover-actions.ts`, which had the same bug
   * the whole time — the point of a guard is to catch the case nobody thought
   * of.
   */
  it("no server action reachable from a client component redirects", () => {
    const files = sourceFiles(ROOT);
    const serverActions = files.filter((f) => /^\s*["']use server["']/m.test(fs.readFileSync(f, "utf8")));
    const clientSource = files
      .filter((f) => /^\s*["']use client["']/m.test(fs.readFileSync(f, "utf8")))
      .map((f) => fs.readFileSync(f, "utf8"))
      .join("\n");

    const offenders: string[] = [];
    for (const file of serverActions) {
      const src = fs.readFileSync(file, "utf8");
      const redirects = src
        .split("\n")
        .map((line, i) => ({ line: line.trim(), number: i + 1 }))
        .filter(({ line }) => /(?:^|[^.\w])redirect\(/.test(line))
        // Comments explaining why the redirect was removed are not redirects.
        .filter(({ line }) => !line.startsWith("*") && !line.startsWith("//") && !line.startsWith("/*"));
      if (redirects.length === 0) continue;

      // "@/app/rollover-actions" — how a client component would name it.
      const moduleId = `@/${path.relative(ROOT, file).replace(/\.tsx?$/, "")}`;
      if (!clientSource.includes(`from "${moduleId}"`)) continue;

      offenders.push(`${moduleId}: ${redirects.map((r) => `${r.number}: ${r.line}`).join(", ")}`);
    }
    expect(offenders).toEqual([]);
  });
});

/**
 * Sheets dismiss to a known parent, not to whatever is behind them.
 *
 * A write replaces the editor with the list it came from, which leaves *two*
 * adjacent entries for that list on the history stack — the one the user
 * arrived on and the one the write landed on. `router.back()` then needs two
 * presses to reach the dashboard. The parent of each of these sheets is
 * known outright, so it should be navigated to rather than guessed at from
 * history depth.
 *
 * `/goals`, `/income` and `/year` deliberately keep `router.back()`: nothing
 * replaces-forward on them, so no duplicate accumulates, and they are opened
 * without a period — going "back" to a bare `/` would drop the month the user
 * was looking at, which is the very thing this file exists to prevent.
 */
const PERIOD_SHEETS = [
  path.join(ROOT, "components", "money", "MoneySheet.tsx"),
  path.join(ROOT, "app", "week", "[weekNumber]", "WeekView.tsx"),
  path.join(ROOT, "app", "transaction", "[id]", "TransactionView.tsx"),
  path.join(ROOT, "app", "add", "AddView.tsx"),
];

describe("a sheet dismisses to its parent, not into history", () => {
  it.each(PERIOD_SHEETS.map((f) => [path.relative(ROOT, f), f] as const))(
    "%s does not hand its back control to router.back()",
    (_rel, file) => {
      const src = fs.readFileSync(file, "utf8");
      const backControl = src.split("\n").filter((l) => l.includes("onBack="));
      expect(backControl.length).toBeGreaterThanOrEqual(1);
      for (const line of backControl) expect(line).not.toContain("router.back()");
    }
  );

  it("every one of those files still exists", () => {
    for (const file of PERIOD_SHEETS) expect(fs.existsSync(file)).toBe(true);
  });
});
