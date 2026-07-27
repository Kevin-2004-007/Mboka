import { useSupabaseTable } from '../lib/useSupabaseTable'
import type { Automation } from './types'

export function useAutomations() {
  return useSupabaseTable<Automation>('automations')
}
