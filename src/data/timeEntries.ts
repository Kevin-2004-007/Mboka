import { useSupabaseTable } from '../lib/useSupabaseTable'
import type { TimeEntry } from './types'

export function useTimeEntries() {
  return useSupabaseTable<TimeEntry>('time_entries')
}
