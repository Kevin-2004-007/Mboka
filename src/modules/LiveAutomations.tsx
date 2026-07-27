import { useState } from 'react'
import { Zap, ChevronRight, Play, Pause, Trash2, GripVertical, Plus } from 'lucide-react'
import { StatusBadge, triggerModules, availableActions } from '../App'
import { CardSkeleton } from '../ui/Skeleton'
import { useAutomations } from '../data/automations'

const events = ["Création d'un enregistrement", 'Changement de statut', 'Valeur seuil atteinte', "Date d'échéance dépassée"]

export function LiveAutomations() {
  const { data: automations, loading, error, insert, update, remove } = useAutomations()

  const [tab, setTab] = useState<'list' | 'builder'>('list')
  const [name, setName] = useState('Nouvelle automatisation')
  const [triggerModule, setTriggerModule] = useState(triggerModules[0])
  const [event, setEvent] = useState(events[0])
  const [builderActions, setBuilderActions] = useState<string[]>(['Envoyer un e-mail'])
  const [creating, setCreating] = useState(false)

  async function handleActivate() {
    setCreating(true)
    const created = await insert({
      name: name.trim() || 'Nouvelle automatisation',
      trigger_module: triggerModule,
      trigger_description: `${event} (${triggerModule})`,
      actions: builderActions,
      status: 'Actif',
      runs_count: 0,
      last_run_at: null,
    })
    setCreating(false)
    if (!created) return
    setName('Nouvelle automatisation')
    setBuilderActions(['Envoyer un e-mail'])
    setTab('list')
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Supprimer cette automatisation ?')) return
    await remove(id)
  }

  function lastRunLabel(value: string | null) {
    if (!value) return 'Jamais'
    const diffMs = Date.now() - new Date(value).getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    if (hours < 1) return "à l'instant"
    if (hours < 24) return `il y a ${hours}h`
    return `il y a ${Math.floor(hours / 24)}j`
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit mb-6">
        {(['list', 'builder'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'list' ? 'Automatisations actives' : 'Créer une automatisation'}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <div>
          <p className="text-[11px] text-gray-400 mb-4">Les automatisations sont enregistrées ici mais ne sont pas encore exécutées automatiquement — il n'y a pas de moteur de déclenchement branché sur ce prototype.</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Automatisations actives', value: String(automations.filter(a => a.status === 'Actif').length), color: 'text-green-600' },
              { label: 'Exécutions', value: String(automations.reduce((s, a) => s + a.runs_count, 0)), color: 'text-indigo-600' },
              { label: 'En pause', value: String(automations.filter(a => a.status === 'Pausé').length), color: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {automations.map(auto => (
              <div key={auto.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${auto.status === 'Actif' ? 'bg-green-500' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-semibold text-gray-900">{auto.name}</p>
                      <StatusBadge status={auto.status} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                        <Zap size={10} />{auto.trigger_description}
                      </div>
                      <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
                      {auto.actions.map((action, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-[11px] font-medium">{action}</div>
                          {i < auto.actions.length - 1 && <ChevronRight size={12} className="text-gray-300" />}
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">{auto.runs_count} exécution{auto.runs_count !== 1 ? 's' : ''} · Dernière : {lastRunLabel(auto.last_run_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => update(auto.id, { status: auto.status === 'Actif' ? 'Pausé' : 'Actif' })}
                      className={`p-1.5 rounded-lg border transition-colors ${auto.status === 'Actif' ? 'border-amber-100 bg-amber-50 text-amber-600 hover:bg-amber-100' : 'border-green-100 bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {auto.status === 'Actif' ? <Pause size={13} /> : <Play size={13} />}
                    </button>
                    <button onClick={() => handleDelete(auto.id)} className="p-1.5 rounded-lg border border-gray-100 hover:bg-red-50 transition-colors"><Trash2 size={13} className="text-gray-400 hover:text-red-400" /></button>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <>
                <CardSkeleton className="h-20" />
                <CardSkeleton className="h-20" />
              </>
            )}
            {!loading && automations.length === 0 && (
              <p className="text-center text-gray-400 py-10 text-xs">Aucune automatisation pour l'instant.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'builder' && (
        <div className="max-w-3xl">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <input value={name} onChange={e => setName(e.target.value)}
                className="text-sm font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-400 focus:outline-none pb-0.5 w-full transition-colors" />
              <p className="text-xs text-gray-400 mt-0.5">Définissez un déclencheur puis enchaînez les actions</p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">1</span>
                  <p className="text-xs font-semibold text-gray-700">Déclencheur</p>
                </div>
                <div className="ml-7 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-500 mb-1 block">Module source</label>
                    <select value={triggerModule} onChange={e => setTriggerModule(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                      {triggerModules.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 mb-1 block">Événement</label>
                    <select value={event} onChange={e => setEvent(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                      {events.map(e => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="ml-7 flex items-center gap-2">
                <div className="w-px h-6 bg-gray-200 ml-2.5" />
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Alors</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">2</span>
                  <p className="text-xs font-semibold text-gray-700">Actions</p>
                </div>
                <div className="ml-7 space-y-2">
                  {builderActions.map((action, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                        <GripVertical size={12} className="text-indigo-300 cursor-grab" />
                        <select value={action} onChange={e => setBuilderActions(prev => prev.map((a, j) => j === i ? e.target.value : a))}
                          className="flex-1 text-xs bg-transparent text-indigo-700 font-medium focus:outline-none">
                          {availableActions.map(a => <option key={a}>{a}</option>)}
                        </select>
                      </div>
                      <button onClick={() => setBuilderActions(prev => prev.filter((_, j) => j !== i))}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                    </div>
                  ))}
                  <button onClick={() => setBuilderActions(prev => [...prev, 'Envoyer un e-mail'])}
                    className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-indigo-200 text-indigo-500 text-xs font-medium rounded-lg hover:bg-indigo-50 transition-colors">
                    <Plus size={12} />Ajouter une action
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 space-y-3">
              {error && (
                <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
              )}
              <button onClick={handleActivate} disabled={creating}
                className="w-full py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {creating ? 'Activation…' : 'Activer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
