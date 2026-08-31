/**
 * The contrast floor, checked mechanically rather than by eye.
 *
 * `src/app/brand-tokens.css` derives about forty app tokens from the eight the
 * Ravel kit supplies, per theme and per mode. Every one of those derivations is
 * a `color-mix()` whose result nobody can read off the source — which is
 * exactly the situation where a palette quietly stops being legible.
 *
 * So this parses the real stylesheet, resolves the mixes the way a browser
 * does, and fails if any pairing drops below its WCAG floor. It is a source
 * scan, in the spirit of `one-money-formatter.test.ts`: the bug it catches is
 * one that every unit test and every screenshot would pass.
 *
 * Two pairings are expected to fail, and are asserted as failures so that a
 * change which accidentally "fixes" one of them is noticed too:
 *
 *   - butter-static light, the primary FILL alone against the canvas (2.15:1).
 *     A pale lilac on a butter ground. This is the whole reason the theme ships
 *     --color-outline, and the outline it is drawn with is 16.05:1.
 *   - butter-static dark, the outline against the primary fill (1.78:1). The
 *     outline's job there is to separate the control from the CANVAS, which it
 *     does at 15.75:1; the fill itself is 8.84:1 against the canvas, so the
 *     shape reads without it.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const CSS = fs.readFileSync(path.join(process.cwd(), "src", "app", "brand-tokens.css"), "utf8");

// ---------------------------------------------------------------- colour maths

type Rgb = readonly [number, number, number];

function parseHex(hex: string): Rgb {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as unknown as Rgb;
}

function toLinear(v: number): number {
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(c: Rgb): number {
  const [r, g, b] = c.map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** `color-mix(in srgb, A p%, B)` interpolates the gamma-encoded sRGB coords. */
function mix(a: Rgb, b: Rgb, p: number): Rgb {
  return a.map((v, i) => v * p + b[i] * (1 - p)) as unknown as Rgb;
}

// --------------------------------------------------------------- css resolving

/** Every `--name: value;` declaration inside one block of the stylesheet. */
function declarations(block: string): Map<string, string> {
  const out = new Map<string, string>();
  // Values can span lines and contain nested parens, so scan rather than split.
  const re = /(--[a-z0-9-]+)\s*:/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    let depth = 0;
    let i = re.lastIndex;
    for (; i < block.length; i++) {
      const ch = block[i];
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      else if (ch === ";" && depth === 0) break;
    }
    out.set(m[1], block.slice(re.lastIndex, i).trim());
  }
  return out;
}

/** The body of the first rule whose selector line contains every needle. */
function blockFor(...needles: string[]): string {
  const lines = CSS.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!needles.every((n) => lines[i].includes(n)) || !lines[i].includes("{")) continue;
    let depth = 0;
    const start = i;
    for (let j = i; j < lines.length; j++) {
      depth += (lines[j].match(/\{/g) ?? []).length;
      depth -= (lines[j].match(/\}/g) ?? []).length;
      if (depth === 0) return lines.slice(start, j + 1).join("\n");
    }
  }
  throw new Error(`no block matching ${needles.join(" + ")}`);
}

/** Resolve a token value — hex, `var(--x)`, or a nested `color-mix()` — to sRGB. */
function resolve(value: string, vars: Map<string, string>, seen = new Set<string>()): Rgb {
  const v = value.trim();

  if (v.startsWith("#")) return parseHex(v);

  const varMatch = /^var\((--[a-z0-9-]+)\)$/.exec(v);
  if (varMatch) {
    const name = varMatch[1];
    if (seen.has(name)) throw new Error(`cycle at ${name}`);
    const next = vars.get(name);
    if (next === undefined) throw new Error(`undefined token ${name}`);
    return resolve(next, vars, new Set([...seen, name]));
  }

  const mixMatch = /^color-mix\(\s*in srgb\s*,([\s\S]*)\)$/.exec(v);
  if (mixMatch) {
    const [first, second] = splitTop(mixMatch[1]);
    const pct = /(\S+)\s*$/.exec(first)![1];
    const colourA = first.slice(0, first.length - pct.length).trim();
    const percent = pct.endsWith("%")
      ? Number(pct.slice(0, -1)) / 100
      : Number(/^var\((--[a-z0-9-]+)\)$/.test(pct) ? resolvePercent(pct, vars) : NaN);
    if (!Number.isFinite(percent)) throw new Error(`bad percentage in ${v}`);
    return mix(resolve(colourA, vars, seen), resolve(second.trim(), vars, seen), percent);
  }

  throw new Error(`cannot resolve ${v}`);
}

function resolvePercent(token: string, vars: Map<string, string>): number {
  const name = /^var\((--[a-z0-9-]+)\)$/.exec(token)![1];
  const raw = vars.get(name);
  if (raw === undefined || !raw.trim().endsWith("%")) throw new Error(`${name} is not a percentage`);
  return Number(raw.trim().slice(0, -1)) / 100;
}

/** Split "A 55%, B" on the top-level comma only. */
function splitTop(input: string): [string, string] {
  let depth = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === "(") depth++;
    else if (input[i] === ")") depth--;
    else if (input[i] === "," && depth === 0) return [input.slice(0, i), input.slice(i + 1)];
  }
  throw new Error(`no top-level comma in ${input}`);
}

// ------------------------------------------------------------------- the table

const DERIVED = declarations(blockFor(":root {"));

