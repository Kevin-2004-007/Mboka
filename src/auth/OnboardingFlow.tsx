import { useState } from 'react'
import { useOrganizationList, useOrganization } from '@clerk/react'
import { CheckCircle, Trash2, Plus, Building2 } from 'lucide-react'
import { navItems, ALWAYS_ON_MODULES, type Module } from '../modules'
import { isSupabaseConfigured } from '../lib/supabase'
import { useOrgSettings } from '../data/orgSettings'

const steps = ['Organisation', 'Équipe', 'Modules'] as const

const roleOptions = [
  { value: 'org:admin', label: 'Admin' },
  { value: 'org:member', label: 'Membre' },
]

function StepHeader({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
              done ? 'bg-green-500 text-white' : active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {done ? <CheckCircle size={13} /> : n}
            </div>
            <span className={`text-xs font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
            {n < steps.length && <div className={`h-px flex-1 ${done ? 'bg-green-200' : 'bg-gray-100'}`} />}
          </div>
        )
      })}
    </div>
  )
}

export function OnboardingFlow({ onFinish, onCancel }: { onFinish: () => void; onCancel?: () => void }) {
  const { createOrganization, setActive } = useOrganizationList()
  const { organization } = useOrganization()
  const { setModules: persistActiveModules } = useOrgSettings()

  const [step, setStep] = useState(1)
  const [creating, setCreating] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [orgSize, setOrgSize] = useState('1-10')
  const [orgSector, setOrgSector] = useState('Tech / SaaS')

  const [invites, setInvites] = useState([{ email: '', role: 'org:member' }])
  const [sending, setSending] = useState(false)

  const [activeModules, setActiveModules] = useState<Module[]>(navItems.map(m => m.id))

  async function handleCreateOrg() {
    if (!orgName.trim() || !createOrganization || !setActive) return
    setCreating(true)
    try {
      const org = await createOrganization({ name: orgName.trim() })
      await setActive({ organization: org.id })
      setStep(2)
    } finally {
      setCreating(false)
    }
  }

  async function handleSendInvites() {
    if (!organization) { setStep(3); return }
    setSending(true)
    try {
      const valid = invites.filter(i => i.email.trim())
      await Promise.all(valid.map(i => organization.inviteMember({ emailAddress: i.email.trim(), role: i.role })))
    } finally {
      setSending(false)
      setStep(3)
    }
  }

  async function handleFinish() {
    if (organization && isSupabaseConfigured) {
      await persistActiveModules(activeModules)
    }
    onFinish()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
        <StepHeader current={step} />

        {step === 1 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Créer votre organisation</h2>
            <p className="text-xs text-gray-400 mb-5">C'est l'espace de travail que votre équipe partagera.</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Nom de l'organisation</label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Acme Corp"
                    className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Taille de l'effectif</label>
                  <select value={orgSize} onChange={e => setOrgSize(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white text-gray-700">
                    {['1-10', '11-50', '51-200', '200+'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Secteur</label>
                  <select value={orgSector} onChange={e => setOrgSector(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white text-gray-700">
                    {['Tech / SaaS', 'Finance', 'Industrie', 'Commerce', 'Services', 'Autre'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              {onCancel && (
                <button onClick={onCancel} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Retour</button>
              )}
              <button onClick={handleCreateOrg} disabled={!orgName.trim() || creating}
                className="flex-1 px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {creating ? 'Création…' : 'Continuer'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Inviter votre équipe</h2>
            <p className="text-xs text-gray-400 mb-5">Vous pourrez inviter d'autres membres plus tard depuis les Paramètres.</p>
            <div className="space-y-2">
              {invites.map((inv, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="email" value={inv.email} placeholder="prenom.nom@entreprise.fr"
                    onChange={e => setInvites(prev => prev.map((r, j) => j === i ? { ...r, email: e.target.value } : r))}
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                  <select value={inv.role} onChange={e => setInvites(prev => prev.map((r, j) => j === i ? { ...r, role: e.target.value } : r))}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                    {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <button onClick={() => setInvites(prev => prev.filter((_, j) => j !== i))}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                </div>
              ))}
              <button onClick={() => setInvites(prev => [...prev, { email: '', role: 'org:member' }])}
                className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-gray-200 text-gray-400 text-xs font-medium rounded-lg hover:border-indigo-300 hover:text-indigo-500 transition-colors">
                <Plus size={12} />Ajouter un membre
              </button>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setStep(3)} className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Passer cette étape</button>
              <button onClick={handleSendInvites} disabled={sending}
                className="flex-1 px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {sending ? 'Envoi…' : 'Envoyer les invitations'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Choisir les modules actifs</h2>
            <p className="text-xs text-gray-400 mb-5">Vous pourrez activer ou désactiver des modules à tout moment.</p>
            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {navItems.map(item => {
                const locked = ALWAYS_ON_MODULES.includes(item.id)
                const checked = locked || activeModules.includes(item.id)
                return (
                  <button key={item.id} disabled={locked}
                    onClick={() => setActiveModules(prev => prev.includes(item.id) ? prev.filter(m => m !== item.id) : [...prev, item.id])}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                      checked ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 hover:bg-gray-50'
                    } ${locked ? 'cursor-default opacity-70' : ''}`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${checked ? 'bg-indigo-600' : 'border-2 border-gray-200'}`}>
                      {checked && <CheckCircle size={11} className="text-white" />}
                    </div>
                    <item.Icon size={13} className={checked ? 'text-indigo-500' : 'text-gray-400'} />
                    <span className="text-xs text-gray-700 flex-1 truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>
            <button onClick={handleFinish}
              className="w-full mt-6 py-2.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              Terminer et accéder au Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
