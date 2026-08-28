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
const WEEKS_CARD = readFileSync(join(process.cwd(), "src/components/home/WeeksCard.tsx"), "utf8");

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
    expect(WEEKS_CARD).toContain("summary.budget === null && (");
  });

  it("renders the shared copy rather than a second copy of the sentence", () => {
    expect(WEEKS_CARD).toContain("{NO_WEEKLY_TARGETS_PROMPT}");
    // The literal must not be re-typed into the JSX, or the tone gate above
    // stops testing what the user actually reads.
    expect(WEEKS_CARD).not.toContain(NO_WEEKLY_TARGETS_PROMPT);
  });

  it("links to /goals", () => {
    const prompt = WEEKS_CARD.slice(WEEKS_CARD.indexOf("summary.budget === null && ("));
    expect(prompt.slice(0, 400)).toContain('href="/goals"');
  });

  it("keeps the link out of the toggle header", () => {
    // A link inside the role="button" header fires the accordion and the
    // navigation on one tap. The prompt must sit after the header closes.
    const header = WEEKS_CARD.indexOf('role="button"');
    const toggleEnd = WEEKS_CARD.indexOf("</div>\n\n      {", header);
    const promptAt = WEEKS_CARD.indexOf("summary.budget === null && (");
    expect(header).toBeGreaterThan(-1);
    expect(toggleEnd).toBeGreaterThan(-1);
    expect(promptAt).toBeGreaterThan(toggleEnd);
  });
});
