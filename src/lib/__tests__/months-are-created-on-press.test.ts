/**
 * A month exists because somebody pressed a button.
 *
 * "When you open a new month they need to be replicated" is the natural way to
 * say it, and the literal reading — write on page load — is the failure this
 * project has already had: a burst of writes and revalidations took production
 * down once, and #46 held the same line for /add. Now that a month which does
 * not exist yet is a screen you can open, the line is easier to cross by
 * accident, so it is a test rather than a note.
 *
 * A source scan, because this bug passes every unit test.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const APP = path.join(process.cwd(), "src", "app");
const read = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), "src", ...parts), "utf8");

/** Anything that creates a period or copies rows into one. */
const WRITES = ["createPeriod(", "acceptRollover(", "startFirstPeriod(", "copyRecurringFromLastMonth(", "copyRecurringAction("];

function pages(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : pages(full);
    return entry.name === "page.tsx" ? [full] : [];
  });
}

describe("no screen creates a month by being looked at", () => {
  const found = pages(APP);

  it("finds the pages it is meant to police", () => {
    // A scan that silently matches nothing is worse than no scan.
    expect(found.length).toBeGreaterThan(5);
    expect(found.map((file) => path.relative(APP, file))).toContain(path.join("start-month", "page.tsx"));
  });

  it.each(pages(APP).map((file) => [path.relative(APP, file), file] as const))(
    "%s renders without writing",
    (_label, file) => {
      const src = fs.readFileSync(file, "utf8");
      for (const write of WRITES) expect(src).not.toContain(write);
    }
  );

  it("offers the not-yet-created month without creating it", () => {
    const page = read("app", "start-month", "page.tsx");
    // Reads only: which periods exist, and whether anything could be copied.
    expect(page).toContain("listPeriodsMeta");
    expect(page).toContain("proposePeriodForMonth");
    // The write lives behind the prompt's own button.
    expect(page).toContain("<RolloverPrompt");
  });

  it("links an empty month tile at the screen, not at a write", () => {
    const sheet = read("components", "home", "ChangeMonthSheet.tsx");
    expect(sheet).toContain("/start-month?month=");
    for (const write of WRITES) expect(sheet).not.toContain(write);
  });
});

describe("the copy-recurring offer", () => {
  it("is checked by default, because filing something as recurring already said it repeats", () => {
    const prompt = read("components", "home", "RolloverPrompt.tsx");
    expect(prompt).toContain("useState(true)");
    expect(prompt).toContain("acceptRollover(proposal.startDate, endDate,");
  });

  it("is hidden when there is nothing to copy", () => {
    const prompt = read("components", "home", "RolloverPrompt.tsx");
    expect(prompt).toContain("proposal.canCopyRecurring &&");
  });

  it("copies from an empty recurring screen only on a press", () => {
    const view = read("components", "money", "RecurringView.tsx");
    const at = view.indexOf("copyRecurringAction(periodId)");
    expect(at).toBeGreaterThan(-1);
    // The nearest handler above the call is a click, not a change or a render.
    const before = view.slice(0, at);
    expect(before.lastIndexOf("onClick")).toBeGreaterThan(before.lastIndexOf("onChange"));
  });
});

describe("months in the past", () => {
  it("are refused server-side, before anything is written", () => {
    const actions = read("app", "rollover-actions.ts");
    const guardAt = actions.indexOf("periodHasEnded(endDate)");
    const writeAt = actions.indexOf("createPeriod(");
    expect(guardAt).toBeGreaterThan(-1);
    expect(writeAt).toBeGreaterThan(guardAt);
  });

  it("are not offered a create control at all", () => {
    const page = read("app", "start-month", "page.tsx");
    expect(page).toContain("periodHasEnded(proposal.endDate, today)");
  });
});
