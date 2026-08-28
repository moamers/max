import { describe, expect, it } from "vitest";
import { createUserRateLimiter } from "../rate-limit";
import type { UserId } from "@/lib/auth";

const USER_A = "11111111-1111-4111-8111-111111111111" as UserId;
const USER_B = "22222222-2222-4222-8222-222222222222" as UserId;

describe("per-user LLM throttling", () => {
  it("allows the configured calls, then supplies a retry time", () => {
    const limiter = createUserRateLimiter(2, 60_000);
    expect(limiter.take(USER_A, 1000).allowed).toBe(true);
    expect(limiter.take(USER_A, 1000).allowed).toBe(true);
    expect(limiter.take(USER_A, 1000)).toEqual({ allowed: false, retryAfterSeconds: 60 });
  });

  it("keeps users separate and opens a fresh window after expiry", () => {
    const limiter = createUserRateLimiter(1, 1000);
    expect(limiter.take(USER_A, 0).allowed).toBe(true);
    expect(limiter.take(USER_A, 999).allowed).toBe(false);
    expect(limiter.take(USER_B, 999).allowed).toBe(true);
    expect(limiter.take(USER_A, 1000).allowed).toBe(true);
  });
});
