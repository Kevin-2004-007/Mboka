import { useState } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Search, GripVertical, Minus, PlusCircle, Download, Trash2 } from 'lucide-react'
import { formatEur, TableHeader, biBarData, availableMetrics } from '../App'
import { TableSkeleton } from '../ui/Skeleton'
import { useBiReports } from '../data/biReports'
import { useDeals } from '../data/deals'

const stageColors: Record<string, string> = {
  Prospection: '#2563EB',
  Qualification: '#9333EA',
  Proposition: '#D97706',
  Négociation: '#EA580C',
  Gagné: '#16A34A',
}

const chartTypes = ['Graphique barres', 'Graphique lignes', 'Camembert', 'Tableau', 'KPI cards']

export function LiveBI() {
  const { data: reports, loading, error, insert, remove } = useBiReports()
  const { data: deals } = useDeals()

  const [tab, setTab] = useState<'library' | 'builder'>('library')
  const [addedMetrics, setAddedMetrics] = useState<string[]>(['Chiffre d\'affaires', 'Nombre de deals'])
  const [reportName, setReportName] = useState('Nouveau rapport')
  const [chartType, setChartType] = useState(chartTypes[0])
  const [saving, setSaving] = useState(false)

  const pipelineByStage = Object.entries(
    deals.reduce<Record<string, number>>((acc, d) => {
      acc[d.stage] = (acc[d.stage] ?? 0) + Number(d.amount)
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value, color: stageColors[name] ?? '#6B7280' }))

  async function handleSaveReport() {
    if (!reportName.trim()) return
    setSaving(true)
    const created = await insert({
      name: reportName.trim(),
      type: chartType,
      schedule: 'Aucune',
      views: 0,
      config: { metrics: addedMetrics, chartType },
    })
    setSaving(false)
    if (!created) return
    setTab('library')
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Supprimer ce rapport ?')) return
    await remove(id)
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit mb-6">
        {(['library', 'builder'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'library' ? 'Bibliothèque de rapports' : 'Constructeur de rapport'}
          </button>
        ))}
      </div>

      {tab === 'library' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-700 mb-1">CA par module</p>
              <p className="text-[11px] text-gray-400 mb-4">Données de démonstration — nécessite le rattachement des factures par module</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={biBarData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="module" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
                  <Tooltip formatter={(v) => [formatEur(Number(v)), 'CA']} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                  <Bar dataKey="ca" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-700 mb-4">Pipeline CRM — répartition</p>
              {pipelineByStage.length === 0 ? (
                <p className="text-xs text-gray-400">Aucun deal pour l'instant.</p>
              ) : (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={pipelineByStage} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2} dataKey="value">
                        {pipelineByStage.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [formatEur(Number(v))]} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 flex-1">
                    {pipelineByStage.map(d => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-[11px] text-gray-600 flex-1">{d.name}</span>
                        <span className="text-[11px] font-medium text-gray-700 tabular-nums">{formatEur(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-700">Rapports sauvegardés</p>
            </div>
            <table className="w-full text-xs">
              <TableHeader cols={['Nom du rapport', 'Type', 'Planification', 'Vues', '']} />
              <tbody>
                {reports.map((r, i) => (
                  <tr key={r.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i === reports.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3"><span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[11px] font-medium">{r.type}</span></td>
                    <td className="px-4 py-3"><span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[11px]">{r.schedule}</span></td>
                    <td className="px-4 py-3 text-gray-400 tabular-nums">{r.views}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(r.id)} className="p-1 rounded hover:bg-red-50 transition-colors"><Trash2 size={14} className="text-gray-300 hover:text-red-400" /></button>
                    </td>
                  </tr>
                ))}
                {loading && <TableSkeleton cols={5} />}
                {!loading && reports.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Aucun rapport sauvegardé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'builder' && (
        <div className="grid grid-cols-3 gap-5">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-700 mb-3">Métriques disponibles</p>
            <div className="relative mb-3">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input placeholder="Filtrer…" className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
            </div>
            <div className="space-y-1">
              {availableMetrics.map(m => {
                const added = addedMetrics.includes(m)
                return (
                  <button key={m} onClick={() => setAddedMetrics(prev => added ? prev.filter(x => x !== m) : [...prev, m])}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${added ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <GripVertical size={12} className="text-gray-300 flex-shrink-0" />
                    <span className="flex-1">{m}</span>
                    {added ? <Minus size={12} className="text-indigo-400" /> : <PlusCircle size={12} className="text-gray-300" />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <input value={reportName} onChange={e => setReportName(e.target.value)}
                    className="text-sm font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-400 focus:outline-none pb-0.5 transition-colors" />
                  <p className="text-xs text-gray-400 mt-0.5">{addedMetrics.length} métriques · {chartType}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select value={chartType} onChange={e => setChartType(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                    {chartTypes.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 text-xs font-medium rounded-lg cursor-not-allowed" disabled>
                    <Download size={12} />Exporter
                  </button>
                </div>
              </div>

              {addedMetrics.length === 0 ? (
                <div className="h-48 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center">
                  <GripVertical size={20} className="text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400">Ajoutez des métriques depuis le panneau gauche</p>
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 italic">Aperçu illustratif — les valeurs réelles par métrique seront calculées lors de la génération du rapport.</p>
              )}
            </div>

            {error && (
              <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}
            <button onClick={handleSaveReport} disabled={saving}
              className="w-full py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? 'Enregistrement…' : 'Enregistrer le rapport'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
