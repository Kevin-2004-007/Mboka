import { useState } from 'react'
import { Plus, MoreHorizontal, X } from 'lucide-react'
import { Avatar, formatEur, dealColumns, columnColors, type DealStatus } from '../App'
import { useDeals } from '../data/deals'

function initialsOf(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export function LiveCRM() {
  const { data: deals, loading, error, insert, update, remove } = useDeals()
  const [addingIn, setAddingIn] = useState<DealStatus | null>(null)
  const [form, setForm] = useState({ company: '', amount: '', contact: '' })

  async function handleCreate(stage: DealStatus) {
    if (!form.company.trim()) return
    const created = await insert({ company: form.company.trim(), amount: Number(form.amount) || 0, contact: form.contact.trim() || null, stage })
    if (!created) return
    setForm({ company: '', amount: '', contact: '' })
    setAddingIn(null)
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Supprimer ce deal ?')) return
    await remove(id)
  }

  return (
    <div className="p-6 overflow-x-auto">
      {loading && deals.length === 0 && <p className="text-xs text-gray-400 mb-3">Chargement du pipeline…</p>}
      <div className="flex gap-4 min-w-max">
        {dealColumns.map(col => {
          const colDeals = deals.filter(d => d.stage === col)
          const total = colDeals.reduce((sum, d) => sum + Number(d.amount), 0)
          return (
            <div key={col} className="w-64 flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${columnColors[col]}`}>{col}</span>
                  <span className="text-xs text-gray-400 font-medium">{colDeals.length}</span>
                </div>
                <span className="text-[11px] text-gray-400 font-medium">{formatEur(total)}</span>
              </div>
              {colDeals.map(deal => (
                <div key={deal.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-xs font-semibold text-gray-900 leading-snug">{deal.company}</p>
                    <button onClick={() => handleDelete(deal.id)} className="p-0.5 rounded hover:bg-red-50 transition-colors flex-shrink-0">
                      <MoreHorizontal size={13} className="text-gray-300 hover:text-red-400" />
                    </button>
                  </div>
                  <p className="text-base font-bold text-gray-900">{formatEur(Number(deal.amount))}</p>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                    {deal.contact && <Avatar initials={initialsOf(deal.contact)} size="sm" />}
                    <span className="text-[11px] text-gray-500 flex-1 truncate">{deal.contact ?? '—'}</span>
                  </div>
                  <select value={deal.stage} onChange={e => update(deal.id, { stage: e.target.value as DealStatus })}
                    className="mt-2 w-full text-[11px] border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                    {dealColumns.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ))}
              {addingIn === col ? (
                <div className="bg-white border border-indigo-200 rounded-xl p-3 space-y-2">
                  <input autoFocus value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Entreprise"
                    className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                  <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Montant (€)" type="number"
                    className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                  <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Contact"
                    className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                  {error && addingIn === col && (
                    <p className="text-[10px] text-red-600 bg-red-50 border border-red-100 rounded-md px-2 py-1.5">{error}</p>
                  )}
                  <div className="flex gap-1.5">
                    <button onClick={() => setAddingIn(null)} className="flex-1 py-1.5 text-[11px] text-gray-500 hover:bg-gray-50 rounded-md transition-colors">
                      <X size={11} className="inline mr-1" />Annuler
                    </button>
                    <button onClick={() => handleCreate(col)} className="flex-1 py-1.5 text-[11px] bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">Créer</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingIn(col)} className="w-full mt-1 py-2.5 rounded-xl border border-dashed border-gray-200 text-[11px] text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center gap-1.5">
                  <Plus size={12} />Ajouter
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
