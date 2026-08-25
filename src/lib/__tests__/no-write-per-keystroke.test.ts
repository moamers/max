/**
 * A source scan, not a unit test — because this bug passes every unit test.
 *
 * A server action called from a controlled input's `onChange` typechecks,
 * lints, tests green and builds. It only fails against a real database, which
 * is exactly how it reached production: typing a three-digit target fired
 * three writes and nine route revalidations and took the page down.
 *
 * So the rule is enforced against the source itself: a component that both
 * takes continuous input and calls a server action must route the write
 * through `useDebouncedCommit`.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const ROOT = path.join(process.cwd(), "src");

/** Handlers that fire repeatedly while the user is still deciding. */
const CONTINUOUS_INPUT = /\bon(?:Change|Input|PointerMove|ValueChange|Drag)\s*=/;
/** A call to a server action, by this codebase's naming convention. */
const SERVER_ACTION_CALL = /\b[a-zA-Z][a-zA-Z0-9]*Action\s*\(/;
const DEBOUNCED = /useDebouncedCommit/;

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : walk(full);
    return entry.name.endsWith(".tsx") ? [full] : [];
  });
}

describe("no component writes on every keystroke", () => {
  const offenders = walk(ROOT)
    .filter((file) => !file.endsWith("actions.ts"))
    .map((file) => ({ file, src: fs.readFileSync(file, "utf8") }))
    .filter(({ src }) => CONTINUOUS_INPUT.test(src) && SERVER_ACTION_CALL.test(src))
    .filter(({ src }) => !DEBOUNCED.test(src))
    .map(({ file }) => path.relative(process.cwd(), file));

  it("routes every continuous-input write through useDebouncedCommit", () => {
    expect(
      offenders,
      offenders.length === 0
        ? ""
        : `These call a server action and take continuous input without debouncing:\n` +
          offenders.map((f) => `  - ${f}`).join("\n") +
          `\n\nUpdate local state on change for responsiveness, then hand the write to ` +
          `useDebouncedCommit(). See src/lib/commit-scheduler.ts.`
    ).toEqual([]);
  });

  it("actually sees the files it is meant to police", () => {
    // A scan that silently matches nothing is worse than no scan.
    const scanned = walk(ROOT).filter((f) => SERVER_ACTION_CALL.test(fs.readFileSync(f, "utf8")));
    expect(scanned.length).toBeGreaterThan(0);
  });
});
