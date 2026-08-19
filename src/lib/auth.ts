/**
 * Password hashing, credential validation and the user-identity types the rest
 * of the app scopes on.
 *
 * Everything in this file is pure Node — no `next/*` imports, no request
 * context, no database. That is deliberate: it keeps the security-critical
 * primitives unit-testable without a server or a DB (T-11: the deterministic
 * computation exists before anything renders; T-12: a doctrine nobody can
 * verify is a doctrine nobody follows).
 *
 * Hashing uses Node's built-in `crypto.scrypt`. No new dependency: a password
 * hash is exactly the kind of thing that must not rest on a supply chain we
 * don't control.
 */
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number }
) => Promise<Buffer>;

// ------------------------------------------------------------------ identity

declare const userIdBrand: unique symbol;

/**
 * A user's primary key, branded so it cannot be confused with any other string
 * (a period label, an email, a session token). Store functions take a `UserId`
 * and nothing else will type-check — the scoping requirement is carried by the
 * type system rather than by reviewer vigilance (T-3's principle applied to
 * ownership rather than provenance).
 */
export type UserId = string & { readonly [userIdBrand]: "UserId" };

/** Narrow a raw DB/uuid string to a `UserId`. The only sanctioned entry point. */
export function toUserId(id: string): UserId {
  return id as UserId;
}

export interface SessionUser {
  id: UserId;
  email: string;
}

// ------------------------------------------------------------------ scrypt

/**
 * N=16384, r=8, p=1 → ~16MB and ~50-100ms per hash on typical server hardware.
 * `maxmem` is raised above Node's 32MB default so the parameters can be lifted
 * later without the call silently failing.
 */
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;
const SCRYPT_MAXMEM = 64 * 1024 * 1024;
const SALT_BYTES = 16;

/** Marks a row that exists but can never be logged into (e.g. the bootstrap owner of pre-auth data). */
export const UNUSABLE_PASSWORD_HASH = "!";

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

/**
 * Encoded as `scrypt$N$r$p$salt$hash` so the parameters travel with the hash and
 * can be raised later without invalidating existing passwords.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = await scrypt(password.normalize("NFKC"), salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${b64url(salt)}$${b64url(derived)}`;
}

/**
 * Constant-time verification. Returns false — never throws — for malformed,
 * empty or sentinel hashes, so a corrupt row can't become an auth bypass.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  if (N < 1024 || N > 1 << 20 || r < 1 || r > 32 || p < 1 || p > 16) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[4], "base64url");
    expected = Buffer.from(parts[5], "base64url");
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) return false;

  let derived: Buffer;
  try {
    derived = await scrypt(password.normalize("NFKC"), salt, expected.length, {
      N,
      r,
      p,
      maxmem: SCRYPT_MAXMEM,
    });
  } catch {
    return false;
  }

  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

/**
 * Burn roughly the same CPU as a real verification when no user matched, so the
 * response time doesn't tell an attacker which emails exist.
 */
export async function fakeVerifyPassword(password: string): Promise<false> {
  await scrypt(password.normalize("NFKC"), "max-timing-equaliser", SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  });
  return false;
}

// ------------------------------------------------------------ session tokens

/**
 * Cookie name. Declared here rather than in `session.ts` so `proxy.ts` can read
 * it without importing the database driver into the proxy bundle.
 */
export const SESSION_COOKIE = "max_session";

export const SESSION_TOKEN_BYTES = 32;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** 256 bits of CSPRNG output. Opaque: it carries no user data (nothing to forge, nothing to leak). */
export function generateSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

/**
 * Only the hash is persisted. A dump of the `sessions` table is then not a set
 * of usable cookies. SHA-256 is right here (unlike for passwords) because the
 * input is already 256 bits of entropy — there is nothing to brute-force.
 */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function sessionExpiryFrom(now: Date = new Date()): Date {
  return new Date(now.getTime() + SESSION_TTL_MS);
}

export function isSessionExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}

// -------------------------------------------------------------- credentials

/** Emails are stored lowercased; a DB CHECK constraint enforces the same invariant. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const MIN_PASSWORD_LENGTH = 10;
/** scrypt cost is paid per attempt — an unbounded password is a free DoS. */
export const MAX_PASSWORD_LENGTH = 256;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export interface CredentialProblem {
  field: "email" | "password";
  message: string;
}

/** Deliberately plain rules. Composition requirements push people to `Passw0rd!`. */
export function validateCredentials(email: string, password: string): CredentialProblem[] {
  const problems: CredentialProblem[] = [];

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    problems.push({ field: "email", message: "That doesn't look like an email address." });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    problems.push({
      field: "password",
      message: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
    });
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    problems.push({
      field: "password",
      message: `Keep it under ${MAX_PASSWORD_LENGTH} characters.`,
    });
  }

  return problems;
}
