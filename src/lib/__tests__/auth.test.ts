/**
 * Security-critical primitives. These are the parts where a silent regression
 * is not a wrong number on a screen but an account someone else can open, so
 * they get tests that assert the failure modes, not just the happy path.
 */
import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  fakeVerifyPassword,
  generateSessionToken,
  hashSessionToken,
  sessionExpiryFrom,
  isSessionExpired,
  normalizeEmail,
  validateCredentials,
  SESSION_TTL_MS,
  UNUSABLE_PASSWORD_HASH,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from "../auth";

describe("password hashing · scrypt round-trip", () => {
  it("accepts the password it was given", async () => {
    const stored = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("correct horse battery staple", stored)).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    const stored = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("correct horse battery stapl", stored)).resolves.toBe(false);
    await expect(verifyPassword("", stored)).resolves.toBe(false);
    await expect(verifyPassword("CORRECT HORSE BATTERY STAPLE", stored)).resolves.toBe(false);
  });

  it("never stores the password in the hash", async () => {
    const stored = await hashPassword("hunter2-hunter2");
    expect(stored).not.toContain("hunter2");
  });

  it("salts per user — the same password hashes differently every time", async () => {
    const a = await hashPassword("the same password");
    const b = await hashPassword("the same password");
    expect(a).not.toEqual(b);
    // …and both still verify, so the salt is genuinely carried in the encoding.
    await expect(verifyPassword("the same password", a)).resolves.toBe(true);
    await expect(verifyPassword("the same password", b)).resolves.toBe(true);
  });

  it("records the cost parameters alongside the hash", async () => {
    const stored = await hashPassword("a password long enough");
    expect(stored.split("$").slice(0, 4)).toEqual(["scrypt", "16384", "8", "1"]);
  });

  it.each([
    ["empty", ""],
    ["the unusable sentinel", UNUSABLE_PASSWORD_HASH],
    ["a bcrypt hash", "$2b$12$abcdefghijklmnopqrstuv"],
    ["the right shape with junk fields", "scrypt$x$y$z$aaaa$bbbb"],
    ["too few fields", "scrypt$16384$8$1$onlysalt"],
    ["absurd cost parameters", `scrypt$99999999$8$1$aaaa$bbbb`],
    ["a plaintext password stored by mistake", "correct horse battery staple"],
  ])("returns false, and does not throw, for %s", async (_label, stored) => {
    await expect(verifyPassword("correct horse battery staple", stored)).resolves.toBe(false);
  });

  it("keeps a no-such-user path that costs the same as a real check", async () => {
    await expect(fakeVerifyPassword("anything")).resolves.toBe(false);
  });
});

describe("session tokens", () => {
  it("issues opaque, unguessable, unique tokens", () => {
    const tokens = new Set(Array.from({ length: 200 }, () => generateSessionToken()));
    expect(tokens.size).toBe(200);
    // 32 bytes → 43 base64url characters, no padding, url-safe.
    for (const t of tokens) {
      expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
    }
  });

  it("stores a hash, not the token — the DB value cannot be replayed as a cookie", () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(token);
    expect(hashSessionToken(token)).toBe(hash);
    expect(hashSessionToken(generateSessionToken())).not.toBe(hash);
  });
});

describe("session expiry", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");

  it("expires 30 days after issue", () => {
    expect(sessionExpiryFrom(now).toISOString()).toBe("2026-01-31T00:00:00.000Z");
    expect(SESSION_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("treats a fresh session as live", () => {
    expect(isSessionExpired(sessionExpiryFrom(now), now)).toBe(false);
  });

  it("treats a session one millisecond past its expiry as dead", () => {
    const expiresAt = sessionExpiryFrom(now);
    const later = new Date(expiresAt.getTime() + 1);
    expect(isSessionExpired(expiresAt, later)).toBe(true);
  });

  it("treats the exact expiry instant as dead, not alive", () => {
    const expiresAt = sessionExpiryFrom(now);
    expect(isSessionExpired(expiresAt, expiresAt)).toBe(true);
  });

  it("treats a session issued 31 days ago as dead", () => {
    const issued = new Date("2025-12-01T00:00:00.000Z");
    expect(isSessionExpired(sessionExpiryFrom(issued), now)).toBe(true);
  });
});

describe("credential validation", () => {
  it("lowercases and trims emails so uniqueness is case-insensitive", () => {
    expect(normalizeEmail("  Person@Example.COM ")).toBe("person@example.com");
  });

  it("accepts a plausible email and a long-enough password", () => {
    expect(validateCredentials("person@example.com", "x".repeat(MIN_PASSWORD_LENGTH))).toEqual([]);
  });

  it.each(["", "person", "person@", "@example.com", "person@example", "a b@example.com"])(
    "rejects %j as an email",
    (email) => {
      const problems = validateCredentials(email, "a long enough password");
      expect(problems.some((p) => p.field === "email")).toBe(true);
    }
  );

  it("rejects a short password", () => {
    const problems = validateCredentials("person@example.com", "x".repeat(MIN_PASSWORD_LENGTH - 1));
    expect(problems.some((p) => p.field === "password")).toBe(true);
  });

  it("rejects an unbounded password — scrypt cost is paid per attempt", () => {
    const problems = validateCredentials("person@example.com", "x".repeat(MAX_PASSWORD_LENGTH + 1));
    expect(problems.some((p) => p.field === "password")).toBe(true);
  });
});
