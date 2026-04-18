-- FairGiG — fix logins that fail with "Database error querying schema"
--
-- Cause: GoTrue cannot scan NULL into string fields on auth.users (e.g. users
-- inserted manually without token columns). App signups set these to ''.
-- Symptom: worker (signed up via app) works; verifier/advocate (often seeded in SQL) do not.
--
-- Run in Supabase SQL Editor (Dashboard → SQL) on the FairGig project.
-- Then retry login. Prefer long-term: create test users via POST /api/v1/auth/signup
-- or Supabase Dashboard → Authentication → Add user, not raw INSERT into auth.users.

UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, '')
WHERE confirmation_token IS NULL
   OR recovery_token IS NULL
   OR email_change_token_new IS NULL
   OR email_change IS NULL;

-- If login still fails, your project may use extra nullable token columns. Inspect:
--   select column_name from information_schema.columns
--   where table_schema = 'auth' and table_name = 'users';
-- and COALESCE any other *_token or email_change* text columns that are NULL for affected rows.
