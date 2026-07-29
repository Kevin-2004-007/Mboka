-- MBOKA — full schema for the Supabase backend.
--
-- How to run: paste this whole file into the Supabase dashboard's SQL Editor
-- (your project -> SQL Editor -> New query) and run it once. Safe to re-run
-- (uses IF NOT EXISTS / ON CONFLICT DO NOTHING where it matters).
--
-- Multi-tenancy: every table carries an `org_id text` column holding the
-- active Clerk Organization id, and Row Level Security restricts every row
-- to `org_id = clerk_org_id()`, which reads the active org id out of the
-- Clerk session token (see the function's definition below for why it
-- checks two claim shapes). This requires the Clerk <-> Supabase
-- Third-Party Auth integration to be configured first (see
-- .env.local.example for the steps) — without it, auth.jwt() won't carry
-- Clerk's claims and every policy below will simply deny all access.

create extension if not exists pgcrypto;

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Clerk's session token has changed shape over time: older tokens carry
-- flat `org_id` / `org_role` / `org_slug` claims, current ones (token `v: 2`)
-- nest them under `o: { id, rol, slg }` instead. Reading through this
-- function instead of a raw `auth.jwt() ->> 'org_id'` means policies keep
-- working across that change instead of silently resolving to null (which
-- reads as "no org" and makes every row insert/select get denied by RLS).
create or replace function clerk_org_id() returns text as $$
  select coalesce(auth.jwt() -> 'o' ->> 'id', auth.jwt() ->> 'org_id')
$$ language sql stable;

-- Same claim-shape fallback as clerk_org_id(), for the caller's role
-- within the active org ('admin' or 'member').
create or replace function clerk_org_role() returns text as $$
  select coalesce(auth.jwt() -> 'o' ->> 'rol', auth.jwt() ->> 'org_role')
$$ language sql stable;

-- ── RH ──────────────────────────────────────────────────────────────────

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  name text not null,
  role text not null,
  dept text not null,
  contract text not null,
  status text not null default 'Actif',
  hire_date date,
  -- Set when this employee record corresponds to an org member's Clerk
  -- account (every member is an employee — see EmployeeSync.tsx, which
  -- auto-creates this row once they join). Left null for a plain HR record
  -- with no MBOKA login of its own.
  user_id text,
  created_at timestamptz not null default now()
);
alter table employees enable row level security;
create policy "org_isolation" on employees for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());
-- Prevents a race (e.g. two tabs) from creating the same member's employee
-- record twice; doesn't apply to null user_id (HR-only, no-login records).
create unique index if not exists employees_org_user_unique on employees(org_id, user_id) where user_id is not null;

create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  employee_id uuid references employees(id) on delete set null,
  type text not null,
  starts_on date not null,
  ends_on date not null,
  days numeric not null default 1,
  status text not null default 'En attente',
  manager text,
  created_at timestamptz not null default now()
);
alter table leave_requests enable row level security;
create policy "org_isolation" on leave_requests for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());

-- ── CRM ─────────────────────────────────────────────────────────────────

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  company text not null,
  amount numeric not null default 0,
  contact text,
  close_date date,
  stage text not null default 'Prospection',
  created_at timestamptz not null default now()
);
alter table deals enable row level security;
create policy "org_isolation" on deals for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());

-- ── Finance / Comptabilité ─────────────────────────────────────────────

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  number text not null,
  client text not null,
  amount numeric not null default 0,
  issued_on date not null default current_date,
  due_on date,
  status text not null default 'En attente',
  created_at timestamptz not null default now()
);
alter table invoices enable row level security;
create policy "org_isolation" on invoices for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());

create table if not exists bank_transactions (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  txn_date date not null default current_date,
  label text not null,
  amount numeric not null default 0,
  type text not null,
  matched boolean not null default false,
  created_at timestamptz not null default now()
);
alter table bank_transactions enable row level security;
create policy "org_isolation" on bank_transactions for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());

-- ── Achats ──────────────────────────────────────────────────────────────

create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  number text not null,
  supplier text not null,
  amount numeric not null default 0,
  ordered_on date not null default current_date,
  delivery_on date,
  status text not null default 'Brouillon',
  items_count int not null default 0,
  created_at timestamptz not null default now()
);
alter table purchase_orders enable row level security;
create policy "org_isolation" on purchase_orders for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());

-- ── Stock ───────────────────────────────────────────────────────────────
-- Note: "status" (En stock / Stock faible / Rupture) is derived client-side
-- from qty vs min_qty rather than stored redundantly.

create table if not exists stock_items (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  ref text not null,
  name text not null,
  qty int not null default 0,
  warehouse text,
  min_qty int not null default 0,
  value numeric not null default 0,
  created_at timestamptz not null default now()
);
alter table stock_items enable row level security;
create policy "org_isolation" on stock_items for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());

