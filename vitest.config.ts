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
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
