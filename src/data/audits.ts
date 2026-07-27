import { useSupabaseTable } from '../lib/useSupabaseTable'
import type { Audit, AuditChecklistItem } from './types'

export function useAudits() {
  return useSupabaseTable<Audit>('audits')
}

export function useAuditChecklistItems() {
  return useSupabaseTable<AuditChecklistItem>('audit_checklist_items')
}
