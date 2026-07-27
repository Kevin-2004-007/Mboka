import { useState } from 'react'
import { Search, Plus, X, Truck, Send, Trash2 } from 'lucide-react'
import { Avatar, StatusBadge, formatEur, TableHeader } from '../App'
import { usePurchaseOrders } from '../data/purchaseOrders'

function initialsOf(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

export function LiveProcurement() {
  const { data: orders, loading, error, insert, update, remove } = usePurchaseOrders()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ supplier: '', amount: '', delivery_on: '', items_count: '1' })

  const statuses = ['Tous', 'Brouillon', 'Envoyé', 'Reçu']
  const filtered = orders.filter(po => {
    const matchStatus = statusFilter === 'Tous' || po.status === statusFilter
    const matchSearch = !search || po.supplier.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const monthCount = orders.length
  const engaged = orders.reduce((s, o) => s + Number(o.amount), 0)
  const awaitingDelivery = orders.filter(o => o.status === 'Envoyé').length

  async function handleCreate() {
    if (!form.supplier.trim()) return
    const created = await insert({
      number: `BC-${Date.now()}`,
      supplier: form.supplier.trim(),
      amount: Number(form.amount) || 0,
      ordered_on: new Date().toISOString().slice(0, 10),
      delivery_on: form.delivery_on || null,
      status: 'Brouillon',
      items_count: Number(form.items_count) || 1,
    })
    if (!created) return
    setForm({ supplier: '', amount: '', delivery_on: '', items_count: '1' })
    setShowCreate(false)
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Supprimer ce bon de commande ?')) return
    await remove(id)
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Commandes', value: String(monthCount), color: 'text-gray-900' },
          { label: 'Montant engagé', value: formatEur(engaged), color: 'text-indigo-600' },
          { label: 'En attente de livraison', value: String(awaitingDelivery), color: 'text-amber-600' },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un fournisseur…"
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
          <Plus size={13} />Nouveau bon de commande
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">Nouveau bon de commande</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="Fournisseur"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Montant (€)" type="number"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                <input value={form.items_count} onChange={e => setForm(f => ({ ...f, items_count: e.target.value }))} placeholder="Nb articles" type="number"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Livraison prévue</label>
                <input value={form.delivery_on} onChange={e => setForm(f => ({ ...f, delivery_on: e.target.value }))} type="date"
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
          <TableHeader cols={['N° BC', 'Fournisseur', 'Articles', 'Montant', 'Date', 'Livraison prévue', 'Statut', '']} />
          <tbody>
            {filtered.map((po, i) => (
              <tr key={po.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                <td className="px-4 py-3 font-mono text-gray-500 font-medium text-[11px]">{po.number}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar initials={initialsOf(po.supplier)} size="sm" />
                    <span className="font-medium text-gray-900">{po.supplier}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{po.items_count} articles</td>
                <td className="px-4 py-3 font-semibold text-gray-900 tabular-nums">{formatEur(Number(po.amount))}</td>
                <td className="px-4 py-3 text-gray-400">{formatDate(po.ordered_on)}</td>
                <td className="px-4 py-3 text-gray-400">{formatDate(po.delivery_on)}</td>
                <td className="px-4 py-3"><StatusBadge status={po.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {po.status === 'Brouillon' && (
                      <button onClick={() => update(po.id, { status: 'Envoyé' })} className="flex items-center gap-1 text-[11px] px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium hover:bg-blue-100 transition-colors">
                        <Send size={10} />Envoyer
                      </button>
                    )}
                    {po.status === 'Envoyé' && (
                      <button onClick={() => update(po.id, { status: 'Reçu' })} className="flex items-center gap-1 text-[11px] px-2 py-1 bg-green-50 text-green-700 rounded-md font-medium hover:bg-green-100 transition-colors">
                        <Truck size={10} />Réceptionner
                      </button>
                    )}
                    <button onClick={() => handleDelete(po.id)} className="p-1 rounded hover:bg-red-50 transition-colors"><Trash2 size={14} className="text-gray-300 hover:text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Aucun bon de commande pour l'instant.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
