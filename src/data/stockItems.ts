import { useSupabaseTable } from '../lib/useSupabaseTable'
import type { StockItem } from './types'

export function useStockItems() {
  return useSupabaseTable<StockItem>('stock_items')
}

export function stockStatus(qty: number, minQty: number): string {
  if (qty === 0) return 'Rupture'
  if (qty <= minQty) return 'Stock faible'
  return 'En stock'
}
