import { Users, Briefcase, TrendingUp, FileText, UserCheck, Target } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { KpiCard, ChartTooltip, formatEur, revenueData } from '../App'
import { useEmployees } from '../data/employees'
import { useDeals } from '../data/deals'
import { useLeaveRequests } from '../data/leaveRequests'

export function LiveDashboard() {
  const { data: employees } = useEmployees()
  const { data: deals } = useDeals()
  const { data: leaveRequests } = useLeaveRequests()

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const newDealsThisWeek = deals.filter(d => new Date(d.created_at).getTime() > oneWeekAgo).length
  const pipelineTotal = deals.reduce((s, d) => s + Number(d.amount), 0)
  const pendingLeaves = leaveRequests.filter(l => l.status === 'En attente').length

  const activity = [
    ...employees.map(e => ({ ts: e.created_at, Icon: UserCheck, color: 'text-blue-500 bg-blue-50', text: `${e.name} a rejoint l'équipe ${e.dept}`, module: 'RH' })),
    ...deals.map(d => ({ ts: d.created_at, Icon: Target, color: 'text-amber-500 bg-amber-50', text: `Deal ${d.company} — ${d.stage} (${formatEur(Number(d.amount))})`, module: 'CRM' })),
  ]
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 6)

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="CA du mois" value="—" Icon={TrendingUp} iconColor="bg-indigo-50 text-indigo-600" />
        <KpiCard label="Factures en attente" value="—" Icon={FileText} iconColor="bg-amber-50 text-amber-600" />
        <KpiCard label="Effectifs" value={String(employees.length)} Icon={Users} iconColor="bg-blue-50 text-blue-600" />
        <KpiCard label="Nouveaux deals" value={String(newDealsThisWeek)} trend="up" trendLabel="cette semaine" Icon={Briefcase} iconColor="bg-green-50 text-green-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Chiffre d'affaires</h2>
              <p className="text-xs text-gray-400 mt-0.5">Données de démonstration — module Finance à venir</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="ca" stroke="#4F46E5" strokeWidth={2} fill="url(#gradCA)" dot={false} activeDot={{ r: 4, fill: '#4F46E5', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Activité récente</h2>
          </div>
          <div className="space-y-3">
            {activity.length === 0 && <p className="text-xs text-gray-400">Aucune activité pour l'instant.</p>}
            {activity.map((act, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${act.color}`}>
                  <act.Icon size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-700 leading-snug">{act.text}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-gray-400">{new Date(act.ts).toLocaleDateString('fr-FR')}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
                    <span className="text-[10px] text-gray-400">{act.module}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Paiements reçus ce mois', value: '—', sub: 'Module Finance à venir', color: 'text-gray-400' },
          { label: 'Pipeline CRM total', value: formatEur(pipelineTotal), sub: `${deals.length} opportunités actives`, color: 'text-indigo-600' },
          { label: 'Congés en attente de validation', value: String(pendingLeaves), sub: 'à valider', color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center justify-between hover:shadow-sm transition-shadow">
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
