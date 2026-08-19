-- 0002 · scope every period to a user
--
-- Apply second, after 0001.
--
-- The rows already in this database (the founder's real pay period) are
-- assigned to a bootstrap user rather than deleted. The bootstrap account has a
-- deliberately unusable password hash ('!' does not parse as a scrypt hash, and
-- verifyPassword returns false for it), so it can hold data but can never be
-- signed into. 0003 hands that data to the founder's real account once he has
-- signed up.

INSERT INTO "users" ("email", "password_hash")
VALUES ('founder@max.local', '!')
ON CONFLICT ("email") DO NOTHING;

ALTER TABLE "periods"
  ADD COLUMN IF NOT EXISTS "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE;

UPDATE "periods"
SET "user_id" = (SELECT "id" FROM "users" WHERE "email" = 'founder@max.local')
WHERE "user_id" IS NULL;

ALTER TABLE "periods" ALTER COLUMN "user_id" SET NOT NULL;

-- `label` was globally unique. It must now be unique per user: two people are
-- both entitled to a period called "September 2025". Dropped by lookup rather
-- than by name because the original constraint/index name depends on how the
-- table was first created.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    WHERE con.conrelid = 'periods'::regclass
      AND con.contype = 'u'
      AND (
        SELECT array_agg(att.attname::text)
        FROM pg_attribute att
        WHERE att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
      ) = ARRAY['label']
  LOOP
    EXECUTE format('ALTER TABLE "periods" DROP CONSTRAINT %I', r.conname);
  END LOOP;

  -- Same shape, but created as a bare unique index rather than a constraint.
  FOR r IN
    SELECT c.relname AS conname
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    WHERE i.indrelid = 'periods'::regclass
      AND i.indisunique
      AND NOT i.indisprimary
      AND i.indnatts = 1
      AND (
        SELECT att.attname::text
        FROM pg_attribute att
        WHERE att.attrelid = i.indrelid AND att.attnum = i.indkey[0]
      ) = 'label'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I', r.conname);
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "periods_user_label_unique" ON "periods" ("user_id", "label");
CREATE INDEX IF NOT EXISTS "idx_periods_user" ON "periods" ("user_id");
