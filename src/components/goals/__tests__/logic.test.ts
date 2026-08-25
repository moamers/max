import { describe, expect, it } from "vitest";
import { incomeSourceText, moneyInputAmount, weeklyGoalTotal } from "../logic";

describe("goal and income screen logic", () => {
  it("clamps server mutation values to the numeric-field contract", () => {
    expect(moneyInputAmount(-2)).toBe(0);
    expect(moneyInputAmount(100_000)).toBe(99_999);
    expect(moneyInputAmount(123.9)).toBe(123);
    expect(moneyInputAmount(Number.NaN)).toBe(0);
  });

  it("derives the weekly total from the three inputs", () => {
    expect(weeklyGoalTotal([250, 120, 80])).toBe(450);
  });

  it("does not describe an imported or default figure as a user override", () => {
    expect(incomeSourceText("month", true)).toBe("set by you");
    expect(incomeSourceText("period", false)).toBe("from your import");
    expect(incomeSourceText("default", true)).toBe("your monthly default");
    expect(incomeSourceText("unknown", false)).toBe("no figure yet");
  });
});
