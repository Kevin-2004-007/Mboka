-- Restricts each member to seeing only their own notifications (plus
-- broadcast ones with user_id = 'system', e.g. overdue invoices/low stock
-- alerts) instead of every notification in the org — today anyone can see
-- e.g. "you have a document to sign" messages addressed to a teammate.
-- Run once in the Supabase SQL Editor.

drop policy if exists "org_isolation" on notifications;

create policy "select_own_or_broadcast" on notifications for select
  using (org_id = clerk_org_id() and (user_id = 'system' or user_id = (auth.jwt() ->> 'sub')));

-- Any org member can still create a notification addressed to a teammate
-- (e.g. an e-signature request) — only reading someone else's is blocked.
create policy "insert_any_org_member" on notifications for insert
  with check (org_id = clerk_org_id());

-- Broadcast rows (user_id = 'system') stay a single shared row today (no
-- per-user read-tracking table), so marking one read must remain allowed
-- for anyone, matching existing behavior — only a teammate's *personal*
-- notification is off-limits to update.
create policy "update_own_or_broadcast" on notifications for update
  using (org_id = clerk_org_id() and (user_id = 'system' or user_id = (auth.jwt() ->> 'sub')));
