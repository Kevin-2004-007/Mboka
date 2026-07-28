-- Fix for existing MBOKA Supabase projects created before Clerk changed its
-- session token shape. Older Clerk tokens carried flat `org_id` / `org_role`
-- / `org_slug` claims; current tokens (session token `v: 2`) nest them under
-- `o: { id, rol, slg }` instead. Every RLS policy here used to read
-- `auth.jwt() ->> 'org_id'` directly, which now resolves to null — so every
-- insert/select/update got silently denied (Postgres error 42501).
--
-- Run this once in the Supabase SQL Editor on a project that already ran the
-- old schema.sql. New projects should just use the updated schema.sql, which
-- already includes this function.

create or replace function clerk_org_id() returns text as $$
  select coalesce(auth.jwt() -> 'o' ->> 'id', auth.jwt() ->> 'org_id')
$$ language sql stable;

do $$
declare
  t text;
  tables text[] := array[
    'employees', 'leave_requests', 'deals', 'invoices', 'bank_transactions',
    'purchase_orders', 'stock_items', 'expenses', 'projects', 'time_entries',
    'tickets', 'documents', 'esign_documents', 'esign_signers', 'bi_reports',
    'automations', 'audits', 'audit_checklist_items', 'notifications', 'org_settings'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists "org_isolation" on %I', t);
    execute format(
      'create policy "org_isolation" on %I for all using (org_id = clerk_org_id()) with check (org_id = clerk_org_id())',
      t
    );
  end loop;
end $$;

drop policy if exists "org_isolation_storage" on storage.objects;
create policy "org_isolation_storage" on storage.objects for all
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = clerk_org_id())
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = clerk_org_id());
