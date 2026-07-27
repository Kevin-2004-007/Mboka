import { useState } from 'react'
import { Plus, CheckCircle, X } from 'lucide-react'
import { Avatar, StatusBadge, ProgressBar, formatEur, TableHeader } from '../App'
import { useProjects } from '../data/projects'
import { useTimeEntries } from '../data/timeEntries'
import { useEmployees } from '../data/employees'

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function startOfWeek(d: Date) {
  const day = (d.getDay() + 6) % 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - day)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function LiveProjects() {
  const { data: projects, loading, error, insert, update } = useProjects()
  const { data: timeEntries, error: timeError, insert: insertTime } = useTimeEntries()
  const { data: employees } = useEmployees()

  const [tab, setTab] = useState<'projects' | 'time'>('projects')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', client: '', budget: '', deadline: '', members_count: '1' })
  const [showLogTime, setShowLogTime] = useState(false)
  const [timeForm, setTimeForm] = useState({ employee_id: '', project_id: '', work_date: new Date().toISOString().slice(0, 10), hours: '' })

  async function handleCreate() {
    if (!form.name.trim()) return
    const created = await insert({
      name: form.name.trim(),
      client: form.client.trim() || null,
      progress: 0,
      budget: Number(form.budget) || 0,
      spent: 0,
      members_count: Number(form.members_count) || 1,
      deadline: form.deadline || null,
      status: 'En cours',
      logged_hours: 0,
    })
    if (!created) return
    setForm({ name: '', client: '', budget: '', deadline: '', members_count: '1' })
    setShowCreate(false)
  }

  async function handleLogTime() {
    if (!timeForm.employee_id || !timeForm.project_id || !timeForm.hours) return
    const created = await insertTime({
      employee_id: timeForm.employee_id,
      project_id: timeForm.project_id,
      work_date: timeForm.work_date,
      hours: Number(timeForm.hours) || 0,
    })
    if (!created) return
    setTimeForm(f => ({ ...f, hours: '' }))
    setShowLogTime(false)
  }

  const monday = startOfWeek(new Date())
  const grid = new Map<string, { employeeId: string; projectId: string; hours: number[] }>()
  for (const entry of timeEntries) {
    if (!entry.employee_id || !entry.project_id) continue
    const entryDate = new Date(entry.work_date)
    const dayIndex = Math.round((entryDate.getTime() - monday.getTime()) / (24 * 60 * 60 * 1000))
    if (dayIndex < 0 || dayIndex > 4) continue
    const key = `${entry.employee_id}|${entry.project_id}`
    if (!grid.has(key)) grid.set(key, { employeeId: entry.employee_id, projectId: entry.project_id, hours: [0, 0, 0, 0, 0] })
    grid.get(key)!.hours[dayIndex] += Number(entry.hours)
  }
  const weekRows = Array.from(grid.values())

  return (
    <div className="p-6">
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit mb-6">
        {(['projects', 'time'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'projects' ? 'Projets' : 'Feuilles de temps'}
          </button>
        ))}
      </div>

      {tab === 'projects' && (
        <>
          <div className="flex justify-end mb-3">
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus size={13} />Nouveau projet
            </button>
          </div>
          <div className="space-y-3">
            {projects.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-gray-400 mb-3">{p.client ?? 'Interne'} · {p.members_count} membres · {p.logged_hours}h saisies</p>
                    <ProgressBar value={p.progress} />
                  </div>
                  <div className="flex items-start gap-6 text-xs flex-shrink-0">
                    <div className="text-right">
                      <p className="text-gray-400">Budget</p>
                      <p className="font-semibold text-gray-900 mt-0.5">{formatEur(Number(p.budget))}</p>
                      <p className="text-gray-400">{formatEur(Number(p.spent))} dépensé</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400">Deadline</p>
                      <p className={`font-semibold mt-0.5 ${p.status === 'Terminé' ? 'text-green-600' : 'text-gray-900'}`}>{formatDate(p.deadline)}</p>
                    </div>
                    {p.status !== 'Terminé' && (
                      <button onClick={() => update(p.id, { status: 'Terminé', progress: 100 })}
                        className="flex items-center gap-1 text-[11px] px-2 py-1 bg-green-50 text-green-700 rounded-md font-medium hover:bg-green-100 transition-colors">
                        <CheckCircle size={11} />Terminer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!loading && projects.length === 0 && (
              <p className="text-center text-gray-400 py-10 text-xs">Aucun projet pour l'instant.</p>
            )}
          </div>
        </>
      )}

      {tab === 'time' && (
        <>
          <div className="flex justify-end mb-3">
            <button onClick={() => setShowLogTime(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus size={13} />Saisir du temps
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-700">Semaine du {formatDate(monday.toISOString())}</p>
            </div>
            <table className="w-full text-xs">
              <TableHeader cols={['Employé', 'Projet', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Total']} />
              <tbody>
                {weekRows.map((row, i) => {
                  const employee = employees.find(e => e.id === row.employeeId)
                  const project = projects.find(p => p.id === row.projectId)
                  const total = row.hours.reduce((s, h) => s + h, 0)
                  return (
                    <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50/40 transition-colors ${i === weekRows.length - 1 ? 'border-0' : ''}`}>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar initials={(employee?.name ?? '?').split(' ').map(n => n[0]).join('')} size="sm" /><span className="font-medium text-gray-900">{employee?.name ?? 'Employé supprimé'}</span></div></td>
                      <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{project?.name ?? 'Projet supprimé'}</td>
                      {row.hours.map((h, j) => (
                        <td key={j} className={`px-4 py-3 text-center tabular-nums ${h === 0 ? 'text-gray-300' : h >= 8 ? 'text-green-600 font-semibold' : 'text-gray-700'}`}>{h === 0 ? '—' : `${h}h`}</td>
                      ))}
                      <td className="px-4 py-3 font-bold text-indigo-600 tabular-nums">{total}h</td>
                    </tr>
                  )
                })}
                {weekRows.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Aucune saisie cette semaine.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">Nouveau projet</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom du projet"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
              <input value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="Client (laisser vide si interne)"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="Budget (€)" type="number"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                <input value={form.members_count} onChange={e => setForm(f => ({ ...f, members_count: e.target.value }))} placeholder="Membres" type="number"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Deadline</label>
                <input value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} type="date"
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

      {showLogTime && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowLogTime(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">Saisir du temps</h3>
              <button onClick={() => setShowLogTime(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <select value={timeForm.employee_id} onChange={e => setTimeForm(f => ({ ...f, employee_id: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                <option value="">Employé…</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <select value={timeForm.project_id} onChange={e => setTimeForm(f => ({ ...f, project_id: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                <option value="">Projet…</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input value={timeForm.work_date} onChange={e => setTimeForm(f => ({ ...f, work_date: e.target.value }))} type="date"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-gray-700" />
                <input value={timeForm.hours} onChange={e => setTimeForm(f => ({ ...f, hours: e.target.value }))} placeholder="Heures" type="number"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
              </div>
            </div>
            {timeError && (
              <p className="mt-3 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{timeError}</p>
            )}
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowLogTime(false)} className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Annuler</button>
              <button onClick={handleLogTime} className="flex-1 px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
