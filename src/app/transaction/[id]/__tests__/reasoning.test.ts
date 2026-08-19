import { describe, it, expect } from "vitest";
import { reasoningFor } from "../reasoning";

describe("reasoningFor", () => {
  it("explains a weekend-categorised transaction actually dated on a Saturday", () => {
    // 2026-08-08 is a Saturday.
    expect(reasoningFor("weekly", "weekend", "2026-08-08")).toBe("Saturday, so I filed it under Weekend.");
  });

  it("explains a weekend-categorised transaction dated on a Sunday", () => {
    // 2026-08-09 is a Sunday.
    expect(reasoningFor("weekly", "weekend", "2026-08-09")).toBe("Sunday, so I filed it under Weekend.");
  });

  it("says nothing when the weekend category doesn't actually fall on a weekend day", () => {
    // 2026-08-10 is a Monday.
    expect(reasoningFor("weekly", "weekend", "2026-08-10")).toBeNull();
  });

  it("says nothing without a date — no fabricated reason for missing data", () => {
    expect(reasoningFor("weekly", "weekend", null)).toBeNull();
  });

  it("says nothing for categories other than weekend", () => {
    expect(reasoningFor("weekly", "everyday", "2026-08-08")).toBeNull();
    expect(reasoningFor("weekly", "transport", "2026-08-08")).toBeNull();
  });

  it("says nothing for recurring or one-off kinds", () => {
    expect(reasoningFor("recurring", "housing", "2026-08-08")).toBeNull();
    expect(reasoningFor("one_off", null, "2026-08-08")).toBeNull();
  });

  it("says nothing for an unparsable date", () => {
    expect(reasoningFor("weekly", "weekend", "not-a-date")).toBeNull();
  });
});
