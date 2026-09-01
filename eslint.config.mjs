import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // A subagent works in an isolated checkout under `.claude/worktrees/` — a
    // full copy of this repo, inside this repo. ESLint discovers by glob and
    // does not read .gitignore, so without this a gate run also lints the
    // agents' in-progress branches and fails on their half-finished code.
    // Same reason vitest.config.ts excludes it from test discovery.
    ".claude/**",
    // Separate workspaces with their own lint setup — not web/Next.js code.
    "mobile/**",
    "packages/**",
    // Vendored design prototypes. `support.js` is the prototype's own rendering
    // runtime, kept only so the .dc.html files open locally — the handoff says
    // outright it is "not part of the design". It is a reference artefact, not
    // our source, so it is read but never edited and never linted.
    "docs/design/handoff/**",
  ]),
]);

export default eslintConfig;
