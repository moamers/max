/**
 * Empty is not zero.
 *
 * Every money field used to render an unset amount as a literal `0` that had to
 * be selected and deleted before anything could be typed. The fix is a
 * placeholder — which only works if "nothing has been said" and "somebody typed
 * nought" stay distinguishable all the way to the database, because they are
 * different claims about someone's money.
 */
import { describe, expect, it } from "vitest";
import { numericFieldText, parseTypedAmount, sanitizeNumericInput } from "../NumericField";

describe("what the field shows", () => {
  it("shows nothing for an unset value, so the placeholder can", () => {
    expect(numericFieldText(null, null)).toBe("");
  });

  it("shows a typed zero as a real zero", () => {
    expect(numericFieldText(0, null)).toBe("0");
  });

  it("shows the stored figure when nothing is being typed", () => {
    expect(numericFieldText(96.76, null)).toBe("96.76");
  });

  it("hands the field back to the user while they are typing", () => {
    // Including the mid-entry states a number cannot represent.
    expect(numericFieldText(123, "123.")).toBe("123.");
    expect(numericFieldText(123, "")).toBe("");
  });
});

describe("what a keystroke means", () => {
  it("reads an emptied field as nothing said, not as nought", () => {
    expect(parseTypedAmount("")).toBeNull();
  });

  it("reads a typed zero as zero", () => {
    expect(parseTypedAmount("0")).toBe(0);
  });

  it("still keeps pence — the decimal point survives a keystroke", () => {
    // Register #48 ("numeric fields reject decimal points") is what the `draft`
    // mechanism fixed; this is the guard that it stays fixed.
    expect(parseTypedAmount("28.65")).toBe(28.65);
    expect(sanitizeNumericInput("28.65")).toBe(28.65);
    expect(sanitizeNumericInput("96.7")).toBe(96.7);
  });

  it("clamps the way it always did", () => {
    expect(parseTypedAmount("100000")).toBe(99_999);
    expect(parseTypedAmount(".")).toBe(0);
  });
});
