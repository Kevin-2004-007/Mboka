import { useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle, Clock, PenLine, X, Plus, Trash2 } from 'lucide-react'
import { StatusBadge, Avatar, TableHeader } from '../App'
import { TableSkeleton } from '../ui/Skeleton'
import { useEsignDocuments, useEsignSigners } from '../data/esign'

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function initialsOf(name: string) {
  return name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function LiveESign() {
  const { data: docs, loading, error, insert: insertDoc, update: updateDoc } = useEsignDocuments()
  const { data: signers, insert: insertSigner, update: updateSigner } = useEsignSigners()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [parties, setParties] = useState(['', ''])

  const statuses = ['Tous', 'En attente', 'Signé', 'Expiré']
  const filtered = docs.filter(d => statusFilter === 'Tous' || d.status === statusFilter)
  const selected = docs.find(d => d.id === selectedId) ?? null
  const selectedSigners = selected ? signers.filter(s => s.esign_document_id === selected.id) : []

  async function handleCreate() {
    const validParties = parties.map(p => p.trim()).filter(Boolean)
    if (!title.trim() || validParties.length === 0) return
    const doc = await insertDoc({ title: title.trim(), status: 'En attente', deadline: deadline || null })
    if (!doc) return
    for (const name of validParties) {
      await insertSigner({ esign_document_id: doc.id, name, initials: initialsOf(name), done: false })
    }
    setTitle('')
    setDeadline('')
    setParties(['', ''])
    setShowCreate(false)
  }

  async function toggleSigner(signerId: string) {
    if (!selected) return
    const signer = signers.find(s => s.id === signerId)
    if (!signer) return
    const newDone = !signer.done
    await updateSigner(signerId, { done: newDone })
    const others = selectedSigners.filter(s => s.id !== signerId)
    if (newDone && others.every(s => s.done)) {
      await updateDoc(selected.id, { status: 'Signé' })
    }
  }

  async function handleCancel() {
    if (!selected || !window.confirm('Annuler cette demande de signature ?')) return
    await updateDoc(selected.id, { status: 'Expiré' })
  }

  if (selected) {
    const signedCount = selectedSigners.filter(s => s.done).length
    return (
      <div className="p-6 max-w-5xl">
        <button onClick={() => setSelectedId(null)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-5 transition-colors">
          <ChevronLeft size={14} />Retour à la liste
        </button>
        <div className="grid grid-cols-5 gap-5">
          <div className="col-span-3 bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-3">
              <p className="text-xs font-semibold text-gray-700">{selected.title}</p>
            </div>
            <div className="p-8 min-h-[480px] flex flex-col">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <p className="text-base font-bold text-gray-900 mb-1">{selected.title}</p>
                <p className="text-xs text-gray-400">Document confidentiel</p>
              </div>
              <div className="space-y-3 flex-1">
                <p className="text-xs text-gray-600 leading-relaxed">Entre les soussignés, il a été convenu ce qui suit :</p>
                <div className="h-16 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center mt-4">
                  <p className="text-xs text-gray-400">… contenu du document …</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                {selectedSigners.map(s => (
                  <button key={s.id} onClick={() => toggleSigner(s.id)}
                    className={`text-left rounded-lg border-2 border-dashed p-3 transition-colors ${s.done ? 'border-green-200 bg-green-50' : 'border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50'}`}>
                    <p className="text-[11px] text-gray-500 mb-1">Signature de {s.name}</p>
                    {s.done ? (
                      <div className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle size={13} />
                        <p className="text-xs font-semibold italic" style={{ fontFamily: 'Georgia, serif' }}>{s.name.split(' ')[0]}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-indigo-500">
                        <PenLine size={13} />
                        <p className="text-xs text-indigo-500">Cliquer pour signer</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-700 mb-3">Statut du document</p>
              <div className="flex items-center gap-2 mb-4">
                <StatusBadge status={selected.status} />
                <span className="text-xs text-gray-400">· {signedCount}/{selectedSigners.length} signé{signedCount > 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-3">
                {selectedSigners.map(s => (
                  <div key={s.id} className="flex items-center gap-3">
                    <Avatar initials={s.initials ?? '?'} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">{s.name}</p>
                      <p className={`text-[11px] ${s.done ? 'text-green-600' : 'text-amber-500'}`}>{s.done ? 'A signé' : 'En attente'}</p>
                    </div>
                    {s.done ? <CheckCircle size={14} className="text-green-500" /> : <Clock size={14} className="text-amber-400" />}
                  </div>
                ))}
              </div>
            </div>

            {selected.status !== 'Signé' && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-700 mb-3">Actions</p>
                <button onClick={handleCancel}
                  className="w-full flex items-center justify-center gap-1.5 py-2 border border-red-100 text-red-500 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors">
                  <X size={12} />Annuler la demande
                </button>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-800 mb-1">Échéance</p>
              <p className="text-xs text-amber-600">{formatDate(selected.deadline)}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'En attente de signature', value: String(docs.filter(d => d.status === 'En attente').length), color: 'text-amber-600' },
          { label: 'Signés', value: String(docs.filter(d => d.status === 'Signé').length), color: 'text-green-600' },
          { label: 'Expirés', value: String(docs.filter(d => d.status === 'Expiré').length), color: 'text-red-600' },
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
          <Plus size={13} />Nouvelle demande
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <TableHeader cols={['Document', 'Échéance', 'Signataires', 'Statut', '']} />
          <tbody>
            {filtered.map((doc, i) => {
              const docSigners = signers.filter(s => s.esign_document_id === doc.id)
              return (
                <tr key={doc.id} onClick={() => setSelectedId(doc.id)} className={`border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[240px] truncate">{doc.title}</td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(doc.deadline)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {docSigners.map(s => (
                        <div key={s.id} className="relative">
                          <Avatar initials={s.initials ?? '?'} size="sm" />
                          {s.done && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />}
                        </div>
                      ))}
                      <span className="text-[10px] text-gray-400 ml-1">{docSigners.filter(s => s.done).length}/{docSigners.length}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                  <td className="px-4 py-3"><ChevronRight size={14} className="text-gray-300" /></td>
                </tr>
              )
            })}
            {loading && <TableSkeleton cols={5} />}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Aucune demande de signature.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">Nouvelle demande de signature</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre du document"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Échéance</label>
                <input value={deadline} onChange={e => setDeadline(e.target.value)} type="date"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-gray-700" />
              </div>
              <label className="text-[11px] text-gray-500 mb-1 block">Signataires</label>
              {parties.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={p} onChange={e => setParties(prev => prev.map((v, j) => j === i ? e.target.value : v))} placeholder={`Signataire ${i + 1}`}
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                  <button onClick={() => setParties(prev => prev.filter((_, j) => j !== i))} className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                </div>
              ))}
              <button onClick={() => setParties(prev => [...prev, ''])}
                className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-gray-200 text-gray-400 text-xs font-medium rounded-lg hover:border-indigo-300 hover:text-indigo-500 transition-colors">
                <Plus size={12} />Ajouter un signataire
              </button>
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
    </div>
  )
}
