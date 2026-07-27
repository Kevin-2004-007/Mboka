import { useSupabaseTable } from '../lib/useSupabaseTable'
import type { Ticket } from './types'

export function useTickets() {
  return useSupabaseTable<Ticket>('tickets')
}
