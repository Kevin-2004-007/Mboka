-- Lets a signer be an org member instead of only a free-text external name:
-- when user_id is set, that member gets an in-app notification and can sign
-- from inside the app directly (no /sign/{token} link needed for them).
-- Run once in the Supabase SQL Editor.

alter table esign_signers add column if not exists user_id text;
