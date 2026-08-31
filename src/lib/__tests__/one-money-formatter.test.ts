/**
 * A source scan, not a unit test — because this bug passes every unit test.
 *
 * Five private money formatters were written, one screen at a time, and they
 * disagreed about pence. The week detail rounded, the dashboard didn't, and the
 * same week read £397 on one screen and £294.33 on another. Every one of those
 * formatters was individually correct; the fault was that there were five.
 *
 * Unit tests can't see this — each formatter passes its own. So this walks the
 * source and fails if any file other than `src/lib/money.ts` builds a pound
 * figure itself. If a screen needs a different presentation, it gets a named
 * function in `money.ts`, not a local `gbp`.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const ROOT = path.join(process.cwd(), "src");
const CANONICAL = path.join(ROOT, "lib", "money.ts");

/** Files that legitimately show pounds without formatting an amount. */
const EXEMPT = new Set([
  path.join(ROOT, "components", "ui", "NumericField.tsx"), // renders a bare "£" prefix beside an input
  path.join(ROOT, "app", "styleguide", "StyleguideView.tsx"), // static demo values, never real money
]);

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : walk(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

/** A currency `Intl.NumberFormat`, or a "£" glued to an interpolated value. */
const CURRENCY_FORMATTER = /currency:\s*["']GBP["']/;
const POUND_INTERPOLATION = /£\$\{|£\s*\+|\$\{[^}]*\}\s*£/;

function offendingLines(src: string): string[] {
  return src.split("\n").filter((line) => {
    if (line.trimStart().startsWith("*") || line.trimStart().startsWith("//")) return false;
    return CURRENCY_FORMATTER.test(line) || POUND_INTERPOLATION.test(line);
  });
}

describe("there is exactly one money formatter", () => {
  const files = walk(ROOT).filter((f) => f !== CANONICAL && !EXEMPT.has(f));

  it.each(files.map((f) => [path.relative(ROOT, f), f] as const))(
    "%s does not format pounds itself",
    (_rel, file) => {
      expect(offendingLines(fs.readFileSync(file, "utf8"))).toEqual([]);
    }
  );

  it("the canonical module is where the formatting lives", () => {
    const src = fs.readFileSync(CANONICAL, "utf8");
    expect(CURRENCY_FORMATTER.test(src)).toBe(true);
    expect(src).toContain("export function formatGBP");
  });
});
