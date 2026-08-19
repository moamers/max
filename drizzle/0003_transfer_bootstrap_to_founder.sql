-- 0003 · hand the pre-auth data to the founder's real account
--
-- Apply LAST, and only AFTER the founder has signed up at /signup using the
-- address below. Until then this migration is a no-op: it looks up the real
-- account and does nothing if it doesn't exist yet. Re-running it is harmless.
--
-- Kept as a separate step on purpose. The alternative — seeding a password hash
-- into a migration file — would put a real credential in the repository, and
-- letting signup silently "claim" a pre-existing row would mean anyone who
-- reached the app first with that email address would inherit the data.

UPDATE "periods" p
SET "user_id" = real_user."id"
FROM "users" real_user, "users" bootstrap
WHERE real_user."email" = 'moamer.0888@gmail.com'
  AND bootstrap."email"  = 'founder@max.local'
  AND p."user_id" = bootstrap."id";

-- Once the transfer has happened the bootstrap row owns nothing; remove it so
-- it can't quietly accumulate data later. Cascades are irrelevant here because
-- the WHERE clause guarantees it has no remaining periods.
DELETE FROM "users" bootstrap
WHERE bootstrap."email" = 'founder@max.local'
  AND NOT EXISTS (SELECT 1 FROM "periods" p WHERE p."user_id" = bootstrap."id");
