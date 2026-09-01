import { describe, expect, it } from "vitest";
import { resolveInitialAmount, shouldFocusAmount } from "../prefill";

describe("amount query prefill", () => {
  it.each([
    [{ amount: "12.65" }, 12.65],
    [{ amount: ["9.50", "100"] }, 9.5],
    [{ amount: "0" }, 0],
    [{ amount: "100000" }, 0],
    [{ amount: "12.345" }, 0],
    [{ amount: "12+3" }, 0],
    [{}, 0],
  ])("validates %j", (params, expected) => {
    expect(resolveInitialAmount(params)).toBe(expected);
  });
});

describe("where the cursor starts on the add sheet", () => {
  it("takes the amount field when the form arrived empty", () => {
    expect(shouldFocusAmount({ amount: 0, where: "", label: "" })).toBe(true);
    expect(shouldFocusAmount({ amount: 0, where: "  ", label: " " })).toBe(true);
  });

  it.each([
    [{ amount: 12.5, where: "", label: "" }, "an amount"],
    [{ amount: 0, where: "Tesco", label: "" }, "a merchant"],
    [{ amount: 0, where: "", label: "dxb-26" }, "a label"],
  ])("leaves the cursor alone when the form arrived carrying %j (%s)", (draft) => {
    expect(shouldFocusAmount(draft)).toBe(false);
  });
});
