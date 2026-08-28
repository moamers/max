import type { UserId } from "@/lib/auth";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}
export interface UserRateLimiter {
  take(userId: UserId, now?: number): RateLimitResult;
}

export function createUserRateLimiter(maxRequests: number, windowMs: number): UserRateLimiter {
  if (!Number.isInteger(maxRequests) || maxRequests < 1) throw new Error("maxRequests must be positive");
  if (!Number.isFinite(windowMs) || windowMs < 1) throw new Error("windowMs must be positive");
  const windows = new Map<UserId, { count: number; resetsAt: number }>();

  return {
    take(userId, now = Date.now()) {
      let current = windows.get(userId);
      if (!current || current.resetsAt <= now) {
        current = { count: 0, resetsAt: now + windowMs };
        windows.set(userId, current);
      }
      if (current.count >= maxRequests) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((current.resetsAt - now) / 1000)),
        };
      }
      current.count += 1;
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}
