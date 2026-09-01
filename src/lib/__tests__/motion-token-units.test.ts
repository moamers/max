import { describe, it, expect } from "vitest";
import { cssTimeMs } from "../motion";

/**
 * The bug this pins shipped twice before it was found, and it was invisible
 * both times: the animations ran, finished within a third of a millisecond,
 * and left the correct end state on screen. Nothing looked broken. Nothing
 * moved either.
 */
describe("reading a duration token", () => {
  it("reads milliseconds", () => {
    expect(cssTimeMs("320ms")).toBe(320);
    expect(cssTimeMs(" 90ms ")).toBe(90);
    expect(cssTimeMs("1ms")).toBe(1);
  });

  it("reads seconds, which is what a minifier turns short durations into", () => {
    // globals.css says `320ms`; the built stylesheet says `.32s`.
    expect(cssTimeMs(".32s")).toBe(320);
    expect(cssTimeMs("0.32s")).toBe(320);
    expect(cssTimeMs("2s")).toBe(2000);
  });

  it("never returns a duration that is silently a thousand times too small", () => {
    // The actual failure: parseFloat(".32s") === 0.32.
    expect(cssTimeMs(".32s")).toBeGreaterThan(1);
    expect(cssTimeMs(".09s")).toBeGreaterThan(1);
  });

  it("returns 0 for an absent or unreadable token rather than NaN", () => {
    expect(cssTimeMs("")).toBe(0);
    expect(cssTimeMs("   ")).toBe(0);
    expect(cssTimeMs("inherit")).toBe(0);
  });
});
