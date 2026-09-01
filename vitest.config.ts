import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * The app imports through the `@/` alias that tsconfig declares. Vitest does its
 * own resolution and doesn't read tsconfig paths, so without this a module that
 * compiles cleanly still fails to load under test — which is how it surfaced:
 * every existing test used relative imports, so the gap stayed invisible until
 * a test imported a file that uses the alias internally.
 */
export default defineConfig({
  test: {
    /**
     * A subagent works in an isolated checkout under `.claude/worktrees/` — a
     * full copy of this repo, inside this repo. Vitest discovers by glob and
     * does not read .gitignore, so without this every gate run also runs the
     * agents' tests: 1099 became 3298, and a failure in another agent's
     * half-finished branch failed the suite here. Ignoring it in git is not
     * enough; it has to be excluded from discovery too.
     */
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**", ".claude/**", "mobile/**"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
