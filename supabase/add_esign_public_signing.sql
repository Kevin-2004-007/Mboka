-- Upgrades the e-signature module from an in-app simulation to a real
-- per-signer flow: a real uploaded file, and a unique /sign/{token} link
-- each signer can open without a Clerk session or org membership.
-- Run once in the Supabase SQL Editor on a project that already ran
-- schema.sql (which now includes this for fresh installs).

alter table esign_documents add column if not exists storage_path text;
alter table esign_signers add column if not exists token uuid not null default gen_random_uuid() unique;

create or replace function get_esign_signer_by_token(p_token uuid)
returns table (
  document_title text,
  document_deadline date,
  document_status text,
  document_storage_path text,
  signer_id uuid,
  signer_name text,
  signer_done boolean
)
security definer set search_path = public language sql as $$
  select d.title, d.deadline, d.status, d.storage_path, s.id, s.name, s.done
  from esign_signers s join esign_documents d on d.id = s.esign_document_id
  where s.token = p_token
$$;

create or replace function sign_esign_by_token(p_token uuid)
returns void
security definer set search_path = public language plpgsql as $$
declare
  v_doc_id uuid;
begin
  update esign_signers set done = true where token = p_token returning esign_document_id into v_doc_id;
  if v_doc_id is not null and not exists (
    select 1 from esign_signers where esign_document_id = v_doc_id and done = false
  ) then
    update esign_documents set status = 'Signé' where id = v_doc_id;
  end if;
end;
$$;

grant execute on function get_esign_signer_by_token(uuid) to anon, authenticated;
grant execute on function sign_esign_by_token(uuid) to anon, authenticated;

drop policy if exists "esign_public_read" on storage.objects;
create policy "esign_public_read" on storage.objects for select
  using (bucket_id = 'attachments' and exists (
    select 1 from esign_documents d where d.storage_path = storage.objects.name
  ));
