import { useSupabaseTable } from '../lib/useSupabaseTable'
import type { Employee } from './types'

export function useEmployees() {
  return useSupabaseTable<Employee>('employees')
}
