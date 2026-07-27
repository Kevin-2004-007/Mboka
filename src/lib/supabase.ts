import { useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

// Builds a Supabase client that authenticates every request with the
// current Clerk session token. Requires the Clerk <-> Supabase Third-Party
// Auth integration (see .env.local.example) — only call this from
// components mounted under a signed-in Clerk session (AuthedWorkspace).
export function useSupabaseClient() {
  const { session } = useSession()

  return useMemo(
    () =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        accessToken: async () => (await session?.getToken()) ?? null,
      }),
    [session],
  )
}
