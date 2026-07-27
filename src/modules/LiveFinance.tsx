import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { Avatar, formatEur, TableHeader } from '../App'
import { useInvoices } from '../data/invoices'

const statusOptions = ['En attente', 'Payée', 'En retard']

function initialsOf(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

export function LiveFinance() {
  const { data: invoices, loading, error, insert, update, remove } = useInvoices()
  const [statusFilter, setStatusFilter] = useState('Toutes')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ number: '', client: '', amount: '', due_on: '' })

  const statuses = ['Toutes', ...statusOptions]
  const filtered = invoices.filter(inv => statusFilter === 'Toutes' || inv.status === statusFilter)

  const totalEmis = invoices.reduce((s, i) => s + Number(i.amount), 0)
  const totalEnAttente = invoices.filter(i => i.status === 'En attente').reduce((s, i) => s + Number(i.amount), 0)
  const totalEnRetard = invoices.filter(i => i.status === 'En retard').reduce((s, i) => s + Number(i.amount), 0)

  async function handleCreate() {
    if (!form.client.trim() || !form.amount) return
    const created = await insert({
      number: form.number.trim() || `FCT-${Date.now()}`,
      client: form.client.trim(),
      amount: Number(form.amount) || 0,
      issued_on: new Date().toISOString().slice(0, 10),
      due_on: form.due_on || null,
      status: 'En attente',
    })
    if (!created) return
    setForm({ number: '', client: '', amount: '', due_on: '' })
    setShowCreate(false)
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Supprimer cette facture ?')) return
    await remove(id)
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total émis', value: formatEur(totalEmis), color: 'text-gray-900' },
          { label: 'En attente', value: formatEur(totalEnAttente), color: 'text-amber-600' },
          { label: 'En retard', value: formatEur(totalEnRetard), color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>{s}</button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors ml-auto">
          <Plus size={13} />Nouvelle facture
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">Nouvelle facture</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="Client"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
              <input value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="N° facture (auto si vide)"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
              <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Montant (€)" type="number"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Échéance</label>
                <input value={form.due_on} onChange={e => setForm(f => ({ ...f, due_on: e.target.value }))} type="date"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-gray-700" />
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
          <TableHeader cols={['N° Facture', 'Client', 'Montant', 'Date', 'Échéance', 'Statut', '']} />
          <tbody>
            {filtered.map((inv, i) => (
              <tr key={inv.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                <td className="px-4 py-3 font-mono text-gray-500 font-medium text-[11px]">{inv.number}</td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar initials={initialsOf(inv.client)} size="sm" /><span className="font-medium text-gray-900">{inv.client}</span></div></td>
                <td className="px-4 py-3 font-semibold text-gray-900 tabular-nums">{formatEur(Number(inv.amount))}</td>
                <td className="px-4 py-3 text-gray-400">{formatDate(inv.issued_on)}</td>
                <td className="px-4 py-3 text-gray-400">{formatDate(inv.due_on)}</td>
                <td className="px-4 py-3">
                  <select value={inv.status} onChange={e => update(inv.id, { status: e.target.value })}
                    className="text-[11px] border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3"><button onClick={() => handleDelete(inv.id)} className="p-1 rounded hover:bg-red-50 transition-colors"><Trash2 size={14} className="text-gray-300 hover:text-red-400" /></button></td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Aucune facture pour l'instant.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
