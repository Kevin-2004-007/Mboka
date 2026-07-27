import { useSupabaseTable } from '../lib/useSupabaseTable'
import type { BankTransaction } from './types'

export function useBankTransactions() {
  return useSupabaseTable<BankTransaction>('bank_transactions')
}
