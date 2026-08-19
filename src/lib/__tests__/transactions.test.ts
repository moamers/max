/**
 * The kind/category vocabulary is agreed on by three things that cannot drift:
 * the parser, the database CHECK constraint, and the migration that carries the
 * old `line_items.section` values across. These tests pin the mapping so a drift
 * surfaces here rather than as wrong money on a screen.
 */
import { describe, it, expect } from "vitest";
import {
  TRANSACTION_KINDS,
  WEEKLY_CATEGORIES,
  RECURRING_CATEGORIES,
  SHEET_SECTIONS,
  SECTION_MAPPING,
  mapSection,
  isValidKindCategory,
  weeklyCategoryForSection,
  WEEKLY_CATEGORY_TITLES,
  RECURRING_CATEGORY_TITLES,
  sectionForKindCategory,
} from "../transactions";

describe("transaction vocabulary", () => {
  it("maps every sheet section, leaving none to fall through a migration", () => {
    for (const section of SHEET_SECTIONS) {
      expect(SECTION_MAPPING[section], section).toBeDefined();
    }
    expect(Object.keys(SECTION_MAPPING).sort()).toEqual([...SHEET_SECTIONS].sort());
  });

  it("carries the founder's own sections onto the design's shape", () => {
    expect(mapSection("grocery")).toEqual({ kind: "weekly", category: "everyday" });
    expect(mapSection("weekend")).toEqual({ kind: "weekly", category: "weekend" });
    expect(mapSection("transport")).toEqual({ kind: "weekly", category: "transport" });
    expect(mapSection("extras")).toEqual({ kind: "one_off", category: null });
  });

  it("sends every bill to the same group rather than guessing at merchant names", () => {
    // Splitting the flat bills list by reading merchant names is a judgement,
    // and a judgement made silently inside a migration is what produced F-3.
    expect(mapSection("bills")).toEqual({ kind: "recurring", category: "bills" });
  });

  it("produces a kind/category pair the database would accept, for every section", () => {
    for (const section of SHEET_SECTIONS) {
      const { kind, category } = SECTION_MAPPING[section];
      expect(isValidKindCategory(kind, category), section).toBe(true);
    }
  });

  it("rejects a category borrowed from the wrong kind", () => {
    expect(isValidKindCategory("weekly", "housing")).toBe(false);
    expect(isValidKindCategory("recurring", "everyday")).toBe(false);
    expect(isValidKindCategory("one_off", "bills")).toBe(false);
    expect(isValidKindCategory("weekly", null)).toBe(false);
    expect(isValidKindCategory("nonsense", "everyday")).toBe(false);
  });

  it("accepts one_off with no category at all", () => {
    expect(isValidKindCategory("one_off", null)).toBe(true);
    expect(isValidKindCategory("one_off", undefined)).toBe(true);
  });

  it("reads weekly budget rows back by section, and refuses non-weekly ones", () => {
    expect(weeklyCategoryForSection("grocery")).toBe("everyday");
    expect(weeklyCategoryForSection("bills")).toBeNull();
    expect(weeklyCategoryForSection("extras")).toBeNull();
    expect(weeklyCategoryForSection("not-a-section")).toBeNull();
  });

  it("has a display title for every category the app can render", () => {
    for (const c of WEEKLY_CATEGORIES) expect(WEEKLY_CATEGORY_TITLES[c], c).toBeTruthy();
    for (const c of RECURRING_CATEGORIES) expect(RECURRING_CATEGORY_TITLES[c], c).toBeTruthy();
    expect(TRANSACTION_KINDS).toHaveLength(3);
  });
});

describe("the reverse mapping is total but lossy", () => {
  it("brings every sheet section back to itself", () => {
    for (const section of SHEET_SECTIONS) {
      const { kind, category } = SECTION_MAPPING[section];
      expect(sectionForKindCategory(kind, category), section).toBe(section);
    }
  });

  it("gives every valid kind/category pair somewhere to land in the sheet", () => {
    // Export writes into the founder's template, which has five blocks and no
    // sixth. A pair with no section would have nowhere to go.
    for (const c of WEEKLY_CATEGORIES) expect(sectionForKindCategory("weekly", c)).not.toBeNull();
    for (const c of RECURRING_CATEGORIES) expect(sectionForKindCategory("recurring", c)).not.toBeNull();
    expect(sectionForKindCategory("one_off", null)).toBe("extras");
  });

  it("collapses all four recurring groups into the sheet's single bills block", () => {
    // Documented, not accidental: the sheet keeps one flat bills list, so the
    // group has nowhere to be recorded.
    const landed = RECURRING_CATEGORIES.map((c) => sectionForKindCategory("recurring", c));
    expect(new Set(landed)).toEqual(new Set(["bills"]));
  });

  it("loses the recurring group across a sheet round trip", () => {
    // G-4. Re-file rent under Housing, export, re-import — it returns as bills.
    // This is a limit of the template, and export must not claim otherwise.
    const section = sectionForKindCategory("recurring", "housing")!;
    expect(SECTION_MAPPING[section]).toEqual({ kind: "recurring", category: "bills" });
  });

  it("refuses a pair the database would reject rather than inventing a section", () => {
    expect(sectionForKindCategory("weekly", "housing")).toBeNull();
    expect(sectionForKindCategory("nonsense", null)).toBeNull();
  });
});
