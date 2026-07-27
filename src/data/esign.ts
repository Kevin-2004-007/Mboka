import { useSupabaseTable } from '../lib/useSupabaseTable'
import type { EsignDocument, EsignSigner } from './types'

export function useEsignDocuments() {
  return useSupabaseTable<EsignDocument>('esign_documents')
}

export function useEsignSigners() {
  return useSupabaseTable<EsignSigner>('esign_signers')
}