-- ── Notes de frais ──────────────────────────────────────────────────────
-- receipt_path points into the shared `attachments` Storage bucket, see below.

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  number text not null,
  employee_id uuid references employees(id) on delete set null,
  category text not null,
  amount numeric not null default 0,
  spent_on date not null default current_date,
  description text,
  status text not null default 'Soumise',
  receipt_path text,
  created_at timestamptz not null default now()
);
alter table expenses enable row level security;
create policy "org_isolation" on expenses for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());

-- ── Projets ─────────────────────────────────────────────────────────────

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  name text not null,
  client text,
  progress int not null default 0,
  budget numeric not null default 0,
  spent numeric not null default 0,
  members_count int not null default 0,
  deadline date,
  status text not null default 'En cours',
  logged_hours numeric not null default 0,
  created_at timestamptz not null default now()
);
alter table projects enable row level security;
create policy "org_isolation" on projects for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());

create table if not exists time_entries (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  project_id uuid references projects(id) on delete cascade,
  employee_id uuid references employees(id) on delete set null,
  work_date date not null default current_date,
  hours numeric not null default 0,
  created_at timestamptz not null default now()
);
alter table time_entries enable row level security;
create policy "org_isolation" on time_entries for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());

-- ── Support client ──────────────────────────────────────────────────────

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  number text not null,
  subject text not null,
  client text,
  assignee text,
  priority text not null default 'Normale',
  status text not null default 'Ouvert',
  sla_deadline timestamptz,
  created_at timestamptz not null default now()
);
alter table tickets enable row level security;
create policy "org_isolation" on tickets for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());

-- ── GED (documents) ─────────────────────────────────────────────────────
-- storage_path points into the shared `attachments` Storage bucket, see below.

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  name text not null,
  folder text,
  size_bytes bigint not null default 0,
  file_type text,
  storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table documents enable row level security;
create policy "org_isolation" on documents for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());
create trigger documents_set_updated_at before update on documents
  for each row execute function set_updated_at();

-- ── Signature électronique ─────────────────────────────────────────────

create table if not exists esign_documents (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  title text not null,
  status text not null default 'En attente',
  deadline date,
  storage_path text,
  -- Clerk user id of whoever created the request — lets them keep seeing
  -- it even if they're not one of the signers (see select policy below).
  created_by text,
  created_at timestamptz not null default now()
);
alter table esign_documents enable row level security;

create table if not exists esign_signers (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  esign_document_id uuid references esign_documents(id) on delete cascade,
  name text not null,
  initials text,
  done boolean not null default false,
  token uuid not null default gen_random_uuid() unique,
  -- Set when this signer was picked from the org's members (Clerk user id) —
  -- lets them sign directly inside the app instead of via the public
  -- /sign/{token} link, which stays reserved for external signers.
  user_id text,
  created_at timestamptz not null default now()
);
alter table esign_signers enable row level security;

-- security definer so these checks don't recurse back through the other
-- table's own RLS (a plain subquery in a policy is still evaluated as the
-- calling role, which would hit that table's select policy too).
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

-- Only admins, the request's creator, and its signers can see a given
-- e-signature request — everyone else in the org used to see every
-- document regardless of relevance (e.g. an employee's salary letter
-- visible to unrelated coworkers). Writes stay org-wide: creating a
-- request, and a signer flipping the shared doc status to "Signé" on the
-- last signature, both need to work for any org member.
create policy "select_admin_creator_or_signer" on esign_documents for select
  using (org_id = clerk_org_id() and (
    clerk_org_role() = 'admin' or
    created_by = (auth.jwt() ->> 'sub') or
    is_esign_signer(id, auth.jwt() ->> 'sub')
  ));
create policy "write_org_members" on esign_documents for insert with check (org_id = clerk_org_id());
create policy "update_org_members" on esign_documents for update using (org_id = clerk_org_id());
create policy "delete_org_members" on esign_documents for delete using (org_id = clerk_org_id());

create policy "select_admin_creator_or_cosigner" on esign_signers for select
  using (org_id = clerk_org_id() and (
    clerk_org_role() = 'admin' or
    is_esign_creator(esign_document_id, auth.jwt() ->> 'sub') or
    is_esign_signer(esign_document_id, auth.jwt() ->> 'sub')
  ));
create policy "write_org_members" on esign_signers for insert with check (org_id = clerk_org_id());
create policy "update_org_members" on esign_signers for update using (org_id = clerk_org_id());
create policy "delete_org_members" on esign_signers for delete using (org_id = clerk_org_id());

-- Lets an external signer (no Clerk session, no org membership) open their
-- personal /sign/{token} link and sign, without granting them any broader
-- access. security definer runs as the function owner, bypassing the
-- org_isolation RLS above — the token itself (an unguessable uuid) is what
-- limits access, so callers must only ever be able to look up by exact token.
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

-- ── Business Intelligence ──────────────────────────────────────────────

