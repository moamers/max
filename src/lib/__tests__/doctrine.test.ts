/**
 * T-12: doctrines whose TEST is mechanically evaluable get an automated check.
 * A doctrine nobody can verify is a doctrine nobody follows.
 */
import { describe, it, expect } from "vitest";
import { findToneViolations, isToneCompliant, assertToneCompliant } from "../tone";
import { buildNarrative, type NarrativeInput } from "../narrative";
import { computeInsights } from "../insights";
import { detectByRules, labelFromFileName } from "../workbook-mapping";
import { parsePeriodLabel, describePeriod, formatPeriodLength } from "../period-dates";

// ---------------------------------------------------------------- B-23 tone

describe("B-23 · banned vocabulary", () => {
  it.each([
    "You're overspending on groceries",
    "That was a waste of money",
    "You should have saved more",
    "This is a bad habit",
    "You're behind on your goals",
    "You failed to hit your budget",
    "That's too much for one week",
  ])("rejects %j", (text) => {
    expect(isToneCompliant(text)).toBe(false);
  });

  it.each([
    "Your weeks ranged from about £362 to £789 — week 5 was the biggest.",
    "Weekday running costs came to about £1,794, and weekends about £727.",
    "The sheet records £2,285 coming in for this period. Is that the whole picture?",
    "Nothing much stands out this period.",
  ])("accepts %j", (text) => {
    expect(findToneViolations(text)).toEqual([]);
  });

  it("does not false-positive on substrings inside other words", () => {
    // "behind" is banned; "behindhand" style substrings must not trip it.
    expect(isToneCompliant("The rebate landed on Tuesday.")).toBe(true);
    expect(isToneCompliant("Waste collection was £12.")).toBe(false); // genuine hit
  });

  it("throws at the emit gate", () => {
    expect(() => assertToneCompliant("You overspent", "test")).toThrow(/B-23/);
  });
});

// ------------------------------------------------------- narrative doctrine

const sections = { bills: 416.22, extras: 3400.55, grocery: 1380.59, weekend: 727.21, transport: 413.43 };
const weeks = [
  { weekNumber: 1, total: 408.2 },
  { weekNumber: 2, total: 361.52 },
  { weekNumber: 3, total: 407.82 },
  { weekNumber: 4, total: 554.57 },
  { weekNumber: 5, total: 789.12 },
];
const tags = [
  { tag: "fam-uk", section: "extras", total: 2637, count: 18 },
  { tag: "nadia", section: "extras", total: 172.73, count: 4 },
];

function input(overrides: Partial<NarrativeInput> = {}): NarrativeInput {
  const summaries = [
    {
      periodId: 26,
      label: "Jun 30th - Aug 3rd",
      createdAt: "2026-08-14T00:00:00.000Z",
      totalFixed: sections.bills,
      totalVariable: sections.extras,
      totalWeekly: 2521.23,
      income: 2285,
      finalPosition: 2285 - 6338,
    },
  ];
  return {
    periodLabel: "Jun 30th - Aug 3rd",
    income: 2285,
    sections,
    weeks,
    tags,
    insights: computeInsights(summaries),
    ...overrides,
  };
}

describe("narrative", () => {
  it("every generated sentence is tone-compliant (B-23)", () => {
    for (const s of buildNarrative(input(), 10)) {
      expect(findToneViolations(s.text), s.text).toEqual([]);
    }
  });

  it("B-20 · returns at most the requested number of observations", () => {
    expect(buildNarrative(input(), 3).length).toBeLessThanOrEqual(3);
  });

  it("B-8 · a possibly-incomplete income is an inference, phrased as a question", () => {
    const s = buildNarrative(input(), 10).find((x) => x.id === "income-partial");
    expect(s).toBeDefined();
    expect(s!.provenance).toBe("inference");
    expect(s!.text).toContain("?");
  });

  it("B-24 · never leads with a bare period total or a deficit", () => {
    const first = buildNarrative(input(), 3)[0];
    expect(first.text).not.toMatch(/you spent/i);
    expect(first.text).not.toMatch(/-\s*£/);
    expect(first.text).not.toMatch(/short|deficit|over budget/i);
  });

  it("says nothing when nothing stands out", () => {
    const flat = buildNarrative(
      input({
        income: 6000,
        weeks: [
          { weekNumber: 1, total: 400 },
          { weekNumber: 2, total: 405 },
          { weekNumber: 3, total: 398 },
        ],
        tags: [],
        sections: { ...sections, extras: 100 },
      }),
      3
    );
    expect(flat.every((s) => s.id !== "income-partial")).toBe(true);
  });
});

