import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.join(process.cwd(), "src");
const read = (...p: string[]) => fs.readFileSync(path.join(ROOT, ...p), "utf8");

/**
 * #46. An account with no periods used to 404 on /add, /week and — if a
 * bookmark carried a stale ?period= — /recurring and /one-offs too. A brand
 * new account hitting "404" reads as an app that is broken rather than empty.
 *
 * Every period-backed screen now shows the same empty state, which offers both
 * ways in: import a file, or start a month now.
 */
const PERIOD_BACKED = [
  ["add", "page.tsx"],
  ["week", "[weekNumber]", "page.tsx"],
  ["recurring", "page.tsx"],
  ["one-offs", "page.tsx"],
] as const;

describe("an account with no periods", () => {
  it.each(PERIOD_BACKED.map((p) => [path.join(...p), p] as const))(
    "%s shows the empty state instead of 404",
    (_label, parts) => {
      const src = read("app", ...parts);
      expect(src).toContain("if (periodId === null) return <EmptyState />;");
    }
  );

  it.each(PERIOD_BACKED.map((p) => [path.join(...p), p] as const))(
    "%s does not gate the empty state on the ?period= param",
    (_label, parts) => {
      // The old guard 404'd an empty account whenever a stale ?period= was
      // present. resolvePeriodId falls back to the current period for an
      // unrecognised id, so null means "no periods", never "bad id".
      const src = read("app", ...parts);
      expect(src).not.toContain("periodParamValue(sp)");
    }
  );

  it("offers both a file import and starting a month", () => {
    const empty = read("components", "EmptyState.tsx");
    expect(empty).toContain('href="/import"');
    expect(empty).toContain("<StartFirstPeriod");
  });
});

/**
 * The write must happen on the press and nowhere else. A screen that creates a
 * period because someone opened it leaves the user with months they never
 * asked for — and /add is reachable from a FAB on every screen.
 */
describe("starting the first period", () => {
  it("writes only from the button", () => {
    const button = read("components", "StartFirstPeriod.tsx");
    expect(button).toContain("onClick");
    expect(button).toContain("startFirstPeriod()");

    // No page may call it during render.
    for (const parts of PERIOD_BACKED) {
      expect(read("app", ...parts)).not.toContain("startFirstPeriod");
    }
    expect(read("components", "EmptyState.tsx")).not.toContain("startFirstPeriod");
  });

  it("does not take the start date from the client", () => {
    // The button says "do the thing you offered"; a start date accepted over
    // the wire is a start date anyone can choose.
    const actions = read("app", "rollover-actions.ts");
    const signature = actions.slice(actions.indexOf("export async function startFirstPeriod"));
    expect(signature.slice(0, 80)).toContain("startFirstPeriod(): Promise<StartedPeriod>");
    expect(signature).toContain("proposeFirstPeriod()");
  });

  it("validates the period shape server-side before writing", () => {
    const actions = read("app", "rollover-actions.ts");
    const guardAt = actions.indexOf("isWholeMondayToSundayPeriod");
    const writeAt = actions.indexOf("createPeriod(");
    expect(guardAt).toBeGreaterThan(-1);
    expect(writeAt).toBeGreaterThan(guardAt);
  });
});
