import { useSupabaseTable } from '../lib/useSupabaseTable'
import type { PurchaseOrder } from './types'

export function usePurchaseOrders() {
  return useSupabaseTable<PurchaseOrder>('purchase_orders')
}