function tokensFor(theme: "quiet-voltage" | "butter-static", mode: "light" | "dark"): Map<string, string> {
  const themeBlock =
    theme === "butter-static"
      ? mode === "light"
        ? blockFor('[data-theme="butter-static"]:not([data-mode="dark"])')
        : blockFor('[data-theme="butter-static"][data-mode="dark"]')
      : mode === "light"
        ? blockFor(':not([data-theme="butter-static"]):not([data-mode="dark"])')
        : blockFor(':not([data-theme="butter-static"])[data-mode="dark"]');

  const outlineWidth = blockFor(
    theme === "butter-static" ? ':root[data-theme="butter-static"] {' : ':root:not([data-theme="butter-static"]) {'
  );

  return new Map([...DERIVED, ...declarations(themeBlock), ...declarations(outlineWidth)]);
}

const COMBOS = [
  ["quiet-voltage", "light"],
  ["quiet-voltage", "dark"],
  ["butter-static", "light"],
  ["butter-static", "dark"],
] as const;

/** [label, foreground token, background token, minimum ratio]. */
const PAIRINGS: ReadonlyArray<readonly [string, string, string, number]> = [
  ["body text on canvas", "--text-primary", "--bg", 4.5],
  ["body text on surface", "--text-primary", "--surface", 4.5],
  ["secondary text on canvas", "--text-secondary", "--bg", 4.5],
  ["secondary text on surface", "--text-secondary-2", "--surface", 4.5],
  ["tertiary text on canvas", "--text-tertiary", "--bg", 4.5],
  ["tertiary text on surface", "--text-tertiary", "--surface", 4.5],
  // Disabled text is exempt from WCAG 1.4.3; held to the non-text floor anyway.
  ["disabled text on canvas", "--text-disabled", "--bg", 3],
  ["accent ink on canvas", "--lime-ink", "--bg", 4.5],
  ["accent ink on surface", "--lime-ink", "--surface", 4.5],
  ["CTA label on primary fill", "--lime-ink-on-fill", "--lime-fill", 4.5],
  ["outline against canvas", "--color-outline", "--bg", 3],
  ["label ink on label tint", "--cyan-ink", "--cyan-tint-bg", 4.5],
  ["pending ink on pending tint", "--amber-ink", "--amber-tint-bg", 4.5],
  ["attention ink on its tint", "--attention-ink", "--attention-tint-bg", 4.5],
  ["over-budget ink on surface", "--bar-over", "--surface", 4.5],
  ["over-budget fill on track", "--bar-over", "--bar-track", 3],
  ["ramp start on track", "--cyan-ink", "--bar-track", 3],
  ["ramp middle on track", "--amber-ink", "--bar-track", 3],
  ["ramp warm step on track", "--attention-ink", "--bar-track", 3],
  ["neutral bar fill on track", "--bar-fill", "--bar-track", 3],
];

describe("brand tokens keep their contrast floor", () => {
  for (const [theme, mode] of COMBOS) {
    const vars = tokensFor(theme, mode);

    describe(`${theme} · ${mode}`, () => {
      for (const [label, fg, bg, floor] of PAIRINGS) {
        it(`${label} clears ${floor}:1`, () => {
          const ratio = contrast(resolve(`var(${fg})`, vars), resolve(`var(${bg})`, vars));
          expect(Number(ratio.toFixed(2))).toBeGreaterThanOrEqual(floor);
        });
      }
    });
  }

  it("quiet-voltage carries the primary fill on the fill itself", () => {
    for (const mode of ["light", "dark"] as const) {
      const vars = tokensFor("quiet-voltage", mode);
      const ratio = contrast(resolve("var(--lime-fill)", vars), resolve("var(--bg)", vars));
      expect(ratio).toBeGreaterThanOrEqual(3);
      expect(vars.get("--outline-width")).toBe("0px");
    }
  });

  it("butter-static light cannot carry the fill, and draws an outline instead", () => {
    const vars = tokensFor("butter-static", "light");
    // The failure the outline exists to answer. Asserted so that changing the
    // palette without revisiting the outline treatment breaks a test.
    const fillAlone = contrast(resolve("var(--lime-fill)", vars), resolve("var(--bg)", vars));
    expect(Number(fillAlone.toFixed(2))).toBe(2.15);
    expect(vars.get("--outline-width")).toBe("1.5px");
    const outline = contrast(resolve("var(--color-outline)", vars), resolve("var(--bg)", vars));
    expect(outline).toBeGreaterThanOrEqual(3);
  });

  it("the two dark declarations of each theme stay identical", () => {
    // One is reached through prefers-color-scheme, the other through an
    // explicit data-mode. They must never drift apart, or an explicit "Dark"
    // would look different from the same theme picked up from the OS.
    for (const theme of ["quiet-voltage", "butter-static"] as const) {
      const media = declarations(
        blockFor(
          theme === "butter-static"
            ? '[data-theme="butter-static"]:not([data-mode="light"])'
            : ':not([data-theme="butter-static"]):not([data-mode="light"])'
        )
      );
      const explicit = declarations(
        blockFor(
          theme === "butter-static"
            ? '[data-theme="butter-static"][data-mode="dark"]'
            : ':not([data-theme="butter-static"])[data-mode="dark"]'
        )
      );
      expect([...media.entries()].sort()).toEqual([...explicit.entries()].sort());
    }
  });

  it("every token the app reads is defined for every theme and mode", () => {
    const used = new Set(
      [...CSS.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1])
    );
    for (const [theme, mode] of COMBOS) {
      const vars = tokensFor(theme, mode);
      for (const name of used) {
        expect(vars.has(name), `${name} missing in ${theme} ${mode}`).toBe(true);
      }
    }
  });
});