create table if not exists bi_reports (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  name text not null,
  type text,
  owner text,
  schedule text,
  views int not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table bi_reports enable row level security;
create policy "org_isolation" on bi_reports for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());
create trigger bi_reports_set_updated_at before update on bi_reports
  for each row execute function set_updated_at();

-- ── Automatisations ─────────────────────────────────────────────────────

create table if not exists automations (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  name text not null,
  trigger_module text,
  trigger_description text,
  actions jsonb not null default '[]'::jsonb,
  status text not null default 'Actif',
  runs_count int not null default 0,
  last_run_at timestamptz,
  created_at timestamptz not null default now()
);
alter table automations enable row level security;
create policy "org_isolation" on automations for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());

-- ── Qualité / Conformité ────────────────────────────────────────────────

create table if not exists audits (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  title text not null,
  type text,
  assignee text,
  deadline date,
  status text not null default 'Planifié',
  progress int not null default 0,
  nc_count int not null default 0,
  created_at timestamptz not null default now()
);
alter table audits enable row level security;
create policy "org_isolation" on audits for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());

create table if not exists audit_checklist_items (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  audit_id uuid references audits(id) on delete cascade,
  item text not null,
  done boolean not null default false,
  nc boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table audit_checklist_items enable row level security;
create policy "org_isolation" on audit_checklist_items for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());

-- ── Transverse : notifications, paramètres d'organisation ──────────────
-- notifications is per-user (user_id = Clerk user id), not just per-org.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  user_id text not null,
  title text not null,
  body text,
  module text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table notifications enable row level security;
-- Split (rather than one "for all" policy) because reads and writes need
-- different scopes: a member must only ever *see* their own notifications
-- or broadcast ones (user_id = 'system'), but must be able to *create* a
-- notification addressed to a teammate (e.g. an e-signature request) —
-- restricting insert to the caller's own user_id would break that.
create policy "select_own_or_broadcast" on notifications for select
  using (org_id = clerk_org_id() and (user_id = 'system' or user_id = (auth.jwt() ->> 'sub')));
create policy "insert_any_org_member" on notifications for insert
  with check (org_id = clerk_org_id());
create policy "update_own_or_broadcast" on notifications for update
  using (org_id = clerk_org_id() and (user_id = 'system' or user_id = (auth.jwt() ->> 'sub')));

-- Replaces the mboka:activeModules:<orgId> localStorage hack from onboarding.
create table if not exists org_settings (
  org_id text primary key,
  active_modules text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table org_settings enable row level security;
create policy "org_isolation" on org_settings for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());
create trigger org_settings_set_updated_at before update on org_settings
  for each row execute function set_updated_at();

-- Per-member module restriction. No row for a (org_id, user_id) pair means
-- that member sees every module the org has active — a row only exists once
-- an admin narrows a specific member down to a subset (see LiveSettings.tsx).
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

-- Carries the "Poste"/"Département" an admin fills in on the invite modal
-- through to invitation acceptance, since Clerk's invitation itself has
-- nowhere in this app's flow to stash them. EmployeeSync.tsx consumes (and
-- deletes) the matching row by email once the invited member's employee
-- record is auto-created — see fix_employee_sync.sql for why this exists.
create table if not exists pending_employee_info (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  email text not null,
  role text not null default '',
  dept text not null default '',
  -- Module restriction chosen at invite time (LiveSettings.tsx), applied to
  -- member_module_access once the invitee joins (EmployeeSync.tsx). Null
  -- means no restriction, same convention as member_module_access itself.
  modules text[],
  created_at timestamptz not null default now()
);
alter table pending_employee_info enable row level security;
create policy "org_isolation" on pending_employee_info for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());

-- ── Storage (file uploads: documents, expense receipts, audit evidence) ─
-- Convention: objects are uploaded under `{org_id}/...` in this bucket, so
-- the policy below can enforce tenancy from the path's first segment.

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "org_isolation_storage" on storage.objects for all
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = clerk_org_id())
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = clerk_org_id());

-- Lets an external signer (no org session) fetch the specific file attached
-- to an e-signature request — scoped to exactly the objects registered as an
-- esign_documents.storage_path, not the whole attachments bucket, so it
-- doesn't widen access to other orgs' receipts/documents/etc.
--
-- This has to go through a security definer function rather than an inline
-- `exists (select ... from esign_documents ...)`: a subquery inside an RLS
-- policy is still evaluated as the calling role, so an anonymous signer
-- would hit esign_documents' own org_isolation policy and always get zero
-- rows back (org_id can never equal an anonymous caller's — nonexistent —
-- org claim). The function runs as its owner, bypassing that RLS, while
-- still only ever answering "is this exact path a registered esign file?".
create or replace function is_esign_attachment(p_path text) returns boolean
security definer set search_path = public language sql as $$
  select exists (select 1 from esign_documents where storage_path = p_path)
$$;
grant execute on function is_esign_attachment(text) to anon, authenticated;

create policy "esign_public_read" on storage.objects for select
  using (bucket_id = 'attachments' and is_esign_attachment(storage.objects.name));
