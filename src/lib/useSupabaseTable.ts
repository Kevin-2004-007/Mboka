import { useCallback, useEffect, useRef, useState } from 'react'
import { useOrganization } from '@clerk/react'
import { useSupabaseClient } from './supabase'

export type TableRow<T> = T & { id: string; org_id: string; created_at: string }

// Generic CRUD hook shared by every entity in src/data/*.ts. Fetches all
// rows of `table` for the active Clerk Organization on mount (and whenever
// the active org changes) and exposes insert/update/remove helpers that
// refetch afterwards. RLS (see supabase/schema.sql) already restricts rows
// to the caller's org server-side — the org filter here is just so switching
// orgs doesn't show a stale list while the new one loads.
export function useSupabaseTable<T extends Record<string, unknown>>(table: string) {
  const supabase = useSupabaseClient()
  const { organization } = useOrganization()
  const [data, setData] = useState<TableRow<T>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!organization) {
      setData([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('org_id', organization.id)
      .order('created_at', { ascending: true })

    if (error) setError(error.message)
    else {
      setData((data ?? []) as TableRow<T>[])
      setError(null)
    }
    setLoading(false)
  }, [supabase, table, organization])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Kept up to date without becoming an effect dependency itself — refresh's
  // identity churns with every new `organization` object Clerk hands back,
  // and we don't want that to tear down/recreate the realtime subscription.
  const refreshRef = useRef(refresh)
  useEffect(() => {
    refreshRef.current = refresh
  }, [refresh])

  // Live updates: any insert/update/delete on this table for the active org
  // (from this tab or a teammate's) triggers a refetch, so lists stay current
  // without a manual reload. Requires the table to be added to Supabase's
  // `supabase_realtime` publication (Database > Replication in the dashboard).
  useEffect(() => {
    if (!organization) return
    const channel = supabase
      .channel(`${table}-${organization.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `org_id=eq.${organization.id}` },
        () => {
          refreshRef.current()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, table, organization?.id])

  async function insert(row: Partial<T>) {
    if (!organization) return null
    // supabase-js infers insert/update payload types from the (unspecified)
    // Database schema; without generated types that inference fights any
    // externally-supplied generic, so the builder is treated as untyped here.
    const { data, error } = await (supabase.from(table) as any)
      .insert({ ...row, org_id: organization.id })
      .select()
      .single()

    if (error) {
      setError(error.message)
      return null
    }
    await refresh()
    return data as TableRow<T>
  }

  async function update(id: string, patch: Partial<T>) {
    const { error } = await (supabase.from(table) as any).update(patch).eq('id', id)
    if (error) {
      setError(error.message)
      return false
    }
    await refresh()
    return true
  }

  async function remove(id: string) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) {
      setError(error.message)
      return false
    }
    await refresh()
    return true
  }

  return { data, loading, error, insert, update, remove, refresh }
}
