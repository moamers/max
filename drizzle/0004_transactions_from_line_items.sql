-- 0004 · line_items becomes transactions
--
-- Apply fourth, after 0001–0003.
--
-- Delivery plan §2. The table is renamed and widened in place; not one row is
-- deleted, re-inserted or re-parsed. That is deliberate: the only real data in
-- this database is the founder's own pay period, and it has already been
-- mis-read twice (F-1, F-3). A migration that rebuilt the rows would be a third
-- chance to get them wrong. Renaming columns and deriving two new ones from a
-- fixed lookup table cannot change an amount.
--
-- The kind/category derivation is a transcription of `SECTION_MAPPING` in
-- `src/lib/transactions.ts`, which is pinned by `__tests__/transactions.test.ts`:
--
--   grocery   -> weekly    / everyday
--   weekend   -> weekly    / weekend
--   transport -> weekly    / transport
--   bills     -> recurring / bills        (flat, on purpose — see below)
--   extras    -> one_off   / NULL
--
-- `bills` maps to recurring/bills for every row. Splitting the founder's flat
-- bills list into Housing / Childcare / Bills / Subscriptions by reading
-- merchant names is a judgement, and a judgement made silently inside a
-- migration is exactly the shape of F-3. The user re-files from the transaction
-- editor; this file does not guess.
--
-- Safe to run once, and a second run is a no-op: every step is guarded on the
-- state it would create. Everything runs in one transaction, so a failure
-- anywhere leaves the old table exactly as it was.

BEGIN;

-- ------------------------------------------------------------------ 1 · gate
--
-- Refuse to touch the data if any row carries a section the mapping does not
-- cover. Mapping an unrecognised section to *something* would be a guess about
-- real money; raising here aborts the transaction and leaves `line_items`
-- untouched, so the failure is loud, recoverable, and costs nothing.
DO $$
DECLARE unknown_sections text;
BEGIN
  IF to_regclass('public.line_items') IS NULL THEN
    RETURN; -- already migrated; the guards below handle the rest
  END IF;

  SELECT string_agg(DISTINCT quote_literal("section"), ', ')
  INTO unknown_sections
  FROM "line_items"
  WHERE "section" NOT IN ('grocery', 'weekend', 'transport', 'bills', 'extras');

  IF unknown_sections IS NOT NULL THEN
    RAISE EXCEPTION
      'line_items holds section values outside SECTION_MAPPING: %. Extend src/lib/transactions.ts first; this migration will not guess.',
      unknown_sections;
  END IF;
END $$;

-- ---------------------------------------------------------------- 2 · rename
DO $$
BEGIN
  IF to_regclass('public.line_items') IS NOT NULL
     AND to_regclass('public.transactions') IS NULL THEN
    ALTER TABLE "line_items" RENAME TO "transactions";
  END IF;
END $$;

-- Column renames. `description` -> `merchant` and `tag` -> `label` are renames,
-- never a copy-and-clear: the text arrives on the other side byte-for-byte,
-- including whatever the user typed in their own vocabulary (D-10).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'description'
  ) THEN
    ALTER TABLE "transactions" RENAME COLUMN "description" TO "merchant";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'tag'
  ) THEN
    ALTER TABLE "transactions" RENAME COLUMN "tag" TO "label";
  END IF;
END $$;

-- ----------------------------------------------------------------- 3 · widen
ALTER TABLE "transactions"
  ADD COLUMN IF NOT EXISTS "kind"        text,
  ADD COLUMN IF NOT EXISTS "category"    text,
  ADD COLUMN IF NOT EXISTS "occurred_on" date,
  ADD COLUMN IF NOT EXISTS "pending"     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "raw_import"  text;

-- --------------------------------------------------------------- 4 · backfill
--
-- Only rows that have not been mapped yet, so a re-run cannot overwrite a
-- category the user has since corrected in the editor.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'section'
  ) THEN
    UPDATE "transactions" SET
      "kind" = CASE "section"
        WHEN 'grocery'   THEN 'weekly'
        WHEN 'weekend'   THEN 'weekly'
        WHEN 'transport' THEN 'weekly'
        WHEN 'bills'     THEN 'recurring'
        WHEN 'extras'    THEN 'one_off'
      END,
      "category" = CASE "section"
        WHEN 'grocery'   THEN 'everyday'
        WHEN 'weekend'   THEN 'weekend'
        WHEN 'transport' THEN 'transport'
        WHEN 'bills'     THEN 'bills'
        WHEN 'extras'    THEN NULL
      END
    WHERE "kind" IS NULL;
  END IF;
END $$;

-- Belt and braces: the gate in step 1 makes this impossible, but a NULL kind
-- here would mean a row silently lost its classification, so check rather than
-- let the NOT NULL below report it as a nameless constraint violation.
DO $$
DECLARE unmapped bigint;
BEGIN
  SELECT count(*) INTO unmapped FROM "transactions" WHERE "kind" IS NULL;
  IF unmapped > 0 THEN
    RAISE EXCEPTION '% transaction row(s) came out of the mapping with no kind; aborting.', unmapped;
  END IF;
END $$;

ALTER TABLE "transactions" ALTER COLUMN "kind" SET NOT NULL;

-- `section` is dropped only now, once every row has been mapped. Nothing is
-- lost: the five sections and the kind/category pairs are one-to-one in both
-- directions, so the export path can reconstruct the sheet's vocabulary from
-- the new columns (weekly/everyday -> grocery, recurring/* -> bills, and so on).
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "section";

-- --------------------------------------------------------------- 5 · the rule
--
-- The same rule `isValidKindCategory()` implements, enforced by the database so
-- it holds for rows this application did not write.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'transactions'::regclass AND conname = 'transactions_kind_category'
  ) THEN
    ALTER TABLE "transactions" ADD CONSTRAINT "transactions_kind_category" CHECK (
      ("kind" = 'weekly'    AND "category" IN ('everyday', 'weekend', 'transport'))
      OR ("kind" = 'recurring' AND "category" IN ('housing', 'childcare', 'bills', 'subscriptions'))
      OR ("kind" = 'one_off'   AND "category" IS NULL)
    );
  END IF;
END $$;

-- ---------------------------------------------------------------- 6 · indexes
ALTER INDEX IF EXISTS "idx_line_items_period" RENAME TO "idx_transactions_period";
CREATE INDEX IF NOT EXISTS "idx_transactions_period" ON "transactions" ("period_id");
CREATE INDEX IF NOT EXISTS "idx_transactions_period_week" ON "transactions" ("period_id", "week_number");
CREATE INDEX IF NOT EXISTS "idx_transactions_period_kind" ON "transactions" ("period_id", "kind");

COMMIT;
