-- 0001 · users and sessions
--
-- Apply first. Creates the auth tables only; no existing table is touched, so
-- this migration is safe to run against the live database on its own.
--
-- gen_random_uuid() is built into PostgreSQL 13+ (Supabase is well past that),
-- so no extension is required.

CREATE TABLE IF NOT EXISTS "users" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"         text NOT NULL,
  "password_hash" text NOT NULL,
  "created_at"    timestamptz NOT NULL DEFAULT now(),
  -- Uniqueness must be case-insensitive. The application lowercases via
  -- normalizeEmail(); this holds the database to the same invariant instead of
  -- trusting every future caller to remember, and avoids needing citext.
  CONSTRAINT "users_email_lowercase" CHECK ("email" = lower("email"))
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'users'::regclass AND conname = 'users_email_unique'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE ("email");
  END IF;
END $$;

-- Server-side sessions. Only the SHA-256 hash of the cookie token is stored, so
-- a dump of this table yields no usable cookies, and logout is a real DELETE
-- rather than a hint to the browser.
CREATE TABLE IF NOT EXISTS "sessions" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "token_hash" text NOT NULL,
  "user_id"    uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'sessions'::regclass AND conname = 'sessions_token_hash_unique'
  ) THEN
    ALTER TABLE "sessions" ADD CONSTRAINT "sessions_token_hash_unique" UNIQUE ("token_hash");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_sessions_user" ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_sessions_expires_at" ON "sessions" ("expires_at");
