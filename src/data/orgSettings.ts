import { useCallback, useEffect, useState } from 'react'
import { useOrganization } from '@clerk/react'
import { useSupabaseClient } from '../lib/supabase'

// org_settings is one row per org keyed by org_id (no separate id column),
// so it doesn't fit the generic list-based useSupabaseTable pattern used by
// every other entity — it needs its own get/upsert-single-row hook.
export function useOrgSettings() {
  const supabase = useSupabaseClient()
  const { organization } = useOrganization()
  const [activeModules, setActiveModules] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!organization) {
      setActiveModules(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('org_settings')
      .select('active_modules')
      .eq('org_id', organization.id)
      .maybeSingle()
    setActiveModules((data as { active_modules: string[] } | null)?.active_modules ?? null)
    setLoading(false)
  }, [supabase, organization])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function setModules(modules: string[]) {
    if (!organization) return
    const { error } = await (supabase.from('org_settings') as any).upsert({ org_id: organization.id, active_modules: modules })
    if (error) throw new Error(error.message)
    await refresh()
  }

  return { activeModules, loading, setModules, refresh }
}
