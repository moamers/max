import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { NO_WEEKLY_TARGETS_PROMPT } from "../format";
import { isToneCompliant } from "@/lib/tone";

/**
 * A month with no weekly targets used to render as muted figures over empty
 * bars with nothing saying why — indistinguishable from a screen that had
 * failed to load. These guard the prompt that tells the two apart.
 *
 * Source-scanned rather than rendered: there is no React test renderer in this
 * project, and the thing worth protecting is the *wiring* (the condition, the
 * destination, and that the link is not nested inside the toggle), all of
 * which are visible in the source.
 */
const MONTH_SECTIONS = readFileSync(join(process.cwd(), "src/components/home/MonthSections.tsx"), "utf8");

describe("the no-weekly-targets prompt", () => {
  it("passes the tone gate", () => {
    expect(isToneCompliant(NO_WEEKLY_TARGETS_PROMPT)).toBe(true);
  });

  it("states what to do rather than what is missing", () => {
    // Not a hard rule so much as the house voice: the sentence should tell the
    // user the action and the payoff, the way the income prompt does.
    expect(NO_WEEKLY_TARGETS_PROMPT).toMatch(/^Set weekly targets and/);
    expect(NO_WEEKLY_TARGETS_PROMPT).toMatch(/\.$/);
  });

  it("shows only when the month has no weekly budget at all", () => {
    expect(MONTH_SECTIONS).toContain("budget === null && (");
  });

  it("renders the shared copy rather than a second copy of the sentence", () => {
    expect(MONTH_SECTIONS).toContain("{NO_WEEKLY_TARGETS_PROMPT}");
    // The literal must not be re-typed into the JSX, or the tone gate above
    // stops testing what the user actually reads.
    expect(MONTH_SECTIONS).not.toContain(NO_WEEKLY_TARGETS_PROMPT);
  });

  it("links to /goals", () => {
    const prompt = MONTH_SECTIONS.slice(MONTH_SECTIONS.indexOf("budget === null && ("));
    expect(prompt.slice(0, 400)).toContain('href="/goals"');
  });

  it("keeps the prompt out of any other tappable thing", () => {
    // Originally this guarded against the link sitting inside the weeks
    // accordion's role="button" header, where one tap fired both the toggle
    // and the navigation. The accordion is gone, but the rule outlives it: a
    // link nested in another interactive element is an accessibility error
    // whatever the outer element happens to be. So: the prompt's link must
    // open and close before any week link opens, making them siblings.
    const promptOpen = MONTH_SECTIONS.indexOf('href="/goals"');
    const promptClose = MONTH_SECTIONS.indexOf("</Link>", promptOpen);
    const weekLink = MONTH_SECTIONS.indexOf("`/week/${week.weekNumber}?period=${periodId}`");
    expect(promptOpen).toBeGreaterThan(-1);
    expect(promptClose).toBeGreaterThan(-1);
    expect(weekLink).toBeGreaterThan(-1);
    expect(promptClose).toBeLessThan(weekLink);
    expect(MONTH_SECTIONS).not.toContain('role="button"');
  });
});
