import { useState } from 'react'
import { useOrganization } from '@clerk/react'
import { Plus, X, PlugZap } from 'lucide-react'
import { StatusBadge, Avatar, TableHeader } from '../App'
import { navItems, ALWAYS_ON_MODULES, type Module } from '../modules'
import { useOrgSettings } from '../data/orgSettings'

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
  const { organization, membership, memberships } = useOrganization({ memberships: true })
  const { activeModules, loading: settingsLoading, setModules } = useOrgSettings()

  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'org:admin' | 'org:member'>('org:member')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [modulesError, setModulesError] = useState<string | null>(null)
  const [settingsTab, setSettingsTab] = useState<'members' | 'modules' | 'integrations'>('members')

  const members = memberships?.data ?? []
  const selectedModules = activeModules ?? navItems.map(m => m.id)

  async function handleInvite() {
    if (!inviteEmail.trim() || !organization) return
    setInviting(true)
    setInviteError(null)
    try {
      await organization.inviteMember({ emailAddress: inviteEmail.trim(), role: inviteRole })
      setInviteEmail('')
      setShowInvite(false)
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Impossible d'envoyer l'invitation.")
    } finally {
      setInviting(false)
    }
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
            <p className="text-xs text-gray-500">{members.length} membre{members.length > 1 ? 's' : ''} dans l'organisation</p>
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
              <TableHeader cols={['Membre', 'Email', 'Rôle', 'Statut']} />
              <tbody>
                {members.map((m, i) => {
                  const name = [m.publicUserData?.firstName, m.publicUserData?.lastName].filter(Boolean).join(' ') || m.publicUserData?.identifier || 'Membre'
                  return (
                    <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i === members.length - 1 ? 'border-0' : ''}`}>
                      <td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar initials={initialsOf(name)} size="md" /><span className="font-medium text-gray-900">{name}</span></div></td>
                      <td className="px-4 py-3 text-gray-500">{m.publicUserData?.identifier ?? '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={m.role === 'org:admin' ? 'Admin' : 'Employé'} /></td>
                      <td className="px-4 py-3"><StatusBadge status="Actif" /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
