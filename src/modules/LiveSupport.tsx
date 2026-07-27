import { useState } from 'react'
import { Search, Plus, Trash2, X } from 'lucide-react'
import { Avatar, StatusBadge, TableHeader } from '../App'
import { useTickets } from '../data/tickets'

const statusOptions = ['Ouvert', 'En cours', 'Résolu', 'Fermé']
const priorityOptions = ['Basse', 'Normale', 'Haute', 'Critique']

function formatDateTime(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function slaLabel(deadline: string | null) {
  if (!deadline) return '—'
  const diffMs = new Date(deadline).getTime() - Date.now()
  if (diffMs <= 0) return 'Dépassé'
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}j ${hours % 24}h`
  return `${hours}h ${Math.floor((diffMs / (1000 * 60)) % 60)}m`
}

export function LiveSupport() {
  const { data: tickets, loading, error, insert, update, remove } = useTickets()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ subject: '', client: '', assignee: '', priority: 'Normale' })

  const statuses = ['Tous', ...statusOptions]
  const filtered = tickets.filter(t => {
    const matchStatus = statusFilter === 'Tous' || t.status === statusFilter
    const matchSearch = !search || t.subject.toLowerCase().includes(search.toLowerCase()) || (t.client ?? '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const resolvedThisWeek = tickets.filter(t => t.status === 'Résolu' && new Date(t.sla_deadline ?? 0).getTime() > oneWeekAgo).length

  async function handleCreate() {
    if (!form.subject.trim()) return
    const created = await insert({
      number: `TKT-${Date.now()}`,
      subject: form.subject.trim(),
      client: form.client.trim() || null,
      assignee: form.assignee.trim() || null,
      priority: form.priority,
      status: 'Ouvert',
      sla_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    })
    if (!created) return
    setForm({ subject: '', client: '', assignee: '', priority: 'Normale' })
    setShowCreate(false)
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Supprimer ce ticket ?')) return
    await remove(id)
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Ouverts', value: String(tickets.filter(t => t.status === 'Ouvert').length), color: 'text-red-600' },
          { label: 'En cours', value: String(tickets.filter(t => t.status === 'En cours').length), color: 'text-blue-600' },
          { label: 'Résolus cette semaine', value: String(resolvedThisWeek), color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un ticket…"
            className="pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-52 placeholder:text-gray-400" />
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>{s}</button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors ml-auto">
          <Plus size={13} />Nouveau ticket
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">Nouveau ticket</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Sujet"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
              <input value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="Client"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} placeholder="Assigné (initiales)"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                  {priorityOptions.map(p => <option key={p}>{p}</option>)}
                </select>
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

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <TableHeader cols={['ID', 'Sujet', 'Client', 'Priorité', 'Statut', 'SLA restant', 'Assigné', 'Créé le', '']} />
          <tbody>
            {filtered.map((tkt, i) => (
              <tr key={tkt.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                <td className="px-4 py-3 font-mono text-gray-400 text-[11px]">{tkt.number}</td>
                <td className="px-4 py-3 font-medium text-gray-900 max-w-[220px] truncate">{tkt.subject}</td>
                <td className="px-4 py-3 text-gray-600">{tkt.client ?? '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={tkt.priority} /></td>
                <td className="px-4 py-3">
                  <select value={tkt.status} onChange={e => update(tkt.id, { status: e.target.value })}
                    className="text-[11px] border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className={`px-4 py-3 font-medium tabular-nums ${tkt.priority === 'Critique' || tkt.priority === 'Haute' ? 'text-red-600' : 'text-gray-500'}`}>{slaLabel(tkt.sla_deadline)}</td>
                <td className="px-4 py-3">
                  {tkt.assignee ? <Avatar initials={tkt.assignee} size="sm" /> : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDateTime(tkt.created_at)}</td>
                <td className="px-4 py-3"><button onClick={() => handleDelete(tkt.id)} className="p-1 rounded hover:bg-red-50 transition-colors"><Trash2 size={14} className="text-gray-300 hover:text-red-400" /></button></td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">Aucun ticket pour l'instant.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
