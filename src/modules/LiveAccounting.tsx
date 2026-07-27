import { useState } from 'react'
import { ArrowLeftRight, AlertTriangle, CheckCircle, PlugZap, RefreshCw, Plus, X } from 'lucide-react'
import { formatEur, TableHeader } from '../App'
import { useBankTransactions } from '../data/bankTransactions'

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(value))
}

export function LiveAccounting() {
  const [activeTab, setActiveTab] = useState<'rapprochement' | 'sync'>('rapprochement')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ label: '', amount: '', type: 'crédit' })
  const { data: transactions, loading, error, insert, update } = useBankTransactions()

  const unmatched = transactions.filter(t => !t.matched).length
  const thisMonthCount = transactions.filter(t => {
    const d = new Date(t.txn_date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const reconciledBalance = transactions.filter(t => t.matched).reduce((s, t) => s + Number(t.amount), 0)

  async function handleCreate() {
    if (!form.label.trim() || !form.amount) return
    const created = await insert({
      txn_date: new Date().toISOString().slice(0, 10),
      label: form.label.trim(),
      amount: form.type === 'crédit' ? Math.abs(Number(form.amount)) : -Math.abs(Number(form.amount)),
      type: form.type,
      matched: false,
    })
    if (!created) return
    setForm({ label: '', amount: '', type: 'crédit' })
    setShowCreate(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit mb-6">
        {(['rapprochement', 'sync'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'rapprochement' ? 'Rapprochement bancaire' : 'Synchronisation Pennylane'}
          </button>
        ))}
      </div>

      {activeTab === 'rapprochement' && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Transactions ce mois', value: String(thisMonthCount), icon: ArrowLeftRight, color: 'text-indigo-600 bg-indigo-50' },
              { label: 'Non rapprochées', value: String(unmatched), icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
              { label: 'Solde rapproché', value: formatEur(reconciledBalance), icon: CheckCircle, color: 'text-green-600 bg-green-50' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}><s.icon size={18} /></div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-700">Transactions bancaires</p>
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:text-indigo-700">
                <Plus size={12} />Ajouter une transaction
              </button>
            </div>
            <table className="w-full text-xs">
              <TableHeader cols={['Date', 'Libellé', 'Montant', 'Rapprochement', '']} />
              <tbody>
                {transactions.map((row, i) => (
                  <tr key={row.id} className={`border-b border-gray-50 hover:bg-gray-50/40 transition-colors ${i === transactions.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(row.txn_date)}</td>
                    <td className="px-4 py-3 text-gray-700">{row.label}</td>
                    <td className={`px-4 py-3 font-semibold tabular-nums ${row.type === 'crédit' ? 'text-green-600' : 'text-gray-900'}`}>{formatEur(Number(row.amount))}</td>
                    <td className="px-4 py-3">
                      {row.matched
                        ? <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle size={12} />Rapproché</span>
                        : <span className="flex items-center gap-1 text-amber-500 font-medium"><AlertTriangle size={12} />À rapprocher</span>}
                    </td>
                    <td className="px-4 py-3">
                      {!row.matched && (
                        <button onClick={() => update(row.id, { matched: true })} className="text-[11px] px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md font-medium hover:bg-indigo-100 transition-colors">Affecter</button>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && transactions.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Aucune transaction pour l'instant.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'sync' && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <PlugZap size={18} className="text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Pennylane</p>
                <p className="text-xs text-gray-400">Non connecté — intégration à configurer dans Paramètres</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-xs font-medium text-gray-400">Non connecté</span>
              </div>
            </div>
            <button className="w-full flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <RefreshCw size={12} />Configurer la synchronisation
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">Ajouter une transaction</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Libellé"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Montant (€)" type="number"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                  <option value="crédit">Crédit</option>
                  <option value="débit">Débit</option>
                </select>
              </div>
            </div>
            {error && (
              <p className="mt-3 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Annuler</button>
              <button onClick={handleCreate} className="flex-1 px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
