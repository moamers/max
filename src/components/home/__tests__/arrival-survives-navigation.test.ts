import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

/**
 * The arrival overlay covers the whole screen while it plays, so anything that
 * leaves it on screen breaks the app completely rather than subtly.
 *
 * The bug this guards: a module-level `let armed = false` was used to stop
 * React StrictMode's second effect pass from restarting the choreography. It
 * did that — but module scope outlives a mount, so leaving home for Year and
 * coming back re-rendered the overlay while the flag made the effect return
 * early *without clearing it*. Home was rendered and unreachable behind an
 * opaque overlay: the app looked empty apart from the logo in the middle.
 *
 * Two different questions were being answered by one flag:
 *
 *   "has this EFFECT already run for this mount?"  -> a ref, which survives
 *      StrictMode's simulated remount and is fresh on a real one.
 *   "has this TAB already arrived?"                -> sessionStorage, which
 *      must outlive every mount.
 *
 * Source-scanned because the failure is a React lifecycle interaction across a
 * client-side navigation, which this project has no renderer to reproduce. The
 * behaviour itself was verified in a browser: navigate away and back, the
 * overlay must compute to `display: none`.
 */
const SOURCE = fs.readFileSync(
  path.join(process.cwd(), "src", "components", "home", "Arrival.tsx"),
  "utf8"
);

/** Strip comments — this file explains the bug at length, in prose. */
const CODE = SOURCE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("the arrival cannot strand itself over the app", () => {
  it("keeps no mutable state at module scope", () => {
    // `let` or `var` outside a function outlives every mount, which is the
    // exact lifetime mismatch that caused this.
    const moduleLevel = [...CODE.matchAll(/^(let|var)\s+(\w+)/gm)].map((m) => m[0]);
    expect(moduleLevel, `module-scoped mutable state:\n${moduleLevel.join("\n")}`).toEqual([]);
  });

  it("uses a ref for the StrictMode guard, so a real remount starts fresh", () => {
    expect(CODE).toMatch(/useRef\(false\)/);
    expect(CODE).toMatch(/\.current\s*\)\s*return/);
    expect(CODE).toMatch(/\.current\s*=\s*true/);
  });

  it("every path out of the effect leaves the overlay hidden or playing", () => {
    // The "already arrived" branch must hide, never merely return.
    const seenBranch = CODE.slice(CODE.indexOf("if (seen)"));
    expect(seenBranch.slice(0, 120)).toMatch(/hide\(/);
  });

  it("hides rather than removing, so React keeps owning the node", () => {
    // el.remove() on a node React rendered invites a removeChild on a node it
    // still believes it has.
    expect(CODE).not.toMatch(/\bel\.remove\(\)/);
    expect(CODE).toMatch(/display = "none"/);
  });

  it("records the arrival only once it has finished playing", () => {
    // Written up front, an interrupted load counts as an arrival nobody saw.
    const setIndex = CODE.indexOf("setItem(SEEN");
    const doneIndex = CODE.indexOf("const done");
    expect(setIndex).toBeGreaterThan(doneIndex);
  });
});
