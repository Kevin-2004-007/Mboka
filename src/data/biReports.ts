import { useSupabaseTable } from '../lib/useSupabaseTable'
import type { BiReport } from './types'

export function useBiReports() {
  return useSupabaseTable<BiReport>('bi_reports')
}
