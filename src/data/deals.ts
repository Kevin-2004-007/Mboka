import { useSupabaseTable } from '../lib/useSupabaseTable'
import type { Deal } from './types'

export function useDeals() {
  return useSupabaseTable<Deal>('deals')
}
