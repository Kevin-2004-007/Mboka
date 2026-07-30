-- Two fixes to notifications:
-- 1. Duplicate system alerts (e.g. multiple identical "Stock faible")
--    happened because NotificationRules.tsx read "does this already exist"
--    then inserted, which races under repeated realtime-driven re-runs.
--    Replaced with an upsert against a unique constraint, so it's
--    idempotent no matter how many times/tabs attempt it concurrently.
-- 2. System alerts used to live as one row shared by the whole org
--    (user_id = 'system'), so one person reading it marked it read for
--    everyone. Now fanned out as one row per member, each with their own
--    independent read state. Run once in the Supabase SQL Editor.

-- Drop the old shared rows — NotificationRules.tsx regenerates them
-- fanned-out per member the next time anyone has the app open.
delete from notifications where user_id = 'system';

-- Existing duplicates would violate the new unique index below.
delete from notifications a using notifications b
where a.id > b.id
  and a.org_id = b.org_id and a.user_id = b.user_id
  and a.title = b.title and a.body is not distinct from b.body;

create unique index if not exists notifications_dedup on notifications(org_id, user_id, title, body);

drop policy if exists "select_own_or_broadcast" on notifications;
drop policy if exists "update_own_or_broadcast" on notifications;
create policy "select_own" on notifications for select
  using (org_id = clerk_org_id() and user_id = (auth.jwt() ->> 'sub'));
create policy "update_own" on notifications for update
  using (org_id = clerk_org_id() and user_id = (auth.jwt() ->> 'sub'));
