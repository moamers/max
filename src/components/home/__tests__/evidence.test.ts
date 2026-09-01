/**
 * Every tape Home offers, checked against the figure it opens.
 *
 * These are the blocks a real user will tap, built from the same view models
 * the screen renders, so a change to `monthOverview` or `weeklyBreakdown` that
 * breaks the arithmetic fails here rather than showing someone a list of
 * numbers that does not reach their own.
 */
import { describe, it, expect } from "vitest";
import { heroForecastTape, heroTodayTape, weekTape } from "../evidence";
import { sumOfLines } from "@/components/ui/tape-grammar";
import type { CategoryView, HeroView, WeekView } from "../types";

const hero = (overrides: Partial<HeroView> = {}): HeroView => ({
  monthName: "August",
  endOfMonthLabel: "3 Aug",
  daysRemaining: 12,
  forecastDetail: { weeklyRemaining: 545, leftToday: 1800 },
  today: { spare: 1800, spend: 7747 },
  forecast: { spare: 1255, spend: 8292 },
  income: 9547,
  spentByKind: { weekly: 3767.7, recurring: 3406.3, oneOff: 573 },
  ...overrides,
});

const category = (title: string, spent: number, goal: number | null): CategoryView => ({
  category: title.toLowerCase(),
  title,
  spent,
  goal,
  state: { amount: spent, word: "spent", tone: "muted" },
  footer: "",
});

const week = (overrides: Partial<WeekView> = {}): WeekView => ({
  weekNumber: 4,
  range: "24 – 30 Aug",
  isLive: true,
  spent: 299.32,
  goal: 545,
  state: { amount: 245.68, word: "left", tone: "lime" },
  categories: [
    category("Everyday", 210.45, 320),
    category("Weekend", 82.85, 145),
    category("Transport", 6.02, 80),
  ],
  ...overrides,
});

describe("the hero figure, in Today", () => {
  it("lists income and the three kinds, and they reach the figure", () => {
    const block = heroTodayTape(hero())!;
    expect(block).not.toBeNull();
    expect(block.lines.map((l) => l.label)).toEqual(["Income", "Weeks", "Recurring", "One-offs"]);
    expect(sumOfLines(block.lines)).toBeCloseTo(block.total, 2);
    expect(block.total).toBe(1800);
  });

  it("states the spending as money going out, not as bare magnitudes", () => {
    const block = heroTodayTape(hero())!;
    expect(block.lines.filter((l) => l.amount < 0)).toHaveLength(3);
  });

  it("does not open when there is no income to work from", () => {
    expect(heroTodayTape(hero({ income: null, today: { spare: null, spend: 7747 } }))).toBeNull();
  });

  it("does not open when the three kinds disagree with the figure", () => {
    // The exact failure this guards: a screen that says £1,800 over a list
    // that comes to £1,200. Better to state the figure and offer nothing.
    const wrong = hero({ spentByKind: { weekly: 3767.7, recurring: 3406.3, oneOff: 1173 } });
    expect(heroTodayTape(wrong)).toBeNull();
  });
});

describe("the hero figure, in End of month", () => {
  it("names the assumption the forecast is making", () => {
    const block = heroForecastTape(hero())!;
    expect(block.lines.map((l) => l.label)).toEqual([
      "Income",
      "Out so far",
      "Weekly budget still to come",
    ]);
    expect(sumOfLines(block.lines)).toBeCloseTo(block.total, 2);
    expect(block.total).toBe(1255);
  });

  it("does not open without the working behind the forecast", () => {
    expect(heroForecastTape(hero({ forecastDetail: undefined }))).toBeNull();
  });

  it("does not open when the month has no forecast at all", () => {
    expect(heroForecastTape(hero({ forecast: { spare: null, spend: null } }))).toBeNull();
  });
});

describe("a week's figure", () => {
  it("opens 'left' as the target minus each category", () => {
    const block = weekTape(week())!;
    expect(block.lines.map((l) => l.label)).toEqual(["Your target", "Everyday", "Weekend", "Transport"]);
    expect(block.lines[0].amount).toBe(545);
    expect(sumOfLines(block.lines)).toBeCloseTo(245.68, 2);
    expect(block.total).toBe(245.68);
  });

  it("opens 'over' as each category minus the target", () => {
    const block = weekTape(
      week({
        spent: 600,
        categories: [category("Everyday", 400, 320), category("Weekend", 150, 145), category("Transport", 50, 80)],
        state: { amount: 55, word: "over", tone: "over" },
      })
    )!;
    expect(block.lines.at(-1)!.amount).toBe(-545);
    expect(sumOfLines(block.lines)).toBeCloseTo(55, 2);
  });

  it("opens 'spent' as the categories themselves when there is no target", () => {
    const block = weekTape(
      week({
        goal: null,
        spent: 299.32,
        categories: [category("Everyday", 210.45, null), category("Weekend", 82.85, null), category("Transport", 6.02, null)],
        state: { amount: 299.32, word: "spent", tone: "muted" },
      })
    )!;
    expect(block.lines).toHaveLength(3);
    expect(sumOfLines(block.lines)).toBeCloseTo(299.32, 2);
  });

  it("opens a week that hasn't started as the targets it is made of", () => {
    const block = weekTape(
      week({
        spent: 0,
        categories: [category("Everyday", 0, 320), category("Weekend", 0, 145), category("Transport", 0, 80)],
        state: { amount: 545, word: "budget", tone: "muted" },
      })
    )!;
    expect(sumOfLines(block.lines)).toBe(545);
    expect(block.totalLabel).toBe("This week's target");
  });

  it("uses the category's own title verbatim", () => {
    const block = weekTape(week({ categories: [category("Everyday", 299.32, 545)] }))!;
    expect(block.lines[1].label).toBe("Everyday");
  });

  it("does not open when the categories do not account for the week", () => {
    // A weekly row filed under no category is counted in the month but cannot
    // appear in this list, so the list would come up short. The figure stays
    // shut rather than under-reporting where the money went.
    const short = week({ categories: [category("Everyday", 100, 320)] });
    expect(weekTape(short)).toBeNull();
  });
});
