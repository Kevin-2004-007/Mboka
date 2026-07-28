-- Fixes the "esign_public_read" storage policy from add_esign_public_signing.sql:
-- its inline `exists (select ... from esign_documents ...)` subquery was
-- still evaluated as the calling (anonymous) role, so it always hit
-- esign_documents' own org_isolation RLS and returned zero rows — every
-- signed URL request for an attached file silently failed, which the app
-- then (wrongly) reported as "no file was attached". Run this once in the
-- Supabase SQL Editor.

create or replace function is_esign_attachment(p_path text) returns boolean
security definer set search_path = public language sql as $$
  select exists (select 1 from esign_documents where storage_path = p_path)
$$;
grant execute on function is_esign_attachment(text) to anon, authenticated;

drop policy if exists "esign_public_read" on storage.objects;
create policy "esign_public_read" on storage.objects for select
  using (bucket_id = 'attachments' and is_esign_attachment(storage.objects.name));
