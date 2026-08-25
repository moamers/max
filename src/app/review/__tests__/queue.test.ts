import { describe, expect, it } from "vitest";
import { withoutCurrent } from "../queue";

describe("review queue", () => {
  it("advances past a skipped row without mutating the source queue", () => {
    const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(withoutCurrent(rows)).toEqual([{ id: 2 }, { id: 3 }]);
    expect(rows).toHaveLength(3);
  });
});
