import { useState } from 'react'
import { Boxes, AlertCircle, AlertTriangle, TrendingUp, Plus, X, Settings2 } from 'lucide-react'
import { StatusBadge, formatEur, TableHeader } from '../App'
import { useStockItems, stockStatus } from '../data/stockItems'
import type { TableRow } from '../lib/useSupabaseTable'
import type { StockItem } from '../data/types'

export function LiveStock() {
  const { data: items, loading, error, insert, update } = useStockItems()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ ref: '', name: '', qty: '0', warehouse: '', min_qty: '0', value: '0' })
  const [adjusting, setAdjusting] = useState<TableRow<StockItem> | null>(null)
  const [delta, setDelta] = useState('0')

  const ruptures = items.filter(i => stockStatus(i.qty, i.min_qty) === 'Rupture').length
  const faible = items.filter(i => stockStatus(i.qty, i.min_qty) === 'Stock faible').length
  const totalValue = items.reduce((s, i) => s + Number(i.value), 0)

  async function handleCreate() {
    if (!form.ref.trim() || !form.name.trim()) return
    const created = await insert({
      ref: form.ref.trim(),
      name: form.name.trim(),
      qty: Number(form.qty) || 0,
      warehouse: form.warehouse.trim() || null,
      min_qty: Number(form.min_qty) || 0,
      value: Number(form.value) || 0,
    })
    if (!created) return
    setForm({ ref: '', name: '', qty: '0', warehouse: '', min_qty: '0', value: '0' })
    setShowCreate(false)
  }

  async function handleAdjust() {
    if (!adjusting) return
    const newQty = Math.max(0, adjusting.qty + (Number(delta) || 0))
    await update(adjusting.id, { qty: newQty })
    setAdjusting(null)
    setDelta('0')
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Références totales', value: String(items.length), color: 'text-gray-900', icon: Boxes },
          { label: 'Alertes rupture', value: String(ruptures), color: 'text-red-600', icon: AlertCircle },
          { label: 'Stock faible', value: String(faible), color: 'text-amber-600', icon: AlertTriangle },
          { label: 'Valeur totale stock', value: formatEur(totalValue), color: 'text-indigo-600', icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color === 'text-red-600' ? 'bg-red-50' : s.color === 'text-amber-600' ? 'bg-amber-50' : s.color === 'text-indigo-600' ? 'bg-indigo-50' : 'bg-gray-50'}`}>
              <s.icon size={16} className={s.color} />
            </div>
            <div>
              <p className="text-[11px] text-gray-500">{s.label}</p>
              <p className={`text-lg font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus size={13} />Nouvelle référence
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <TableHeader cols={['Référence', 'Produit', 'Quantité', 'Seuil min.', 'Entrepôt', 'Valeur', 'Statut', '']} />
          <tbody>
            {items.map((item, i) => {
              const status = stockStatus(item.qty, item.min_qty)
              return (
                <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i === items.length - 1 ? 'border-0' : ''}`}>
                  <td className="px-4 py-3 font-mono text-gray-400 text-[11px]">{item.ref}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[220px] truncate">{item.name}</td>
                  <td className={`px-4 py-3 font-semibold tabular-nums ${item.qty === 0 ? 'text-red-600' : item.qty <= item.min_qty ? 'text-amber-600' : 'text-gray-900'}`}>{item.qty}</td>
                  <td className="px-4 py-3 text-gray-400">{item.min_qty}</td>
                  <td className="px-4 py-3 text-gray-500">{item.warehouse ?? '—'}</td>
                  <td className="px-4 py-3 tabular-nums text-gray-600">{formatEur(Number(item.value))}</td>
                  <td className="px-4 py-3"><StatusBadge status={status} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setAdjusting(item); setDelta('0') }} className="p-1 rounded hover:bg-gray-100 transition-colors"><Settings2 size={14} className="text-gray-400" /></button>
                  </td>
                </tr>
              )
            })}
            {!loading && items.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Aucune référence pour l'instant.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">Nouvelle référence</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={form.ref} onChange={e => setForm(f => ({ ...f, ref: e.target.value }))} placeholder="Référence"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                <input value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))} placeholder="Entrepôt"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
              </div>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom du produit"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
              <div className="grid grid-cols-3 gap-3">
                <input value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="Qté" type="number"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                <input value={form.min_qty} onChange={e => setForm(f => ({ ...f, min_qty: e.target.value }))} placeholder="Seuil min." type="number"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="Valeur (€)" type="number"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
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

      {adjusting && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setAdjusting(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">Mouvement de stock — {adjusting.name}</h3>
              <button onClick={() => setAdjusting(null)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} className="text-gray-400" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-2">Quantité actuelle : <span className="font-semibold text-gray-900">{adjusting.qty}</span></p>
            <label className="text-[11px] text-gray-500 mb-1 block">Ajustement (+ entrée / - sortie)</label>
            <input value={delta} onChange={e => setDelta(e.target.value)} type="number"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
            <div className="flex gap-2 mt-6">
              <button onClick={() => setAdjusting(null)} className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Annuler</button>
              <button onClick={handleAdjust} className="flex-1 px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">Valider</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
