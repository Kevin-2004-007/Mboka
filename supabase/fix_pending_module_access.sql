-- Lets the admin restrict a new member's modules at invite time (LiveSettings.tsx)
-- instead of only after they've already joined. Run once in the Supabase SQL Editor.

alter table pending_employee_info add column if not exists modules text[];
