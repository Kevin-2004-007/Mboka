import { useSupabaseTable } from '../lib/useSupabaseTable'
import type { LeaveRequest } from './types'

export function useLeaveRequests() {
  return useSupabaseTable<LeaveRequest>('leave_requests')
}
