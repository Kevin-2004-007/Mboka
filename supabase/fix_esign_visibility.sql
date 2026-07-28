-- Restricts e-signature request visibility to admins, the request's
-- creator, and its signers — previously any org member could see every
-- signature request in the org regardless of relevance (e.g. an
-- employee's salary letter visible to unrelated coworkers). Run once in
-- the Supabase SQL Editor.

create or replace function clerk_org_role() returns text as $$
  select coalesce(auth.jwt() -> 'o' ->> 'rol', auth.jwt() ->> 'org_role')
$$ language sql stable;

alter table esign_documents add column if not exists created_by text;

create or replace function is_esign_signer(p_doc_id uuid, p_user_id text) returns boolean
security definer set search_path = public language sql as $$
  select exists (select 1 from esign_signers where esign_document_id = p_doc_id and user_id = p_user_id)
$$;
create or replace function is_esign_creator(p_doc_id uuid, p_user_id text) returns boolean
security definer set search_path = public language sql as $$
  select exists (select 1 from esign_documents where id = p_doc_id and created_by = p_user_id)
$$;
grant execute on function is_esign_signer(uuid, text) to authenticated;
grant execute on function is_esign_creator(uuid, text) to authenticated;

drop policy if exists "org_isolation" on esign_documents;
create policy "select_admin_creator_or_signer" on esign_documents for select
  using (org_id = clerk_org_id() and (
    clerk_org_role() = 'admin' or
    created_by = (auth.jwt() ->> 'sub') or
    is_esign_signer(id, auth.jwt() ->> 'sub')
  ));
create policy "write_org_members" on esign_documents for insert with check (org_id = clerk_org_id());
create policy "update_org_members" on esign_documents for update using (org_id = clerk_org_id());
create policy "delete_org_members" on esign_documents for delete using (org_id = clerk_org_id());

drop policy if exists "org_isolation" on esign_signers;
create policy "select_admin_creator_or_cosigner" on esign_signers for select
  using (org_id = clerk_org_id() and (
    clerk_org_role() = 'admin' or
    is_esign_creator(esign_document_id, auth.jwt() ->> 'sub') or
    is_esign_signer(esign_document_id, auth.jwt() ->> 'sub')
  ));
create policy "write_org_members" on esign_signers for insert with check (org_id = clerk_org_id());
create policy "update_org_members" on esign_signers for update using (org_id = clerk_org_id());
create policy "delete_org_members" on esign_signers for delete using (org_id = clerk_org_id());
