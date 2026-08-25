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
const NAVIGATION = /(?:href=|\.push\(|\.replace\()/;

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
  const files = walk(ROOT);

  it("finds the navigation it is meant to be checking", () => {
    // A scan that silently matches nothing is worse than no scan at all.
    const total = files.reduce((n, f) => n + navigationLines(fs.readFileSync(f, "utf8")).length, 0);
    expect(total).toBeGreaterThanOrEqual(5);
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
