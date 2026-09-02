import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FOLD_BODY,
  FOLD_CHROME,
  FOLD_SCALE,
  FOLD_SCREEN,
  foldDirection,
  foldScales,
} from "@/components/nav/scope-fold";

const root = join(__dirname, "..", "..", "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

/**
 * THE FOLD — what has to stay true for a scope change to be visible.
 *
 * The fold's whole history is of things that passed every gate and did not
 * move: the `<ViewTransition>` version typechecked, linted, built and rendered,
 * and `document.startViewTransition` was called zero times. So this pins the
 * parts a test can actually reach — the direction maths, and the four marks in
 * the markup without which the runtime animates nothing — and the browser
 * verification lives in `docs/product/13-verifying-motion.md`.
 */
describe("which way a scope change travels", () => {
  it("widens out toward the longer span and narrows in toward the shorter", () => {
    expect(foldDirection("week", "month")).toBe("scope-out");
    expect(foldDirection("month", "year")).toBe("scope-out");
    expect(foldDirection("week", "year")).toBe("scope-out");
    expect(foldDirection("year", "month")).toBe("scope-in");
    expect(foldDirection("month", "week")).toBe("scope-in");
  });

  it("has no direction for a non-scope, which is what keeps Settings a layer", () => {
    expect(foldDirection("month", "settings")).toBeNull();
    expect(foldDirection("settings", "month")).toBeNull();
    expect(foldDirection("month", "month")).toBeNull();
  });
});

describe("the two scales", () => {
  it("are exact inverses, so back retraces rather than approximating", () => {
    expect(FOLD_SCALE.receding * FOLD_SCALE.advancing).toBeCloseTo(1, 12);
  });

  it("mirror: what the old screen does going out, the new screen undoes coming back", () => {
    const out = foldScales("scope-out");
    const back = foldScales("scope-in");
    expect(out.leaves).toBe(back.arrives);
    expect(out.arrives).toBe(back.leaves);
  });

  it("stays a hint of depth, not a zoom", () => {
    // Anything larger reads as the screen lurching. 3.5%, both ways.
    expect(Math.abs(1 - FOLD_SCALE.receding)).toBeLessThan(0.05);
    expect(Math.abs(1 - FOLD_SCALE.advancing)).toBeLessThan(0.05);
  });
});

/**
 * Every screen the nav pill appears on is a screen a fold can land on, so
 * every one of them has to carry the two marks. A screen that forgets them
 * does not throw and does not look broken — it just quietly does not animate,
 * which is precisely the failure mode this whole area keeps producing.
 */
describe("the marks the runtime looks for", () => {
  const screens = [
    "src/components/home/HomeScreen.tsx",
    "src/components/menu/Menu.tsx",
    "src/components/year/YearView.tsx",
    "src/app/week/[weekNumber]/WeekView.tsx",
  ];

  it.each(screens)("%s photographs itself and names the part that folds", (path) => {
    const source = read(path);
    expect(source).toContain("<BottomNav");
    expect(source).toContain(`${FOLD_SCREEN}=""`);
    expect(source).toContain(`${FOLD_BODY}=""`);
  });

  it("marks the pill as chrome, so it is cut out of the photograph", () => {
    expect(read("src/components/nav/BottomNav.tsx")).toContain(`${FOLD_CHROME}=""`);
  });

  it("keeps the pill outside every folding body", () => {
    // A transform on an ancestor of the pill would scale it AND re-anchor it:
    // `position: fixed` inside a transformed element is positioned against
    // that element, not the viewport. In each screen the nav is a sibling of
    // the body, after it — never inside.
    for (const path of screens) {
      const source = read(path);
      const body = source.indexOf(`${FOLD_BODY}=""`);
      const nav = source.indexOf("<BottomNav");
      expect(body).toBeGreaterThan(-1);
      expect(nav).toBeGreaterThan(body);
    }
  });
});

describe("the runtime", () => {
  const runtime = read("src/components/nav/fold-runtime.ts");

  it("reads durations through motionToken, which carries the unit", () => {
    // `parseFloat` on a minified `.32s` is a third of a millisecond. That is
    // how the first two rounds of motion work shipped invisible.
    expect(runtime).toContain("motionToken(");
    expect(runtime).not.toContain("parseFloat(");
  });

  it("animates only opacity and transform — never a layout property", () => {
    // Animating `width` or `height` relayouts every frame, which is the
    // difference between a moment that holds 60fps and one the founder calls
    // laggy. The ghost's own `width`/`height` are static positioning, set
    // once, so only the keyframes are read here.
    const keyframes = [...runtime.matchAll(/\.animate\(\s*\[([\s\S]*?)\],/g)].map((m) => m[1]);
    expect(keyframes.length).toBeGreaterThan(0);
    for (const block of keyframes) {
      expect(block).toMatch(/opacity|transform/);
      expect(block).not.toMatch(/\b(width|height|top|left|right|bottom|margin|padding)\s*:/);
    }
  });

  it("bails out under reduced motion rather than flinching for a millisecond", () => {
    expect(runtime).toContain("prefersReducedMotion()");
  });

  it("freezes the photograph, which cloneNode would otherwise re-animate", () => {
    // The week screen's sheet animates itself in on mount. A clone of it
    // carries the class and replays that, so the still image slides.
    const css = read("src/app/globals.css");
    expect(css).toMatch(/\[data-fold-ghost\][\s\S]{0,80}\{[\s\S]{0,160}animation:\s*none\s*!important/);
  });

  it("no longer asks the browser for a view transition", () => {
    // The name still appears in ScopeFold's header, explaining what was tried
    // and measured. What must not come back is the import and the element.
    const wrapper = read("src/components/nav/ScopeFold.tsx");
    expect(wrapper).not.toContain("<ViewTransition");
    expect(wrapper).not.toMatch(/import\s*\{[^}]*ViewTransition/);
    expect(read("src/app/globals.css")).not.toMatch(/^::view-transition/m);
  });
});
