import { describe, expect, it } from "vitest";
import { resolveInitialAmount } from "../prefill";

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
