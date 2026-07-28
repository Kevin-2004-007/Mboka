import { useState } from 'react'
import { useOrganization, useSession } from '@clerk/react'
import { Plus, X, PlugZap, SlidersHorizontal } from 'lucide-react'
import { StatusBadge, Avatar, TableHeader } from '../App'
import { navItems, ALWAYS_ON_MODULES, type Module } from '../modules'
import { useOrgSettings } from '../data/orgSettings'
import { useMemberModuleAccess } from '../data/memberModuleAccess'

const integrations = [
  { name: 'Stripe Billing', desc: 'Paiements et abonnements', status: 'Non configuré', color: 'text-gray-400 bg-gray-100' },
  { name: 'Pennylane', desc: 'Synchronisation comptable', status: 'Non configuré', color: 'text-gray-400 bg-gray-100' },
  { name: 'Resend', desc: "Envoi d'e-mails transactionnels", status: 'Non configuré', color: 'text-gray-400 bg-gray-100' },
  { name: 'Slack', desc: 'Notifications et alertes', status: 'Non configuré', color: 'text-gray-400 bg-gray-100' },
  { name: 'Zapier', desc: 'Automatisations inter-outils', status: 'Non configuré', color: 'text-gray-400 bg-gray-100' },
]

function initialsOf(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function LiveSettings() {
  const { organization, membership, memberships, invitations } = useOrganization({
    memberships: true,
    invitations: { status: ['pending'] },
  })
  const { activeModules, loading: settingsLoading, setModules } = useOrgSettings()
  const { rows: moduleAccessRows, setAccess } = useMemberModuleAccess()
  const { session } = useSession()

  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'org:admin' | 'org:member'>('org:member')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [modulesError, setModulesError] = useState<string | null>(null)
  const [settingsTab, setSettingsTab] = useState<'members' | 'modules' | 'integrations'>('members')
  const [editingAccessId, setEditingAccessId] = useState<string | null>(null)
  const [editModules, setEditModules] = useState<Module[]>([])
  const [accessError, setAccessError] = useState<string | null>(null)
  const [savingAccess, setSavingAccess] = useState(false)

  const members = memberships?.data ?? []
  const pendingInvitations = invitations?.data ?? []
  const selectedModules = activeModules ?? navItems.map(m => m.id)
  const toggleableModules = navItems.filter(item => !ALWAYS_ON_MODULES.includes(item.id) && selectedModules.includes(item.id))

  function openAccessEditor(userId: string) {
    const restriction = moduleAccessRows.find(r => r.user_id === userId)
    setEditModules(restriction ? (restriction.modules as Module[]) : toggleableModules.map(m => m.id))
    setAccessError(null)
    setEditingAccessId(userId)
  }

  async function handleSaveAccess() {
    if (!editingAccessId) return
    setSavingAccess(true)
    setAccessError(null)
    try {
      const isFullAccess = toggleableModules.every(m => editModules.includes(m.id))
      await setAccess(editingAccessId, isFullAccess ? null : editModules)
      setEditingAccessId(null)
    } catch (err) {
      setAccessError(err instanceof Error ? err.message : "Impossible d'enregistrer ces accès.")
    } finally {
      setSavingAccess(false)
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !organization || !session) return
    setInviting(true)
    setInviteError(null)
    try {
      const token = await session.getToken()
      // Routed through a Netlify Function (not organization.inviteMember())
      // because only Clerk's Backend API can set redirectUrl on an
      // invitation — the frontend SDK can't, which is why invitations used
      // to land on Clerk's Account Portal instead of back in MBOKA.
      const res = await fetch('/.netlify/functions/invite-member', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ emailAddress: inviteEmail.trim(), role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Impossible d'envoyer l'invitation.")
      await invitations?.revalidate?.()
      setInviteEmail('')
      setShowInvite(false)
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Impossible d'envoyer l'invitation.")
    } finally {
      setInviting(false)
    }
  }

  async function handleRevoke(invitationId: string) {
    const invitation = pendingInvitations.find(i => i.id === invitationId)
    if (!invitation || !window.confirm("Révoquer cette invitation ?")) return
    await invitation.revoke()
    await invitations?.revalidate?.()
  }

  async function toggleModule(id: Module) {
    if (ALWAYS_ON_MODULES.includes(id)) return
    const next = selectedModules.includes(id) ? selectedModules.filter(m => m !== id) : [...selectedModules, id]
    setModulesError(null)
    try {
      await setModules(next)
    } catch (err) {
      setModulesError(err instanceof Error ? err.message : "Impossible d'enregistrer ce changement.")
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit mb-6">
        {(['members', 'modules', 'integrations'] as const).map(t => (
          <button key={t} onClick={() => setSettingsTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${settingsTab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'members' ? 'Membres & rôles' : t === 'modules' ? 'Modules actifs' : 'Intégrations'}
          </button>
        ))}
      </div>

      {settingsTab === 'members' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-500">
              {members.length} membre{members.length > 1 ? 's' : ''} dans l'organisation
              {pendingInvitations.length > 0 && ` · ${pendingInvitations.length} invitation${pendingInvitations.length > 1 ? 's' : ''} en attente`}
            </p>
            {membership?.role === 'org:admin' && (
              <button onClick={() => setShowInvite(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                <Plus size={13} />Inviter un membre
              </button>
            )}
          </div>

          {showInvite && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowInvite(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-gray-900">Inviter un membre</h3>
                  <button onClick={() => setShowInvite(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} className="text-gray-400" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">Adresse email</label>
                    <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="prenom.nom@entreprise.fr"
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">Rôle</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([{ value: 'org:admin', label: 'Admin' }, { value: 'org:member', label: 'Membre' }] as const).map(r => (
                        <button key={r.value} onClick={() => setInviteRole(r.value)}
                          className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${inviteRole === r.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{r.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
                {inviteError && (
                  <p className="mt-3 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{inviteError}</p>
                )}
                <div className="flex gap-2 mt-6">
                  <button onClick={() => setShowInvite(false)} className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Annuler</button>
                  <button onClick={handleInvite} disabled={!inviteEmail.trim() || inviting}
                    className="flex-1 px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                    {inviting ? 'Envoi…' : "Envoyer l'invitation"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-xs">
              <TableHeader cols={['Membre', 'Email', 'Rôle', 'Statut', '']} />
              <tbody>
                {members.map((m, i) => {
                  const name = [m.publicUserData?.firstName, m.publicUserData?.lastName].filter(Boolean).join(' ') || m.publicUserData?.identifier || 'Membre'
                  const isLast = i === members.length - 1 && pendingInvitations.length === 0
                  const userId = m.publicUserData?.userId
                  const restricted = userId ? moduleAccessRows.some(r => r.user_id === userId) : false
                  return (
                    <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${isLast ? 'border-0' : ''}`}>
                      <td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar initials={initialsOf(name)} size="md" /><span className="font-medium text-gray-900">{name}</span></div></td>
                      <td className="px-4 py-3 text-gray-500">{m.publicUserData?.identifier ?? '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={m.role === 'org:admin' ? 'Admin' : 'Employé'} /></td>
                      <td className="px-4 py-3"><StatusBadge status="Actif" /></td>
                      <td className="px-4 py-3">
                        {membership?.role === 'org:admin' && userId && (
                          <button onClick={() => openAccessEditor(userId)}
                            className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${restricted ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'}`}>
                            <SlidersHorizontal size={11} />{restricted ? 'Modules restreints' : 'Modules'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {pendingInvitations.map((inv, i) => (
                  <tr key={inv.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i === pendingInvitations.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar initials={initialsOf(inv.emailAddress)} size="md" /><span className="font-medium text-gray-400 italic">Invitation envoyée</span></div></td>
                    <td className="px-4 py-3 text-gray-500">{inv.emailAddress}</td>
                    <td className="px-4 py-3"><StatusBadge status={inv.role === 'org:admin' ? 'Admin' : 'Employé'} /></td>
                    <td className="px-4 py-3"><StatusBadge status="En attente" /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleRevoke(inv.id)} className="text-[11px] text-gray-400 hover:text-red-500 transition-colors">Révoquer</button>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && pendingInvitations.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Aucun membre pour l'instant.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {editingAccessId && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setEditingAccessId(null)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">Modules accessibles</h3>
                  <button onClick={() => setEditingAccessId(null)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} className="text-gray-400" /></button>
                </div>
                <p className="text-[11px] text-gray-400 mb-4">Dashboard et Paramètres restent toujours accessibles. Tout cocher revient à ne poser aucune restriction.</p>
                <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                  {toggleableModules.map(item => {
                    const checked = editModules.includes(item.id)
                    return (
                      <button key={item.id}
                        onClick={() => setEditModules(prev => checked ? prev.filter(m => m !== item.id) : [...prev, item.id])}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-colors ${checked ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <item.Icon size={14} className={checked ? 'text-indigo-500' : 'text-gray-400'} />
                        <span className="text-xs text-gray-700 flex-1 truncate">{item.label}</span>
                        <span className={`w-8 h-4 rounded-full transition-colors flex items-center ${checked ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                          <span className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform mx-0.5 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
                        </span>
                      </button>
                    )
                  })}
                </div>
                {accessError && (
                  <p className="mt-3 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{accessError}</p>
                )}
                <div className="flex gap-2 mt-6">
                  <button onClick={() => setEditingAccessId(null)} className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Annuler</button>
                  <button onClick={handleSaveAccess} disabled={savingAccess}
                    className="flex-1 px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                    {savingAccess ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {settingsTab === 'modules' && (
        <div>
          <p className="text-xs text-gray-500 mb-4">
            Choisissez les modules accessibles pour cette organisation. Dashboard et Paramètres sont toujours actifs.
            {settingsLoading && ' (chargement…)'}
          </p>
          {modulesError && (
            <p className="mb-4 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{modulesError}</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {navItems.map(item => {
              const locked = ALWAYS_ON_MODULES.includes(item.id)
              const checked = locked || selectedModules.includes(item.id)
              return (
                <button key={item.id} disabled={locked} onClick={() => toggleModule(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-colors ${checked ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 hover:bg-gray-50'} ${locked ? 'cursor-default opacity-70' : ''}`}>
                  <item.Icon size={14} className={checked ? 'text-indigo-500' : 'text-gray-400'} />
                  <span className="text-xs text-gray-700 flex-1 truncate">{item.label}</span>
                  <span className={`w-8 h-4 rounded-full transition-colors flex items-center ${checked ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                    <span className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform mx-0.5 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {settingsTab === 'integrations' && (
        <div className="space-y-3">
          {integrations.map(intg => (
            <div key={intg.name} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${intg.color}`}>
                <PlugZap size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{intg.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{intg.desc}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  <span className="text-xs font-medium text-gray-400">{intg.status}</span>
                </div>
                <button className="px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
                  Connecter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
