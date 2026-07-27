import { useState, useEffect, useRef } from 'react'
import { Search, X, ChevronRight } from 'lucide-react'
import { formatEur } from '../App'
import type { Module } from '../modules'
import { useEmployees } from '../data/employees'
import { useDeals } from '../data/deals'
import { useInvoices } from '../data/invoices'
import { useTickets } from '../data/tickets'
import { useProjects } from '../data/projects'
import { useAudits } from '../data/audits'
import { useDocuments } from '../data/documents'

type Result = { type: string; label: string; sub: string; module: Module; ts: string }

const typeColors: Record<string, string> = {
  Employé: 'bg-blue-50 text-blue-600',
  Deal: 'bg-purple-50 text-purple-600',
  Facture: 'bg-amber-50 text-amber-600',
  Ticket: 'bg-red-50 text-red-600',
  Projet: 'bg-indigo-50 text-indigo-600',
  Audit: 'bg-teal-50 text-teal-600',
  Document: 'bg-gray-100 text-gray-600',
}

export function LiveCmdKModal({ onClose, onNavigate }: { onClose: () => void; onNavigate: (m: Module) => void }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: employees } = useEmployees()
  const { data: deals } = useDeals()
  const { data: invoices } = useInvoices()
  const { data: tickets } = useTickets()
  const { data: projects } = useProjects()
  const { data: audits } = useAudits()
  const { data: documents } = useDocuments()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [onClose])

  const allResults: Result[] = [
    ...employees.map(e => ({ type: 'Employé', label: e.name, sub: `${e.role} · ${e.dept}`, module: 'hr' as Module, ts: e.created_at })),
    ...deals.map(d => ({ type: 'Deal', label: d.company, sub: `${formatEur(Number(d.amount))} · ${d.stage}`, module: 'crm' as Module, ts: d.created_at })),
    ...invoices.map(i => ({ type: 'Facture', label: i.number, sub: `${i.client} · ${formatEur(Number(i.amount))} · ${i.status}`, module: 'finance' as Module, ts: i.created_at })),
    ...tickets.map(t => ({ type: 'Ticket', label: t.number, sub: `${t.subject} · ${t.priority}`, module: 'support' as Module, ts: t.created_at })),
    ...projects.map(p => ({ type: 'Projet', label: p.name, sub: `${p.client ?? 'Interne'} · ${p.progress}%`, module: 'projects' as Module, ts: p.created_at })),
    ...audits.map(a => ({ type: 'Audit', label: a.title, sub: `${a.status} · ${a.progress}%`, module: 'quality' as Module, ts: a.created_at })),
    ...documents.map(d => ({ type: 'Document', label: d.name, sub: d.folder ?? '—', module: 'documents' as Module, ts: d.created_at })),
  ].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())

  const results = query.length > 0
    ? allResults.filter(r => r.label.toLowerCase().includes(query.toLowerCase()) || r.sub.toLowerCase().includes(query.toLowerCase()))
    : allResults.slice(0, 6)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher dans MBOKA…"
            className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none" />
          {query && <button onClick={() => setQuery('')}><X size={14} className="text-gray-400 hover:text-gray-600" /></button>}
          <kbd className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-medium">Esc</kbd>
        </div>
        <div className="py-2 max-h-80 overflow-y-auto">
          {!query && <p className="text-[11px] text-gray-400 px-4 pt-1 pb-2 font-medium uppercase tracking-wider">Ajouts récents</p>}
          {results.length === 0 && (
            <div className="text-center py-8 text-xs text-gray-400">Aucun résultat pour « {query} »</div>
          )}
          {results.map((r, i) => (
            <button key={i} onClick={() => { onNavigate(r.module); onClose() }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${typeColors[r.type] ?? 'bg-gray-100 text-gray-500'}`}>{r.type}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-900 truncate">{r.label}</p>
                <p className="text-[11px] text-gray-400 truncate">{r.sub}</p>
              </div>
              <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
        <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-4 text-[10px] text-gray-400">
          <span><kbd className="bg-gray-100 px-1 rounded">↑↓</kbd> Naviguer</span>
          <span><kbd className="bg-gray-100 px-1 rounded">↵</kbd> Ouvrir</span>
          <span><kbd className="bg-gray-100 px-1 rounded">Esc</kbd> Fermer</span>
        </div>
      </div>
    </div>
  )
}
