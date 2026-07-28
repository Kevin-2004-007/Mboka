import { useCallback, useEffect, useState } from 'react'
import { useOrganization } from '@clerk/react'
import { useSupabaseClient } from '../lib/supabase'

export type MemberModuleAccessRow = { user_id: string; modules: string[] }

// One row per restricted member (org_id, user_id primary key), so this
// doesn't fit the generic id-based useSupabaseTable pattern. Absence of a
// row for a member means "no restriction" — they see every module the org
// has active — so `setAccess(id, null)` deletes the row instead of storing
// an explicit "all modules" list that would drift if the org's active list
// changes later.
export function useMemberModuleAccess() {
  const supabase = useSupabaseClient()
  const { organization } = useOrganization()
  const [rows, setRows] = useState<MemberModuleAccessRow[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!organization) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('member_module_access')
      .select('user_id, modules')
      .eq('org_id', organization.id)
    setRows((data as MemberModuleAccessRow[] | null) ?? [])
    setLoading(false)
  }, [supabase, organization])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function setAccess(userId: string, modules: string[] | null) {
    if (!organization) return
    if (modules === null) {
      const { error } = await supabase.from('member_module_access').delete().eq('org_id', organization.id).eq('user_id', userId)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await (supabase.from('member_module_access') as any).upsert({ org_id: organization.id, user_id: userId, modules })
      if (error) throw new Error(error.message)
    }
    await refresh()
  }

  return { rows, loading, setAccess, refresh }
}
