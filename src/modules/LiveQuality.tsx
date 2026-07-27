import { useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Plus, X, Trash2, Upload, File as FilePdf, Download } from 'lucide-react'
import { StatusBadge, ProgressBar, Avatar, TableHeader } from '../App'
import { TableSkeleton } from '../ui/Skeleton'
import { useAudits, useAuditChecklistItems } from '../data/audits'

const auditTypes = ['Conformité', 'Qualité', 'Sécurité', 'Finance']

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function initialsOf(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function LiveQuality() {
  const { data: audits, loading, error, insert: insertAudit, update: updateAudit } = useAudits()
  const { data: items, insert: insertItem, update: updateItem } = useAuditChecklistItems()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', type: auditTypes[0], assignee: '', deadline: '' })
  const [checklistDraft, setChecklistDraft] = useState('')
  const [checklistItems, setChecklistItems] = useState<string[]>([])

  const selected = audits.find(a => a.id === selectedId) ?? null
  const selectedItems = selected ? items.filter(i => i.audit_id === selected.id) : []

  async function handleCreate() {
    if (!form.title.trim()) return
    const audit = await insertAudit({
      title: form.title.trim(),
      type: form.type,
      assignee: form.assignee.trim() || null,
      deadline: form.deadline || null,
      status: 'Planifié',
      progress: 0,
      nc_count: 0,
    })
    if (!audit) return
    for (let i = 0; i < checklistItems.length; i++) {
      await insertItem({ audit_id: audit.id, item: checklistItems[i], done: false, nc: false, sort_order: i })
    }
    setForm({ title: '', type: auditTypes[0], assignee: '', deadline: '' })
    setChecklistItems([])
    setShowCreate(false)
  }

  async function toggleItem(itemId: string) {
    if (!selected) return
    const item = items.find(i => i.id === itemId)
    if (!item) return
    await updateItem(itemId, { done: !item.done })
    const others = selectedItems.filter(i => i.id !== itemId)
    const doneCount = others.filter(i => i.done).length + (!item.done ? 1 : 0)
    const progress = selectedItems.length > 0 ? Math.round((doneCount / selectedItems.length) * 100) : 0
    await updateAudit(selected.id, { progress, status: progress === 100 ? 'Clôturé' : 'En cours' })
  }

  if (selected) {
    return (
      <div className="p-6 max-w-4xl">
        <button onClick={() => setSelectedId(null)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-5 transition-colors">
          <ChevronLeft size={14} />Retour à la liste
        </button>
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{selected.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[11px] font-medium">{selected.type}</span>
                    <StatusBadge status={selected.status} />
                  </div>
                </div>
                <ProgressBar value={selected.progress} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-700">Checklist de contrôle</p>
                  <span className="text-[11px] text-gray-400">{selectedItems.filter(c => c.done).length}/{selectedItems.length} points</span>
                </div>
                <div className="space-y-2">
                  {selectedItems.map(item => (
                    <button key={item.id} onClick={() => toggleItem(item.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors ${item.nc ? 'border-red-100 bg-red-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                      <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-green-500' : 'border-2 border-gray-200'}`}>
                        {item.done && <CheckCircle size={12} className="text-white" />}
                      </div>
                      <span className={`text-xs flex-1 ${item.done ? 'text-gray-600' : 'text-gray-800'}`}>{item.item}</span>
                      {item.nc && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">Non-conformité</span>}
                    </button>
                  ))}
                  {selectedItems.length === 0 && <p className="text-xs text-gray-400">Aucun point de contrôle.</p>}
                </div>
              </div>
            </div>

            {selectedItems.some(c => c.nc) && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <p className="text-xs font-semibold text-gray-700 mb-3">Plan d'action</p>
                {selectedItems.filter(c => c.nc).map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg mb-2 last:mb-0">
                    <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-red-700">{item.item}</p>
                      <input placeholder="Décrire l'action corrective…" className="mt-1.5 w-full text-xs bg-white border border-red-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-300/30 placeholder:text-red-300" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-700 mb-3">Informations</p>
              {[
                { label: 'Responsable', value: selected.assignee ?? '—' },
                { label: 'Échéance', value: formatDate(selected.deadline) },
                { label: 'Non-conformités', value: `${selectedItems.filter(i => i.nc).length}` },
                { label: 'Avancement', value: `${selected.progress}%` },
              ].map(info => (
                <div key={info.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-[11px] text-gray-400">{info.label}</span>
                  <span className="text-xs font-medium text-gray-700">{info.value}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-700 mb-1">Preuves documentaires</p>
              <p className="text-[11px] text-gray-400 mb-3">Pas encore de stockage de preuves dans ce prototype.</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg opacity-60">
                  <FilePdf size={13} className="text-gray-400" />
                  <span className="text-[11px] text-gray-500 flex-1 truncate">Aucune preuve jointe</span>
                  <Download size={11} className="text-gray-300" />
                </div>
                <button disabled className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-gray-200 text-xs text-gray-300 rounded-lg cursor-not-allowed">
                  <Upload size={12} />Ajouter une preuve
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Audits en cours', value: String(audits.filter(a => a.status === 'En cours').length), color: 'text-blue-600' },
          { label: 'Clôturés', value: String(audits.filter(a => a.status === 'Clôturé').length), color: 'text-green-600' },
          { label: 'Non-conformités ouvertes', value: String(audits.reduce((s, a) => s + a.nc_count, 0)), color: 'text-red-600' },
          { label: 'Planifiés', value: String(audits.filter(a => a.status === 'Planifié').length), color: 'text-gray-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus size={13} />Nouvel audit
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <TableHeader cols={['Audit', 'Type', 'Responsable', 'Avancement', 'Échéance', 'NC', 'Statut', '']} />
          <tbody>
            {audits.map((audit, i) => (
              <tr key={audit.id} onClick={() => setSelectedId(audit.id)} className={`border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors ${i === audits.length - 1 ? 'border-0' : ''}`}>
                <td className="px-4 py-3 font-medium text-gray-900 max-w-[220px] truncate">{audit.title}</td>
                <td className="px-4 py-3"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[11px] font-medium">{audit.type}</span></td>
                <td className="px-4 py-3">{audit.assignee ? <div className="flex items-center gap-1.5"><Avatar initials={initialsOf(audit.assignee)} size="sm" /><span className="text-gray-600">{audit.assignee.split(' ')[0]}</span></div> : <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3 w-32"><ProgressBar value={audit.progress} /></td>
                <td className="px-4 py-3 text-gray-400">{formatDate(audit.deadline)}</td>
                <td className="px-4 py-3">{audit.nc_count > 0 ? <span className="text-red-600 font-semibold">{audit.nc_count}</span> : <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3"><StatusBadge status={audit.status} /></td>
                <td className="px-4 py-3"><ChevronRight size={14} className="text-gray-300" /></td>
              </tr>
            ))}
            {loading && <TableSkeleton cols={8} />}
            {!loading && audits.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Aucun audit pour l'instant.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">Nouvel audit</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Titre de l'audit"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                  {auditTypes.map(t => <option key={t}>{t}</option>)}
                </select>
                <input value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} placeholder="Responsable"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Échéance</label>
                <input value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} type="date"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-gray-700" />
              </div>
              <label className="text-[11px] text-gray-500 mb-1 block">Points de contrôle</label>
              {checklistItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-2 truncate">{item}</span>
                  <button onClick={() => setChecklistItems(prev => prev.filter((_, j) => j !== i))} className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input value={checklistDraft} onChange={e => setChecklistDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && checklistDraft.trim()) { setChecklistItems(prev => [...prev, checklistDraft.trim()]); setChecklistDraft('') } }}
                  placeholder="Ajouter un point de contrôle…"
                  className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                <button onClick={() => { if (checklistDraft.trim()) { setChecklistItems(prev => [...prev, checklistDraft.trim()]); setChecklistDraft('') } }}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"><Plus size={14} className="text-gray-500" /></button>
              </div>
            </div>
            {error && (
              <p className="mt-3 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Annuler</button>
              <button onClick={handleCreate} className="flex-1 px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
