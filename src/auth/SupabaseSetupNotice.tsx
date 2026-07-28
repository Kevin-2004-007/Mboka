import { AlertTriangle } from 'lucide-react'

export function SupabaseSetupNotice({ onDemo }: { onDemo: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
        <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
          <AlertTriangle size={20} className="text-amber-500" />
        </div>
        <h1 className="text-sm font-semibold text-gray-900 mb-1">Configuration Supabase manquante</h1>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">
          Tu es connecté avec Clerk, mais l'app ne trouve pas de clé Supabase valide — toutes les données réelles (employés, deals, factures…) resteraient inaccessibles tant que ça n'est pas réglé.
        </p>
        <div className="bg-gray-50 rounded-xl p-3 text-[11px] text-gray-600 space-y-1.5 mb-4">
          <p>1. Dans <code className="bg-gray-100 px-1 rounded">.env.local</code>, renseigne :</p>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-2.5 overflow-x-auto">{'VITE_SUPABASE_URL=...\nVITE_SUPABASE_ANON_KEY=...'}</pre>
          <p>2. Clés à copier depuis Supabase → <span className="font-medium">Project Settings → API</span> (URL + clé <span className="font-medium">anon public</span>).</p>
          <p>3. Redémarre le serveur (<code className="bg-gray-100 px-1 rounded">pnpm dev</code>) — Vite ne relit ces variables qu'au démarrage.</p>
        </div>
        <button onClick={onDemo} className="w-full text-center text-xs text-gray-400 hover:text-indigo-600 transition-colors">
          Voir la démo sans compte →
        </button>
      </div>
    </div>
  )
}
