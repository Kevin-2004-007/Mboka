import { useOrganizationList, useUser, useClerk } from '@clerk/react'
import { Building2, Plus, ChevronRight, X } from 'lucide-react'

export function OrgSelectScreen({ variant, onClose, onCreateNew }: {
  variant: 'fullscreen' | 'modal'
  onClose?: () => void
  onCreateNew: () => void
}) {
  const { isLoaded, userMemberships, setActive } = useOrganizationList({ userMemberships: true })
  const { user } = useUser()
  const { signOut } = useClerk()

  const panel = (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="text-sm font-semibold text-gray-900">Choisir une organisation</p>
          {variant === 'fullscreen' && (
            <p className="text-[11px] text-gray-400 mt-0.5">{user?.primaryEmailAddress?.emailAddress}</p>
          )}
        </div>
        {variant === 'modal' && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={15} className="text-gray-400" />
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
        {!isLoaded && (
          <div className="px-5 py-8 text-center text-xs text-gray-400">Chargement…</div>
        )}
        {isLoaded && userMemberships.data?.length === 0 && (
          <div className="px-5 py-8 text-center text-xs text-gray-400">Aucune organisation pour le moment.</div>
        )}
        {isLoaded && userMemberships.data?.map(mem => (
          <button key={mem.id} onClick={() => { setActive({ organization: mem.organization.id }); onClose?.() }}
            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Building2 size={15} className="text-indigo-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-900 truncate">{mem.organization.name}</p>
              <p className="text-[11px] text-gray-400">{mem.organization.membersCount} membre{mem.organization.membersCount > 1 ? 's' : ''}</p>
            </div>
            <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-gray-100 space-y-1">
        <button onClick={() => { onCreateNew(); onClose?.() }}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-indigo-200 text-indigo-600 text-xs font-medium hover:bg-indigo-50 transition-colors">
          <Plus size={13} />Créer une nouvelle organisation
        </button>
        {variant === 'fullscreen' && (
          <button onClick={() => signOut()} className="w-full text-center text-[11px] text-gray-400 hover:text-gray-600 pt-1 transition-colors">
            Se déconnecter
          </button>
        )}
      </div>
    </div>
  )

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm" onClick={onClose}>
        {panel}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-6">
      {panel}
    </div>
  )
}
