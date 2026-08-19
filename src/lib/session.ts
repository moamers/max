/**
 * Request-bound session handling: the cookie, the `sessions` row, and the
 * lookup that turns one into a `SessionUser`.
 *
 * Split from `auth.ts` on purpose — everything here needs `next/headers` and a
 * database, so it can only run inside a request. The primitives it composes are
 * pure and tested separately.
 *
 * Importing `next/headers` also makes this module un-importable from a Client
 * Component, which is the guard we want: session state must never cross to the
 * browser bundle.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "./db";
import { sessions, users } from "./schema";
import {
  generateSessionToken,
  hashSessionToken,
  sessionExpiryFrom,
  SESSION_COOKIE,
  toUserId,
  type SessionUser,
  type UserId,
} from "./auth";

export { SESSION_COOKIE };

/**
 * `secure` is on in production only — a hard `true` would make the cookie
 * silently un-settable over plain-http localhost and produce a login loop in
 * dev that looks like a logic bug. Everything else is unconditional.
 */
function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

/**
 * Issues a session: random opaque token to the browser, its SHA-256 hash to the
 * database. The cookie contains no user data — nothing to decode, nothing to
 * tamper with, and revocation is a single DELETE.
 */
export async function createSession(userId: UserId): Promise<void> {
  const token = generateSessionToken();
  const expiresAt = sessionExpiryFrom();

  const db = getDb();
  await db.insert(sessions).values({
    tokenHash: hashSessionToken(token),
    userId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, cookieOptions(expiresAt));
}

/**
 * The authoritative check. Expiry is enforced in the SQL predicate rather than
 * in JS, so a row that has aged out cannot be resurrected by a clock read that
 * happens after the fetch.
 *
 * Returns null rather than throwing: callers decide between a redirect (pages)
 * and a 401 (API).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = getDb();
  const [row] = await db
    .select({ id: users.id, email: users.email })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(eq(sessions.tokenHash, hashSessionToken(token)), gt(sessions.expiresAt, new Date()))
    )
    .limit(1);

  if (!row) return null;
  return { id: toUserId(row.id), email: row.email };
}

/** For Server Components and pages: no valid session means you're at /login. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Logout. R-19/R-10 in spirit: signing out is server-side revocation, not just
 * dropping the cookie — the token is dead everywhere, immediately, and there is
 * no obstruction to leaving.
 */
export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token)));
  }

  cookieStore.delete(SESSION_COOKIE);
}

/** Revoke every session for a user (password change, "sign out everywhere", account deletion). */
export async function destroyAllSessionsForUser(userId: UserId): Promise<void> {
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
