import { useSupabaseTable } from '../lib/useSupabaseTable'
import type { Expense } from './types'

export function useExpenses() {
  return useSupabaseTable<Expense>('expenses')
}
