import { describe, expect, it, vi } from "vitest";
import type { SuggestionEntry, SuggestionHistory } from "@/lib/queries/suggestions";
import {
  coalesceSuggestionLoad,
  filterAndRankSuggestions,
  suggestionsOfKind,
} from "../suggestions";

function entry(value: string, count: number, mostRecent: string): SuggestionEntry {
  return { value, count, mostRecent };
}

describe("autocomplete ranking and filtering", () => {
  it("ranks frequency first and recency next", () => {
    const rows = [
      entry("Frequent but older", 8, "2026-01-01"),
      entry("Recent but rarer", 2, "2026-08-20"),
      entry("Recent tie", 4, "2026-08-22"),
      entry("Older tie", 4, "2026-07-01"),
    ];

    expect(filterAndRankSuggestions(rows, "").map((row) => row.value)).toEqual([
      "Frequent but older",
      "Recent tie",
      "Older tie",
      "Recent but rarer",
    ]);
  });

  it("breaks complete ties deterministically without merging values", () => {
    const rows = [
      entry("Tesco", 3, "2026-08-20"),
      entry("TESCO EXPRESS", 3, "2026-08-20"),
    ];

    expect(filterAndRankSuggestions(rows, "").map((row) => row.value)).toEqual([
      "Tesco",
      "TESCO EXPRESS",
    ]);
  });

  it("matches case-insensitively but returns the exact stored value", () => {
    const rows = [
      entry("Tesco", 2, "2026-08-20"),
      entry("TESCO EXPRESS", 1, "2026-08-22"),
      entry("Corner shop", 5, "2026-08-23"),
    ];

    expect(filterAndRankSuggestions(rows, "tEsCo").map((row) => row.value)).toEqual([
      "Tesco",
      "TESCO EXPRESS",
    ]);
  });

  it("returns nothing for empty history", () => {
    expect(filterAndRankSuggestions([], "tesco")).toEqual([]);
  });

  it("returns a single matching entry unchanged", () => {
    const only = entry("Café Roma", 1, "2026-08-20");
    expect(filterAndRankSuggestions([only], "CAFÉ")).toEqual([only]);
  });

  it("treats filter characters literally rather than as regular expressions", () => {
    const special = entry("C++ [Market] (North)", 1, "2026-08-20");
    expect(filterAndRankSuggestions([special], "[Market]")).toEqual([special]);
    expect(filterAndRankSuggestions([special], "++")).toEqual([special]);
  });

  it("caps the visible list", () => {
    const rows = Array.from({ length: 8 }, (_, index) =>
      entry(`Place ${index}`, 8 - index, `2026-08-${String(index + 1).padStart(2, "0")}`)
    );
    expect(filterAndRankSuggestions(rows, "")).toHaveLength(5);
  });

  it("selects the requested history bucket", () => {
    const history: SuggestionHistory = {
      merchants: [entry("Shop", 1, "2026-08-20")],
      labels: [entry("holiday", 1, "2026-08-20")],
    };
    expect(suggestionsOfKind(history, "merchant")).toBe(history.merchants);
    expect(suggestionsOfKind(history, "label")).toBe(history.labels);
  });
});

describe("suggestion request coalescing", () => {
  it("shares one in-flight request without retaining resolved user data", async () => {
    let resolveFirst!: (history: SuggestionHistory) => void;
    const firstHistory: SuggestionHistory = { merchants: [], labels: [] };
    const secondHistory: SuggestionHistory = { merchants: [], labels: [] };
    const load = vi
      .fn<() => Promise<SuggestionHistory>>()
      .mockImplementationOnce(
        () => new Promise<SuggestionHistory>((resolve) => { resolveFirst = resolve; })
      )
      .mockResolvedValueOnce(secondHistory);

    const first = coalesceSuggestionLoad(load);
    const shared = coalesceSuggestionLoad(load);
    expect(shared).toBe(first);
    expect(load).toHaveBeenCalledTimes(1);

    resolveFirst(firstHistory);
    await first;
    await Promise.resolve();

    const later = coalesceSuggestionLoad(load);
    expect(later).not.toBe(first);
    await expect(later).resolves.toBe(secondHistory);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
