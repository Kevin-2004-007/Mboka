import { useSupabaseTable } from '../lib/useSupabaseTable'
import type { PendingEmployeeInfo } from './types'

export function usePendingEmployeeInfo() {
  return useSupabaseTable<PendingEmployeeInfo>('pending_employee_info')
}
