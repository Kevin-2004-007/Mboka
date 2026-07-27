import { useState } from 'react'
import { Search, Plus, MoreHorizontal, X } from 'lucide-react'
import { StatusBadge, Avatar, TableHeader } from '../App'
import { TableSkeleton } from '../ui/Skeleton'
import { useEmployees } from '../data/employees'
import { useLeaveRequests } from '../data/leaveRequests'

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function initialsOf(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export function LiveHR() {
  const [hrTab, setHrTab] = useState<'employees' | 'leaves'>('employees')
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('Tous')
  const [showCreate, setShowCreate] = useState(false)
  const [newEmployee, setNewEmployee] = useState({ name: '', role: '', dept: 'RH', contract: 'CDI' })

  const { data: employees, loading, error, insert } = useEmployees()
  const { data: leaveRequests, update: updateLeave } = useLeaveRequests()

  const depts = ['Tous', 'RH', 'Tech', 'Finance', 'Commercial']
  const filtered = employees.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase())
    const matchDept = deptFilter === 'Tous' || e.dept === deptFilter
    return matchSearch && matchDept
  })

  async function handleCreate() {
    if (!newEmployee.name.trim() || !newEmployee.role.trim()) return
    const created = await insert({ ...newEmployee, status: 'Actif', hire_date: new Date().toISOString().slice(0, 10) })
    if (!created) return
    setNewEmployee({ name: '', role: '', dept: 'RH', contract: 'CDI' })
    setShowCreate(false)
  }

  function employeeName(id: string | null) {
    return employees.find(e => e.id === id)?.name ?? 'Employé supprimé'
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit mb-5">
        {(['employees', 'leaves'] as const).map(t => (
          <button key={t} onClick={() => setHrTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${hrTab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'employees' ? 'Employés' : 'Congés & absences'}
          </button>
        ))}
      </div>

      {hrTab === 'employees' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un employé…"
                className="pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 w-56 placeholder:text-gray-400" />
            </div>
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
              {depts.map(d => (
                <button key={d} onClick={() => setDeptFilter(d)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${deptFilter === d ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>{d}</button>
              ))}
            </div>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus size={13} />Nouvel employé
            </button>
            <span className="text-xs text-gray-400 ml-auto">{loading ? 'Chargement…' : `${filtered.length} employé${filtered.length > 1 ? 's' : ''}`}</span>
          </div>

          {showCreate && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-gray-900">Nouvel employé</h3>
                  <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} className="text-gray-400" /></button>
                </div>
                <div className="space-y-3">
                  <input value={newEmployee.name} onChange={e => setNewEmployee(p => ({ ...p, name: e.target.value }))} placeholder="Nom complet"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                  <input value={newEmployee.role} onChange={e => setNewEmployee(p => ({ ...p, role: e.target.value }))} placeholder="Poste"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={newEmployee.dept} onChange={e => setNewEmployee(p => ({ ...p, dept: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                      {['RH', 'Tech', 'Finance', 'Commercial'].map(d => <option key={d}>{d}</option>)}
                    </select>
                    <select value={newEmployee.contract} onChange={e => setNewEmployee(p => ({ ...p, contract: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                      {['CDI', 'CDD', 'Stage', 'Alternance'].map(c => <option key={c}>{c}</option>)}
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
              <TableHeader cols={['Nom', 'Poste', 'Département', 'Contrat', 'Statut', "Date d'entrée", '']} />
              <tbody>
                {filtered.map((emp, i) => (
                  <tr key={emp.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar initials={initialsOf(emp.name)} size="md" /><span className="font-medium text-gray-900">{emp.name}</span></div></td>
                    <td className="px-4 py-3 text-gray-600">{emp.role}</td>
                    <td className="px-4 py-3"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[11px] font-medium">{emp.dept}</span></td>
                    <td className="px-4 py-3 text-gray-600">{emp.contract}</td>
                    <td className="px-4 py-3"><StatusBadge status={emp.status} /></td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(emp.hire_date)}</td>
                    <td className="px-4 py-3"><button className="p-1 rounded hover:bg-gray-100 transition-colors"><MoreHorizontal size={14} className="text-gray-400" /></button></td>
                  </tr>
                ))}
                {loading && <TableSkeleton cols={7} />}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Aucun employé pour l'instant.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {hrTab === 'leaves' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: 'En attente de validation', value: String(leaveRequests.filter(l => l.status === 'En attente').length), color: 'text-amber-600' },
              { label: 'Approuvées', value: String(leaveRequests.filter(l => l.status === 'Approuvé').length), color: 'text-green-600' },
              { label: 'Jours total posés', value: String(leaveRequests.reduce((s, l) => s + Number(l.days), 0)), color: 'text-indigo-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-xs">
              <TableHeader cols={['Employé', 'Type', 'Du', 'Au', 'Jours', 'Manager', 'Statut', '']} />
              <tbody>
                {leaveRequests.map((req, i) => (
                  <tr key={req.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i === leaveRequests.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar initials={initialsOf(employeeName(req.employee_id))} size="md" /><span className="font-medium text-gray-900">{employeeName(req.employee_id)}</span></div></td>
                    <td className="px-4 py-3"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[11px] font-medium">{req.type}</span></td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(req.starts_on)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(req.ends_on)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{req.days}j</td>
                    <td className="px-4 py-3 text-gray-500">{req.manager ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                    <td className="px-4 py-3">
                      {req.status === 'En attente' && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateLeave(req.id, { status: 'Approuvé' })} className="px-2 py-1 text-[11px] bg-green-50 text-green-700 rounded-md font-medium hover:bg-green-100 transition-colors">Approuver</button>
                          <button onClick={() => updateLeave(req.id, { status: 'Refusé' })} className="px-2 py-1 text-[11px] bg-red-50 text-red-600 rounded-md font-medium hover:bg-red-100 transition-colors">Refuser</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {leaveRequests.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Aucune demande de congé.</td></tr>
               