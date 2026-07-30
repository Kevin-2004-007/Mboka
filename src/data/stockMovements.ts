import { useSupabaseTable } from '../lib/useSupabaseTable'
import type { StockMovement } from './types'

export function useStockMovements() {
  return useSupabaseTable<StockMovement>('stock_movements')
}