// ------------------------------------------------------ F-1 regression tests

describe("F-1 · workbook mapping", () => {
  it("maps a real-shaped workbook to ONE period with real week numbers", () => {
    const m = detectByRules(
      ["Month summary", "Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "2026-2027 Aggregates"],
      "Jun 30th - Aug 3rd.xlsx"
    );
    expect(m.strategy).toBe("workbook-is-period");
    expect(m.periodLabel).toBe("Jun 30th - Aug 3rd");
    const weekRoles = m.sheets.filter((s) => s.role.kind === "week");
    expect(weekRoles).toHaveLength(5);
    expect(weekRoles.map((s) => (s.role.kind === "week" ? s.role.weekNumber : 0))).toEqual([1, 2, 3, 4, 5]);
    expect(m.sheets.find((s) => s.sheetName.includes("Aggregates"))!.role.kind).toBe("ignore");
  });

  it("falls back to sheet-per-period when no week sheets exist", () => {
    const m = detectByRules(["Jul 6th - Aug 2nd", "Aug 3rd - Aug 30th"], "book.xlsx");
    expect(m.strategy).toBe("sheet-is-period");
  });

  it("strips the extension when deriving a period label", () => {
    expect(labelFromFileName("Jun 30th - Aug 3rd.xlsx")).toBe("Jun 30th - Aug 3rd");
  });
});

// ---------------------------------------------- period legibility (T-2 pure)

describe("period dates · a label the user wrote becomes dates they can read", () => {
  const ref = new Date(Date.UTC(2026, 7, 14)); // 14 Aug 2026, when the sheet was uploaded

  it("reads 'Jun 30th - Aug 3rd' as a real range", () => {
    const d = parsePeriodLabel("Jun 30th - Aug 3rd", ref)!;
    expect(d.start.toISOString().slice(0, 10)).toBe("2026-06-30");
    expect(d.end.toISOString().slice(0, 10)).toBe("2026-08-03");
    expect(d.days).toBe(35);
  });

  it("formats the range with the year stated once", () => {
    expect(describePeriod("Jun 30th - Aug 3rd", ref, 5)).toEqual({
      range: "30 June – 3 August 2026",
      length: "5 weeks",
    });
  });

  it("rolls a December→January period into the next year", () => {
    const d = parsePeriodLabel("Dec 29th - Jan 25th", new Date(Date.UTC(2027, 0, 30)))!;
    expect(d.start.getUTCFullYear()).toBe(2026);
    expect(d.end.getUTCFullYear()).toBe(2027);
  });

  it("puts a period back a year rather than dating it in the future", () => {
    const d = parsePeriodLabel("Nov 1st - Nov 28th", new Date(Date.UTC(2026, 1, 3)))!;
    expect(d.start.getUTCFullYear()).toBe(2025);
  });

  it.each(["Aggregates", "Week 3", "", "Sheet1", "Jun 30th"])(
    "returns null rather than inventing dates for %j",
    (label) => {
      expect(parsePeriodLabel(label, ref)).toBeNull();
      expect(describePeriod(label, ref)).toBeNull();
    }
  );

  it("falls back to the day count when week tabs are absent", () => {
    expect(formatPeriodLength(35)).toBe("5 weeks");
    expect(formatPeriodLength(30)).toBe("4 weeks and 2 days");
    expect(formatPeriodLength(1)).toBe("1 day");
  });
});
