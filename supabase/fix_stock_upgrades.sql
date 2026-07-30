-- Adds: an optional supplier on stock items (for the "Commander" quick
-- reorder action) and a stock_movements table (history of quantity
-- adjustments, instead of silently overwriting qty with no trace). Run
-- once in the Supabase SQL Editor.

alter table stock_items add column if not exists supplier text;

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  stock_item_id uuid references stock_items(id) on delete cascade,
  delta int not null,
  note text,
  user_id text,
  created_at timestamptz not null default now()
);
alter table stock_movements enable row level security;
create policy "org_isolation" on stock_movements for all
  using (org_id = clerk_org_id())
  with check (org_id = clerk_org_id());
