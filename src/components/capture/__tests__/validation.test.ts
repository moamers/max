import { describe, it, expect } from "vitest";
import {
  sanitizeAmountInput,
  clampSliderValue,
  formatAmount,
  categoriesForKind,
  categoryStillValidForKind,
  validateAddDraft,
  AMOUNT_MAX,
  SLIDER_MAX,
  SLIDER_MIN,
} from "../validation";

describe("sanitizeAmountInput", () => {
  it("parses a plain integer", () => {
    expect(sanitizeAmountInput("42")).toBe(42);
  });

  it("keeps pence", () => {
    expect(sanitizeAmountInput("12.5")).toBe(12.5);
    expect(sanitizeAmountInput("0.05")).toBe(0.05);
  });

  it("strips everything but digits and one decimal point", () => {
    expect(sanitizeAmountInput("£12.50")).toBe(12.5);
    expect(sanitizeAmountInput("1,234.56")).toBe(1234.56);
  });

  it("collapses a second decimal point rather than erroring", () => {
    expect(sanitizeAmountInput("12.5.6")).toBe(12.56);
  });

  it("treats an empty or bare-dot input as zero", () => {
    expect(sanitizeAmountInput("")).toBe(0);
    expect(sanitizeAmountInput(".")).toBe(0);
  });

  it("clamps to the same ceiling as every other numeric field in the app", () => {
    expect(sanitizeAmountInput("999999")).toBe(AMOUNT_MAX);
  });

  it("never goes negative", () => {
    expect(sanitizeAmountInput("-50")).toBe(50); // the minus sign is stripped, not parsed as negative
  });

  it("rounds to whole pence", () => {
    expect(sanitizeAmountInput("12.999")).toBe(13);
  });
});

describe("clampSliderValue", () => {
  it("snaps to the nearest 5p step", () => {
    expect(clampSliderValue(12.03)).toBeCloseTo(12.05, 5);
    expect(clampSliderValue(12.01)).toBeCloseTo(12, 5);
  });

  it("clamps to the track's range", () => {
    expect(clampSliderValue(-10)).toBe(SLIDER_MIN);
    expect(clampSliderValue(10_000)).toBe(SLIDER_MAX);
  });

  it("is stable under repeated 0.05 steps — no float drift", () => {
    let v = 0;
    for (let i = 0; i < 20; i++) v = clampSliderValue(v + 0.05);
    expect(v).toBeCloseTo(1, 5);
  });
});

describe("formatAmount", () => {
  it("drops the decimal for whole pounds", () => {
    expect(formatAmount(42)).toBe("42");
  });

  it("keeps two decimal places otherwise", () => {
    expect(formatAmount(12.5)).toBe("12.50");
  });
});

describe("categoriesForKind — the kind -> category dependency", () => {
  it("weekly offers everyday/weekend/transport", () => {
    expect(categoriesForKind("weekly").map((c) => c.value)).toEqual(["everyday", "weekend", "transport"]);
  });

  it("recurring offers housing/childcare/bills/subscriptions", () => {
    expect(categoriesForKind("recurring").map((c) => c.value)).toEqual([
      "housing",
      "childcare",
      "bills",
      "subscriptions",
    ]);
  });

  it("one-off spend offers no sub-category — that is the point of it", () => {
    expect(categoriesForKind("one_off")).toEqual([]);
  });
});

describe("categoryStillValidForKind — switching kind invalidates the old category", () => {
  it("a weekly category is invalid once the kind becomes recurring", () => {
    expect(categoryStillValidForKind("recurring", "everyday")).toBe(false);
  });

  it("a recurring category is invalid once the kind becomes weekly", () => {
    expect(categoryStillValidForKind("weekly", "housing")).toBe(false);
  });

  it("one-off spend is only valid with no category", () => {
    expect(categoryStillValidForKind("one_off", null)).toBe(true);
    expect(categoryStillValidForKind("one_off", "everyday")).toBe(false);
  });

  it("a category from the same kind stays valid", () => {
    expect(categoryStillValidForKind("weekly", "weekend")).toBe(true);
    expect(categoryStillValidForKind("recurring", "bills")).toBe(true);
  });
});

describe("validateAddDraft — the add form's validation", () => {
  const base = { amount: 12, where: "Tesco", kind: "weekly" as const, category: "everyday" as const };

  it("accepts a complete weekly draft", () => {
    expect(validateAddDraft(base)).toEqual({ valid: true, errors: {} });
  });

  it("rejects a zero amount", () => {
    expect(validateAddDraft({ ...base, amount: 0 }).errors.amount).toBeDefined();
  });

  it("rejects an empty or whitespace-only 'where'", () => {
    expect(validateAddDraft({ ...base, where: "" }).errors.where).toBeDefined();
    expect(validateAddDraft({ ...base, where: "   " }).errors.where).toBeDefined();
  });

  it("rejects a category that doesn't belong to the chosen kind", () => {
    expect(validateAddDraft({ ...base, kind: "recurring", category: "everyday" as never }).errors.category).toBeDefined();
  });

  it("accepts one-off spend with no category", () => {
    expect(validateAddDraft({ amount: 5, where: "Cash", kind: "one_off", category: null })).toEqual({
      valid: true,
      errors: {},
    });
  });

  it("rejects recurring with no category chosen yet", () => {
    expect(validateAddDraft({ ...base, kind: "recurring", category: null }).errors.category).toBeDefined();
  });
});
