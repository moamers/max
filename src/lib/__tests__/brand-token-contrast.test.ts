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

/** `color-mix(in srgb, ...)` interpolates the gamma-encoded sRGB coords. */
function mixSrgb(a: Rgb, b: Rgb, p: number): Rgb {
  return a.map((v, i) => v * p + b[i] * (1 - p)) as unknown as Rgb;
}

// --- OKLab, per the CSS Color 4 conversion the browser performs -------------
const LMS = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005],
] as const;
const LAB = [
  [0.2104542553, 0.793617785, -0.0040720468],
  [1.9779984951, -2.428592205, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.808675766],
] as const;

function apply(m: ReadonlyArray<ReadonlyArray<number>>, v: readonly number[]): [number, number, number] {
  return [0, 1, 2].map((i) => m[i][0] * v[0] + m[i][1] * v[1] + m[i][2] * v[2]) as [number, number, number];
}

/** Gauss-Jordan on a 3x3 — small enough to be obvious, and avoids hardcoding
 *  inverse matrices whose digits nobody could check. */
function invert(m: ReadonlyArray<ReadonlyArray<number>>): number[][] {
  const a = m.map((row, i) => [...row, ...[0, 1, 2].map((j) => (i === j ? 1 : 0))]);
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let r = col + 1; r < 3; r++) if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    const d = a[col][col];
    for (let j = 0; j < 6; j++) a[col][j] /= d;
    for (let r = 0; r < 3; r++) {
      if (r === col) continue;
      const f = a[r][col];
      for (let j = 0; j < 6; j++) a[r][j] -= f * a[col][j];
    }
  }
  return a.map((row) => row.slice(3));
}

const LMS_INV = invert(LMS);
const LAB_INV = invert(LAB);

function fromLinear(v: number): number {
  return v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
}

function toOklab(c: Rgb): [number, number, number] {
  const cone = apply(LMS, c.map(toLinear));
  return apply(LAB, cone.map(Math.cbrt));
}

function fromOklab(lab: readonly number[]): Rgb {
  const cone = apply(LAB_INV, lab).map((v) => v ** 3);
  return apply(LMS_INV, cone).map((v) => Math.min(1, Math.max(0, fromLinear(v)))) as unknown as Rgb;
}

/**
 * `color-mix(in oklab, A p%, B)` — the space every derivation in
 * brand-tokens.css uses. Perceptually uniform, so "78% ink" removes 78% of the
 * perceived distance rather than 78% of three gamma-encoded numbers.
 */
function mixOklab(a: Rgb, b: Rgb, p: number): Rgb {
  const [la, lb] = [toOklab(a), toOklab(b)];
  return fromOklab([0, 1, 2].map((i) => la[i] * p + lb[i] * (1 - p)));
}

const MIXERS = { srgb: mixSrgb, oklab: mixOklab } as const;
type Space = keyof typeof MIXERS;

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

  const mixMatch = /^color-mix\(\s*in (srgb|oklab)\s*,([\s\S]*)\)$/.exec(v);
  if (mixMatch) {
    const space = mixMatch[1] as Space;
    const [first, second] = splitTop(mixMatch[2]);
    const pct = /(\S+)\s*$/.exec(first)![1];
    const colourA = first.slice(0, first.length - pct.length).trim();
    const percent = pct.endsWith("%")
      ? Number(pct.slice(0, -1)) / 100
      : Number(/^var\((--[a-z0-9-]+)\)$/.test(pct) ? resolvePercent(pct, vars) : NaN);
    if (!Number.isFinite(percent)) throw new Error(`bad percentage in ${v}`);
    return MIXERS[space](resolve(colourA, vars, seen), resolve(second.trim(), vars, seen), percent);
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
  ["over-target ink on surface", "--bar-over", "--surface", 4.5],

  // The ink channel: text, so WCAG 1.4.3's 4.5:1.
  ["health ink on surface", "--signal-health-ink", "--surface", 4.5],
  ["money ink on surface", "--signal-money-ink", "--surface", 4.5],
  ["attention ink on surface", "--signal-attention-ink", "--surface", 4.5],
  ["spark ink on surface", "--signal-spark-ink", "--surface", 4.5],

  // The graphic channel: meaningful non-text, so 1.4.11's 3:1 — and the whole
  // point of the split is that MORE of the hue survives here, so these must be
  // checked against both grounds a graphic actually sits on.
  ["health graphic on track", "--signal-health-graphic", "--bar-track", 3],
  ["health graphic on surface", "--signal-health-graphic", "--surface", 3],
  ["money graphic on track", "--signal-money-graphic", "--bar-track", 3],
  ["money graphic on surface", "--signal-money-graphic", "--surface", 3],
  ["attention graphic on track", "--signal-attention-graphic", "--bar-track", 3],
  ["attention graphic on surface", "--signal-attention-graphic", "--surface", 3],
  ["spark graphic on track", "--signal-spark-graphic", "--bar-track", 3],
  ["spark graphic on surface", "--signal-spark-graphic", "--surface", 3],

  // The one bar.
  ["bar fill on track", "--bar-fill", "--bar-track", 3],
  ["over-target fill on track", "--bar-fill-over", "--bar-track", 3],
  ["strong over-target fill on track", "--bar-fill-over-strong", "--bar-track", 3],
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

  it("the graphic channel keeps more of the hue than the ink channel", () => {
    // If a graphic knob is ever set at or below its ink knob, the split has
    // silently stopped doing anything and the palette goes flat again — which
    // is exactly the bug this architecture exists to fix, and it would not
    // fail any contrast assertion above.
    for (const [theme, mode] of COMBOS) {
      const vars = tokensFor(theme, mode);
      const ink = Number(vars.get("--k-signal-ink")!.replace("%", ""));
      for (const channel of ["health", "money", "spark", "attention"] as const) {
        const graphic = Number(vars.get(`--k-${channel}-graphic`)!.replace("%", ""));
        expect(graphic, `${channel} in ${theme} ${mode}`).toBeGreaterThanOrEqual(ink);
      }
    }
  });

  it("light mode is where the split actually pays, so prove it there", () => {
    // In dark mode every knob is already 100% and the split is a no-op. The
    // regression to guard is light mode collapsing back to the text floor.
    for (const theme of ["quiet-voltage", "butter-static"] as const) {
      const vars = tokensFor(theme, "light");
      const ink = Number(vars.get("--k-signal-ink")!.replace("%", ""));
      const spark = Number(vars.get("--k-spark-graphic")!.replace("%", ""));
      expect(spark).toBeGreaterThan(ink);
    }
    // quiet-voltage light needs no compromise on spark at all: the brand pink
    // clears 3:1 on both grounds untouched.
    expect(tokensFor("quiet-voltage", "light").get("--k-spark-graphic")).toBe("100%");
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
