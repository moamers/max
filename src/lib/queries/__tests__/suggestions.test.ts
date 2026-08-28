import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";

const hoisted = vi.hoisted(() => ({
  queries: [] as Array<{ sql: string; params: unknown[] }>,
  currentUser: {
    id: "22222222-2222-4222-8222-222222222222",
    email: "person@example.com",
  } as { id: string; email: string } | null,
}));

vi.mock("@/lib/db", async () => {
  const { drizzle } = await import("drizzle-orm/pg-proxy");
  const db = drizzle(async (sql: string, params: unknown[]) => {
    hoisted.queries.push({ sql, params });
    return { rows: [] };
  });
  return { getDb: () => db };
});

vi.mock("@/lib/session", () => ({
  getSessionUser: async () => hoisted.currentUser,
}));

const { loadSuggestionHistoryAction } = await import("../suggestions");

beforeEach(() => {
  hoisted.queries.length = 0;
  hoisted.currentUser = { id: USER_B, email: "person@example.com" };
});

describe("suggestion history isolation", () => {
  it("derives identity from the session and scopes both reads to that user", async () => {
    await expect(loadSuggestionHistoryAction()).resolves.toEqual({ merchants: [], labels: [] });

    expect(hoisted.queries).toHaveLength(2);
    for (const query of hoisted.queries) {
      expect(query.sql).toMatch(/join\s+"periods"/i);
      expect(query.sql).toMatch(/"periods"\."user_id"\s*=\s*\$\d+/i);
      expect(query.params).toContain(USER_B);
      expect(query.params).not.toContain(USER_A);
    }
  });

  it("does not query at all without an authenticated user", async () => {
    hoisted.currentUser = null;
    await expect(loadSuggestionHistoryAction()).rejects.toThrow("Not signed in");
    expect(hoisted.queries).toEqual([]);
  });
});
