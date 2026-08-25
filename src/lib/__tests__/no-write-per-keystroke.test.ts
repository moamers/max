/**
 * A source scan, not a unit test — because this bug passes every unit test.
 *
 * Calling a server action from a controlled input's `onChange` typechecks,
 * lints, tests green and builds. It only fails against a real database, which
 * is how it reached production twice: first as a write per keystroke, then as
 * a debounced write that still fired while the user was mid-edit.
 *
 * The rule this enforces: a change handler updates local state and nothing
 * else. Writing belongs to an explicit action — a Done or Save button.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const ROOT = path.join(process.cwd(), "src");
const SERVER_ACTION_CALL = /\b[a-zA-Z][a-zA-Z0-9]*Action\s*\(/;

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : walk(full);
    return entry.name.endsWith(".tsx") ? [full] : [];
  });
}

/** Handler names wired to a continuous-input prop, plus any inline bodies. */
function continuousHandlers(src: string): { names: string[]; inline: string[] } {
  const names: string[] = [];
  const inline: string[] = [];
  const prop = /\bon(?:Change|Input|PointerMove|ValueChange|Drag)\s*=\s*\{([^}]*)\}/g;
  for (const match of src.matchAll(prop)) {
    const body = match[1].trim();
    const arrowToCall = body.match(/^\(?[^)]*\)?\s*=>\s*([A-Za-z_$][\w$]*)\s*\(/);
    if (arrowToCall) names.push(arrowToCall[1]);
    else if (/^[A-Za-z_$][\w$]*$/.test(body)) names.push(body);
    else inline.push(body);
  }
  return { names, inline };
}

/** The body of `function name(...) { ... }`, by brace matching. */
function functionBody(src: string, name: string): string | null {
  const start = src.search(new RegExp(`function\\s+${name}\\s*\\(`));
  if (start === -1) return null;
  const open = src.indexOf("{", start);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === "{") depth += 1;
    else if (src[i] === "}") {
      depth -= 1;
      if (depth === 0) return src.slice(open, i + 1);
    }
  }
  return null;
}

describe("no component writes to the database while the user is typing", () => {
  const offenders: string[] = [];

  for (const file of walk(ROOT)) {
    const src = fs.readFileSync(file, "utf8");
    if (!SERVER_ACTION_CALL.test(src)) continue;

    const { names, inline } = continuousHandlers(src);
    const guilty = [
      ...inline.filter((body) => SERVER_ACTION_CALL.test(body)),
      ...names.filter((name) => {
        const body = functionBody(src, name);
        return body !== null && SERVER_ACTION_CALL.test(body);
      }),
    ];
    if (guilty.length > 0) offenders.push(`${path.relative(process.cwd(), file)} (via ${guilty.join(", ")})`);
  }

  it("keeps change handlers to local state only", () => {
    expect(
      offenders,
      offenders.length === 0
        ? ""
        : "These call a server action from a continuous-input handler:\n" +
          offenders.map((o) => `  - ${o}`).join("\n") +
          "\n\nA change handler updates local state and nothing else. Write on an " +
          "explicit Done or Save, so the user decides when it is committed."
    ).toEqual([]);
  });

  it("actually parses the files it is meant to police", () => {
    // A scan that silently matches nothing is worse than no scan, so prove the
    // machinery finds a real handler in a real file.
    const goals = fs.readFileSync(path.join(ROOT, "components/goals/GoalsView.tsx"), "utf8");
    expect(continuousHandlers(goals).names).toContain("changeGoal");
    expect(functionBody(goals, "changeGoal")).toContain("setGoals");
  });
});
