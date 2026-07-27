import { useSupabaseTable } from '../lib/useSupabaseTable'
import type { Document } from './types'

export function useDocuments() {
  return useSupabaseTable<Document>('documents')
}
