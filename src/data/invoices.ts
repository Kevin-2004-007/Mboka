import { useSupabaseTable } from '../lib/useSupabaseTable'
import type { Invoice } from './types'

export function useInvoices() {
  return useSupabaseTable<Invoice>('invoices')
}
