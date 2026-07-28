-- Adds per-member module restrictions on top of the org-wide "Modules
-- actifs" setting. Run once in the Supabase SQL Editor on a project that
-- already ran schema.sql (which now includes this table for fresh installs).
--
-- No row for a (org_id, user_id) pair means that member sees every module
-- the org has active — a row only exists once an admin narrows a specific
-- member down to a subset, from Paramètres → Membres & rôles.

create table if not exists member_module_access (
  org_id text not null,
  user_id text not null,
  modules text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
alter table member_module_access enable row level security;
create policy "org_isolation" on member_module_access for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());
create trigger member_module_access_set_updated_at before update on member_module_access
  for each row execute function set_updated_at();
