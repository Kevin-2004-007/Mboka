import { useSupabaseTable } from '../lib/useSupabaseTable'
import type { Project } from './types'

export function useProjects() {
  return useSupabaseTable<Project>('projects')
}
