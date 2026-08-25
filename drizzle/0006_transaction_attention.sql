-- 0006 · a mutually-exclusive "needs a look" transaction state
--
-- Do not apply from an agent session. A human applies this after 0005.
-- Existing rows remain Final/Pending exactly as they were; the new state is
-- false by default and therefore carries every row across without reclassifying it.

BEGIN;

ALTER TABLE "transactions"
  ADD COLUMN "needs_attention" boolean NOT NULL DEFAULT false,
  ADD COLUMN "attention_reason" text,
  ADD CONSTRAINT "transactions_one_state"
    CHECK (NOT ("pending" AND "needs_attention"));

COMMIT;
