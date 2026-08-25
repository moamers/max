import { describe, expect, it } from "vitest";
import { instalmentsStillDue, recurringSharePercent } from "../derive";
import { formatMoney } from "../format";

describe("recurringSharePercent", () => {
  it("expresses each recurring group as a share of the known recurring total", () => {
    expect(recurringSharePercent(1_664, 2_975)).toBeCloseTo(55.9328, 3);
    expect(recurringSharePercent(275, 2_975)).toBeCloseTo(9.2437, 3);
  });

  it("does not manufacture a share from an absent or invalid total", () => {
    expect(recurringSharePercent(100, 0)).toBe(0);
    expect(recurringSharePercent(-10, 100)).toBe(0);
    expect(recurringSharePercent(Number.NaN, 100)).toBe(0);
  });
});
describe("instalmentsStillDue", () => {
  it("derives the remaining count from an inspectable imported note", () => {
    expect(instalmentsStillDue("instalment 1 of 3 · £594 total")).toBe("2 of 3 still due");
    expect(instalmentsStillDue("Installments 2 of 4")).toBe("2 of 4 still due");
  });

  it("says nothing when the note does not establish a remaining count", () => {
    expect(instalmentsStillDue("holiday payment")).toBeNull();
    expect(instalmentsStillDue("instalment 3 of 3")).toBeNull();
    expect(instalmentsStillDue(null)).toBeNull();
  });
});

describe("formatMoney", () => {
  it("keeps source pence without adding .00 to the design's whole-pound values", () => {
    expect(formatMoney(2_975)).toBe("£2,975");
    expect(formatMoney(3_745.33)).toBe("£3,745.33");
    expect(formatMoney(-119.17)).toBe("−£119.17");
  });
});
