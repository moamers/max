-- 0005 · goals, per-month income, and a default to fall back to
--
-- Apply fifth, after 0004.
--
-- Delivery plan §2. Three new pieces of state, all additive — no existing table
-- loses a column and no row is rewritten, so this migration cannot change a
-- figure that is already on a screen.
--
-- Safe to run once, and a second run is a no-op.

BEGIN;

-- ------------------------------------------------------ users · the fallback
--
-- The number a month falls back to when the user has not set one for it. NULL
-- means "not told us yet", which the query layer must render as unknown rather
-- than as zero: a forecast against an assumed income of £0 is a confident lie.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "default_monthly_income" numeric(12, 2);

-- --------------------------------------------------------------------- goals
--
-- Per-category weekly targets. Three rows per user in V1 — one for each weekly
-- category — which is why the CHECK admits only those: a "weekly amount" for a
-- recurring group (rent, nursery) is not a target, it is just the bill.
CREATE TABLE IF NOT EXISTS "goals" (
  "id"            integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_id"       uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "category"      text NOT NULL,
  "weekly_amount" numeric(12, 2) NOT NULL,
  "created_at"    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "goals_category_weekly" CHECK ("category" IN ('everyday', 'weekend', 'transport')),
  -- A target is a number the user is trying to stay under; a negative one is a
  -- data-entry slip, not an intention.
  CONSTRAINT "goals_weekly_amount_non_negative" CHECK ("weekly_amount" >= 0)
);

-- One target per category per user. The unique index is also what makes the
-- store's upsert (`ON CONFLICT (user_id, category)`) a single statement.
CREATE UNIQUE INDEX IF NOT EXISTS "goals_user_category_unique" ON "goals" ("user_id", "category");

-- ------------------------------------------------------------- income_months
--
-- What actually came in for one month. "Month" here is the founder's pay period
-- (30 Jun – 3 Aug), so the key is `period_id` rather than year+month — the
-- delivery plan allows either, and this way there is no second, disagreeing
-- notion of which month a row belongs to.
--
-- `user_id` is carried as well as reachable through `periods`, so an income row
-- can be scoped without a join and the ownership predicate is never optional.
-- The two must agree; the trigger below is what holds them to it.
--
-- `set_by_user` distinguishes a figure the user typed from one Max derived from
-- an import. Only the former should survive a re-import, and neither should be
-- presented as the other (B-8).
CREATE TABLE IF NOT EXISTS "income_months" (
  "id"          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_id"     uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "period_id"   integer NOT NULL REFERENCES "periods"("id") ON DELETE CASCADE,
  "amount"      numeric(12, 2) NOT NULL,
  "set_by_user" boolean NOT NULL DEFAULT true,
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  "updated_at"  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "income_months_user_period_unique"
  ON "income_months" ("user_id", "period_id");
CREATE INDEX IF NOT EXISTS "idx_income_months_user" ON "income_months" ("user_id");

-- A foreign key cannot express "this row's user must be the period's user", and
-- a CHECK cannot read another table. Without this, a mis-scoped insert would
-- attach one user's income to another user's month and no constraint would
-- notice. The store never writes such a row; this makes it impossible rather
-- than merely unlikely.
CREATE OR REPLACE FUNCTION "income_months_owner_matches_period"() RETURNS trigger AS $$
DECLARE period_owner uuid;
BEGIN
  SELECT "user_id" INTO period_owner FROM "periods" WHERE "id" = NEW."period_id";
  IF period_owner IS DISTINCT FROM NEW."user_id" THEN
    RAISE EXCEPTION 'income_months.user_id % does not own period %', NEW."user_id", NEW."period_id";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "income_months_owner_check" ON "income_months";
CREATE TRIGGER "income_months_owner_check"
  BEFORE INSERT OR UPDATE ON "income_months"
  FOR EACH ROW EXECUTE FUNCTION "income_months_owner_matches_period"();

COMMIT;
