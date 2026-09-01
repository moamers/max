/**
 * The type scale has eight steps, and it is only a scale for as long as
 * nothing adds a ninth.
 *
 * Before this test, the app carried **28 distinct hardcoded font sizes across
 * 251 usages** — 9.5, 10, 10.5, 11, 12, 13, 13.5, 14, 15, 16, 17, 19, 20, 21,
 * 22, 24, 25, 26, 27, 28, 30, 32, 34, 36, 40, 44, 46 and 52. That is not a
 * design decision, it is an accumulation: each component took whatever size it
 * needed on the day it was written, and half-pixel differences that nobody can
 * see got inherited by whatever was copied next.
 *
 * Colour was already derived and contrast-checked. Type had no token at all,
 * which is why it drifted furthest.
 *
 * NOT covered, deliberately: icon glyphs. `CaretIcon` takes a pixel `size`
 * like every other icon in `icons.tsx`, and an icon is a graphic that happens
 * to be drawn with a character — it belongs to the icon sizes, not the type
 * scale. That is why one 18px glyph renders on screens that are otherwise
 * entirely on the eight steps.
 *
 * Two rules, both mechanical:
 *
 *   1. No numeric `fontSize` in a component. Use `var(--type-*)`.
 *   2. No monospace. The settled type direction is Newsreader for the one
 *      large figure per screen and Libre Franklin for everything else;
 *      `font-variant-numeric: tabular-nums` does the aligning that a terminal
 *      face used to.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const ROOT = path.join(process.cwd(), "src");

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : walk(full);
    return entry.name.endsWith(".tsx") || entry.name.endsWith(".css") ? [full] : [];
  });
}

const FILES = walk(ROOT);
const rel = (f: string) => path.relative(process.cwd(), f);

/**
 * Strip comments before scanning. A comment that explains *why* there is no
 * monospace is not monospace, and a scanner that cannot tell the difference
 * punishes the documentation that makes the rule survivable.
 */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** The eight steps, and nothing else. */
const STEPS = ["micro", "caption", "label", "body", "title", "heading", "display", "figure"];

describe("type comes from the scale", () => {
  it("scans a realistic number of files", () => {
    // If the walk silently returned nothing, every assertion below would pass
    // while checking no code at all.
    expect(FILES.length).toBeGreaterThan(40);
  });

  it("no component sets a numeric font size", () => {
    const offenders: string[] = [];
    for (const file of FILES) {
      if (file.endsWith(".css")) continue;
      const source = code(fs.readFileSync(file, "utf8"));
      for (const match of source.matchAll(/fontSize: *([0-9][0-9.]*)/g)) {
        offenders.push(`${rel(file)} — fontSize: ${match[1]}`);
      }
    }
    expect(offenders, `use var(--type-*) instead:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("every --type-* reference names one of the eight steps", () => {
    const offenders: string[] = [];
    for (const file of FILES) {
      const source = fs.readFileSync(file, "utf8");
      for (const match of source.matchAll(/var\(--type-([a-z-]+)\)/g)) {
        if (!STEPS.includes(match[1])) offenders.push(`${rel(file)} — --type-${match[1]}`);
      }
    }
    expect(offenders, `not a step on the scale:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("defines all eight steps, once", () => {
    const css = fs.readFileSync(path.join(ROOT, "app", "globals.css"), "utf8");
    for (const stepName of STEPS) {
      const declarations = [...css.matchAll(new RegExp(`--type-${stepName}: `, "g"))];
      expect(declarations, `--type-${stepName}`).toHaveLength(1);
    }
  });

  it("no Tailwind type utility bypasses the scale", () => {
    // text-sm / text-2xl and friends carry their own sizes, which are not the
    // eight steps. Two auth headings were using text-2xl (24px) and so sat off
    // the scale entirely while every inline style was on it.
    const offenders: string[] = [];
    for (const file of FILES) {
      if (file.endsWith(".css")) continue;
      const source = code(fs.readFileSync(file, "utf8"));
      for (const match of source.matchAll(/\btext-(xs|sm|base|lg|xl|[2-9]xl)\b/g)) {
        offenders.push(`${rel(file)} — ${match[0]}`);
      }
    }
    expect(offenders, `use var(--type-*):\n${offenders.join("\n")}`).toEqual([]);
  });

  it("no monospace survives anywhere", () => {
    const offenders: string[] = [];
    for (const file of FILES) {
      // Match a DECLARATION, not the word. The styleguide legitimately says
      // "No monospace" in a visible label, and a scanner that cannot tell a
      // font stack from a sentence punishes the copy that explains the rule.
      const source = code(fs.readFileSync(file, "utf8"));
      const declaresMono =
        /jetbrains/i.test(source) ||
        /var\(--font-mono\)/.test(source) ||
        /font-?[fF]amily[^;\n]*monospace/.test(source);
      if (declaresMono) offenders.push(rel(file));
    }
    expect(
      offenders,
      `the settled direction is no monospace; tabular-nums aligns instead:\n${offenders.join("\n")}`
    ).toEqual([]);
  });
});
