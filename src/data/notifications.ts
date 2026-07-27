import { useSupabaseTable } from '../lib/useSupabaseTable'
import type { Notification } from './types'

// Org-wide shared feed (not per-user) — matches how the original mockup
// presented notifications, and keeps this in line with the simple
// list-based hook pattern used everywhere else.
export function useNotifications() {
  return useSupabaseTable<Notification>('notifications')
}
