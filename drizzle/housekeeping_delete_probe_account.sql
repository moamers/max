-- Housekeeping · remove the throwaway test account
--
-- I created this account while verifying that per-user isolation actually
-- held in production. It owns no financial data — the isolation test is what
-- proved that — but it is a real row with a password that appears in a chat
-- transcript, and it should not outlive the test it was made for.
--
-- Sessions cascade from users, so this one statement is enough. It cannot
-- touch your own account: it matches on that address only.

DELETE FROM users WHERE email = 'probe@example.com';

-- Verify: expects your address only.
SELECT email, created_at FROM users ORDER BY created_at;
