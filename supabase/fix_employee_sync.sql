-- Auto-links every org member to an employee record ("every member is
-- necessarily an employee") instead of requiring the admin to re-enter the
-- same person by hand in Ressources Humaines after inviting them. Run once
-- in the Supabase SQL Editor.

alter table employees add column if not exists user_id text;
create unique index if not exists employees_org_user_unique on employees(org_id, user_id) where user_id is not null;

create table if not exists pending_employee_info (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  email text not null,
  role text not null default '',
  dept text not null default '',
  created_at timestamptz not null default now()
);
alter table pending_employee_info enable row level security;
create policy "org_isolation" on pending_employee_info for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());
