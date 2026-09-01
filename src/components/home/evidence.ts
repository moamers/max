/**
 * The working behind the two figures on Home that a user cannot otherwise
 * check: the hero, and each week.
 *
 * Pure, and separate from the components, because "does this add up" is the
 * only question that matters about a tape and it should be answerable without
 * rendering anything. `openableTape` is applied at the end of every builder
 * here: a block whose lines do not reach the figure is returned as null and
 * the figure does not open (D-5 — see `src/components/ui/tape-grammar.ts`).
 *
 * Nothing in here does arithmetic the app has not already done. Every line is
 * a figure the query layer produced, re-signed; the totals are the same
 * `spare` / `state.amount` the screen was already stating. If a builder ever
 * has to *compute* the figure to make the tape balance, the tape is wrong.
 */
import { openableTape, type TapeBlock } from "@/components/ui/tape-grammar";
import type { HeroView, WeekView } from "./types";

/**
 * The hero, in Today mode: income, minus each of the three kinds of spending,
 * is what is spare right now.
 *
 * `hero.today.spend` is the sum of the three kinds (see `monthOverview`), and
 * `hero.today.spare` is income minus that sum — so listing the three kinds and
 * the income reaches the figure exactly.
 */
export function heroTodayTape(hero: HeroView): TapeBlock | null {
  const spare = hero.today.spare;
  const spent = hero.spentByKind;
  if (spare === null || hero.income === null || !spent) return null;
  return openableTape({
    lines: [
      { label: "Income", amount: hero.income },
      { label: "Weeks", amount: -spent.weekly },
      { label: "Recurring", amount: -spent.recurring },
      { label: "One-offs", amount: -spent.oneOff },
    ],
    total: spare,
    totalLabel: "Spare today",
  });
}

/**
 * The hero, in End-of-month mode: income, minus what has gone already, minus
 * the weekly budget that has not been spent yet.
 *
 * This is the founder's own formula from his spreadsheet, stated as a list —
 * `forecast = spent so far + whatever weekly allowance is still unspent`, and
 * the hero is income minus that. The second line is the one worth showing: it
 * is the only place the screen says out loud that the forecast is assuming the
 * rest of the weekly budget gets spent.
 */
export function heroForecastTape(hero: HeroView): TapeBlock | null {
  const spare = hero.forecast.spare;
  const detail = hero.forecastDetail;
  if (spare === null || hero.income === null || !detail) return null;
  return openableTape({
    lines: [
      { label: "Income", amount: hero.income },
      { label: "Out so far", amount: -hero.today.spend },
      { label: "Weekly budget still to come", amount: -detail.weeklyRemaining },
    ],
    total: spare,
    // Named for what it is rather than for the mode, so the closing line is
    // still readable with the eyebrow scrolled off.
    totalLabel: "Spare at the end",
  });
}

/**
 * A week's headline figure, opened into the categories it is made of.
 *
 * A week's `spent` is by construction the sum of its three category spends and
 * its `goal` the sum of the category targets that exist (`weeklyBreakdown`),
 * so each of the four words the week can be stated in has an exact list
 * behind it:
 *
 *   left    target, minus each category            = what is left
 *   over    each category, minus the target        = the amount past it
 *   spent   each category                          = the total
 *   budget  each category's target                 = the week's target
 *
 * Category titles are the app's own words for the three weekly categories and
 * are passed through verbatim (AGENTS.md 3).
 */
export function weekTape(week: WeekView): TapeBlock | null {
  const spends = week.categories.map((c) => ({ label: c.title, amount: c.spent }));
  const targets = week.categories
    .filter((c) => c.goal !== null)
    .map((c) => ({ label: c.title, amount: c.goal as number }));

  if (week.state.word === "budget") {
    return openableTape({ lines: targets, total: week.state.amount, totalLabel: "This week's target" });
  }
  if (week.state.word === "spent") {
    return openableTape({ lines: spends, total: week.state.amount, totalLabel: "Spent this week" });
  }
  if (week.goal === null) return null;
  if (week.state.word === "left") {
    return openableTape({
      lines: [
        { label: "Your target", amount: week.goal },
        ...spends.map((line) => ({ label: line.label, amount: -line.amount })),
      ],
      total: week.state.amount,
      totalLabel: "Left this week",
    });
  }
  return openableTape({
    lines: [...spends, { label: "Your target", amount: -week.goal }],
    total: week.state.amount,
    totalLabel: "Past your target",
  });
}
