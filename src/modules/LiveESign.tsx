import { useEffect, useState } from 'react'
import { useOrganization, useUser } from '@clerk/react'
import { ChevronLeft, ChevronRight, CheckCircle, Clock, Link2, Check, X, Plus, Trash2, Upload, FileText, PenLine, Download } from 'lucide-react'
import { StatusBadge, Avatar, TableHeader } from '../App'
import { TableSkeleton } from '../ui/Skeleton'
import { useSupabaseClient } from '../lib/supabase'
import { useEsignDocuments, useEsignSigners } from '../data/esign'
import { useNotifications } from '../data/notifications'

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function initialsOf(name: string) {
  return name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// Only PDFs and images render inline in a browser; anything else (docx,
// xlsx…) either shows blank in an <iframe> or silently downloads instead of
// displaying, which is what looked like a broken preview.
function fileKind(path: string): 'pdf' | 'image' | 'other' {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return 'pdf'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
  return 'other'
}

// "Expiré" used to only ever be set by the admin clicking "Annuler la
// demande" — the deadline passing didn't actually do anything. Derived here
// (like Stock's En stock/Stock faible/Rupture) instead of written back by a
// background job, since there's no scheduler in this app to run one.
function effectiveStatus(doc: { status: string; deadline: string | null }) {
  if (doc.status === 'Signé' || doc.status === 'Expiré') return doc.status
  if (doc.deadline && doc.deadline < new Date().toISOString().slice(0, 10)) return 'Expiré'
  return doc.status
}

export function LiveESign() {
  const { data: docs, loading, error, insert: insertDoc, update: updateDoc, remove: removeDoc } = useEsignDocuments()
  const { data: signers, insert: insertSigner, update: updateSigner } = useEsignSigners()
  const { insert: insertNotification } = useNotifications()
  const { organization, memberships } = useOrganization({ memberships: true })
  const { user } = useUser()
  const supabase = useSupabaseClient()

  // Clerk's memberships list can report the same member more than once
  // (e.g. across a page-boundary refetch) — dedupe by user id so they never
  // show up twice in the signer picker.
  const orgMembers = Array.from(
    new Map((memberships?.data ?? []).filter(m => m.publicUserData?.userId).map(m => [m.publicUserData!.userId!, m])).values(),
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [memberSignerIds, setMemberSignerIds] = useState<string[]>([])
  const [parties, setParties] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const statuses = ['Tous', 'En attente', 'Signé', 'Expiré']
  const filtered = docs.filter(d => statusFilter === 'Tous' || effectiveStatus(d) === statusFilter)
  const selected = docs.find(d => d.id === selectedId) ?? null
  const selectedSigners = selected ? signers.filter(s => s.esign_document_id === selected.id) : []

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!selected?.storage_path) {
        setPreviewUrl(null)
        return
      }
      const { data } = await supabase.storage.from('attachments').createSignedUrl(selected.storage_path, 3600)
      if (!cancelled) setPreviewUrl(data?.signedUrl ?? null)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [supabase, selected?.id, selected?.storage_path])

  async function handleCreate() {
    const validParties = parties.map(p => p.trim()).filter(Boolean)
    const memberParties = orgMembers.filter(m => memberSignerIds.includes(m.publicUserData!.userId!))
    if (!title.trim() || (validParties.length === 0 && memberParties.length === 0) || !organization) return
    if (deadline && deadline < new Date().toISOString().slice(0, 10)) {
      setCreateError("L'échéance ne peut pas être dans le passé.")
      return
    }
    setCreating(true)
    setCreateError(null)

    let storagePath: string | null = null
    if (file) {
      storagePath = `${organization.id}/esign/${crypto.randomUUID()}-${file.name}`
      const { error: uploadErr } = await supabase.storage.from('attachments').upload(storagePath, file)
      if (uploadErr) {
        setCreating(false)
        setCreateError(uploadErr.message)
        return
      }
    }

    const doc = await insertDoc({ title: title.trim(), status: 'En attente', deadline: deadline || null, storage_path: storagePath, created_by: user?.id ?? null })
    setCreating(false)
    if (!doc) return

    for (const m of memberParties) {
      const name = [m.publicUserData?.firstName, m.publicUserData?.lastName].filter(Boolean).join(' ') || m.publicUserData?.identifier || 'Membre'
      await insertSigner({ esign_document_id: doc.id, name, initials: initialsOf(name), done: false, user_id: m.publicUserData!.userId! })
      await insertNotification({
        user_id: m.publicUserData!.userId!,
        title: 'Nouvelle demande de signature',
        body: `« ${title.trim()} » attend votre signature`,
        module: 'Signature électronique',
        read: false,
      })
    }
    for (const name of validParties) {
      await insertSigner({ esign_document_id: doc.id, name, initials: initialsOf(name), done: false, user_id: null })
    }

    setTitle('')
    setDeadline('')
    setParties([])
    setMemberSignerIds([])
    setFile(null)
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

  function copySignLink(signer: { id: string; token: string }) {
    const url = `${window.location.origin}/sign/${signer.token}`
    navigator.clipboard.writeText(url)
    setCopiedId(signer.id)
    setTimeout(() => setCopiedId(prev => (prev === signer.id ? null : prev)), 2000)
  }

  async function handleCancel() {
    if (!selected || !window.confirm('Annuler cette demande de signature ?')) return
    await updateDoc(selected.id, { status: 'Expiré' })
  }

  async function handleDeleteDoc(id: string) {
    if (!window.confirm('Supprimer définitivement cette demande de signature ?')) return
    await removeDoc(id)
    if (selectedId === id) setSelectedId(null)
  }

  if (selected) {
    const signedCount = selectedSigners.filter(s => s.done).length
    const status = effectiveStatus(selected)
    const isExpired = status === 'Expiré'
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
            {previewUrl && selected.storage_path && fileKind(selected.storage_path) === 'pdf' ? (
              <iframe src={previewUrl} title={selected.title} className="w-full h-[560px]" />
            ) : previewUrl && selected.storage_path && fileKind(selected.storage_path) === 'image' ? (
              <div className="p-4 bg-gray-50 min-h-[480px] flex items-center justify-center">
                <img src={previewUrl} alt={selected.title} className="max-w-full max-h-[520px] object-contain rounded-lg" />
              </div>
            ) : previewUrl ? (
              <div className="p-8 min-h-[480px] flex flex-col items-center justify-center gap-3 text-gray-400">
                <FileText size={28} />
                <p className="text-xs">Aperçu non disponible pour ce type de fichier.</p>
                <a href={previewUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  <Download size={13} />Télécharger le document
                </a>
              </div>
            ) : (
              <div className="p-8 min-h-[480px] flex flex-col items-center justify-center gap-2 text-gray-300">
                <FileText size={28} />
                <p className="text-xs">Aucun fichier joint à cette demande.</p>
              </div>
            )}
          </div>

          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-700 mb-3">Statut du document</p>
              <div className="flex items-center gap-2 mb-4">
                <StatusBadge status={status} />
                <span className="text-xs text-gray-400">· {signedCount}/{selectedSigners.length} signé{signedCount > 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-3">
                {selectedSigners.map(s => {
                  const isMe = !!user && s.user_id === user.id
                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <Avatar initials={s.initials ?? '?'} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900">{s.name}{isMe && !s.done ? ' (vous)' : ''}</p>
                        <p className={`text-[11px] ${s.done ? 'text-green-600' : isExpired ? 'text-red-500' : 'text-amber-500'}`}>
                          {s.done ? 'A signé' : isExpired ? 'Expiré' : s.user_id ? 'Notifié·e dans l\'app' : 'En attente'}
                        </p>
                      </div>
                      {s.done ? (
                        <CheckCircle size={14} className="text-green-500" />
                      ) : isExpired ? null : isMe ? (
                        <button onClick={() => toggleSigner(s.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white text-[11px] font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                          <PenLine size={11} />Signer
                        </button>
                      ) : s.user_id ? (
                        <button onClick={() => toggleSigner(s.id)} title="Marquer comme signé manuellement"
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          <Clock size={13} className="text-gray-300" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button onClick={() => copySignLink(s)} title="Copier le lien de signature"
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                            {copiedId === s.id ? <Check size={13} className="text-green-500" /> : <Link2 size={13} className="text-gray-400" />}
                          </button>
                          <button onClick={() => toggleSigner(s.id)} title="Marquer comme signé manuellement (ex : papier)"
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                            <Clock size={13} className="text-gray-300" />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-gray-300 mt-3">Les membres sont notifiés dans l'app et signent directement ici. Pour un externe, envoyez-lui son lien.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-700 mb-1">Actions</p>
              {status === 'En attente' && (
                <button onClick={handleCancel}
                  className="w-full flex items-center justify-center gap-1.5 py-2 border border-red-100 text-red-500 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors">
                  <X size={12} />Annuler la demande
                </button>
              )}
              <button onClick={() => handleDeleteDoc(selected.id)}
                className="w-full flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                <Trash2 size={12} />Supprimer définitivement
              </button>
            </div>

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
          { label: 'En attente de signature', value: String(docs.filter(d => effectiveStatus(d) === 'En attente').length), color: 'text-amber-600' },
          { label: 'Signés', value: String(docs.filter(d => effectiveStatus(d) === 'Signé').length), color: 'text-green-600' },
          { label: 'Expirés', value: String(docs.filter(d => effectiveStatus(d) === 'Expiré').length), color: 'text-red-600' },
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
                  <td className="px-4 py-3"><StatusBadge status={effectiveStatus(doc)} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={e => { e.stopPropagation(); handleDeleteDoc(doc.id) }} className="p-1 rounded hover:bg-red-50 transition-colors">
                        <Trash2 size={13} className="text-gray-300 hover:text-red-400" />
                      </button>
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  </td>
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
                <label className="text-[11px] text-gray-500 mb-1 block">Fichier à signer (optionnel)</label>
                <label className="flex items-center gap-2 w-full px-3 py-2 text-xs border border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:text-indigo-500 text-gray-400 transition-colors">
                  <Upload size={13} />
                  <span className="truncate">{file ? file.name : 'Choisir un fichier (PDF, image…)'}</span>
                  <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Échéance</label>
                <input value={deadline} onChange={e => setDeadline(e.target.value)} type="date" min={new Date().toISOString().slice(0, 10)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-gray-700" />
              </div>
              {orgMembers.length > 0 && (
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">Membres de l'organisation</label>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-32 overflow-y-auto">
                    {orgMembers.map(m => {
                      const userId = m.publicUserData!.userId!
                      const name = [m.publicUserData?.firstName, m.publicUserData?.lastName].filter(Boolean).join(' ') || m.publicUserData?.identifier || 'Membre'
                      const checked = memberSignerIds.includes(userId)
                      return (
                        <button key={m.id} type="button" onClick={() => setMemberSignerIds(prev => checked ? prev.filter(id => id !== userId) : [...prev, userId])}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left">
                          <span className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                            {checked && <Check size={10} className="text-white" />}
                          </span>
                          <span className="text-xs text-gray-700 truncate">{name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Signataires externes (sans compte MBOKA)</label>
                <div className="space-y-2">
                  {parties.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={p} onChange={e => setParties(prev => prev.map((v, j) => j === i ? e.target.value : v))} placeholder={`Nom du signataire ${i + 1}`}
                        className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                      <button onClick={() => setParties(prev => prev.filter((_, j) => j !== i))} className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  ))}
                  <button onClick={() => setParties(prev => [...prev, ''])}
                    className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-gray-200 text-gray-400 text-xs font-medium rounded-lg hover:border-indigo-300 hover:text-indigo-500 transition-colors">
                    <Plus size={12} />Ajouter un signataire externe
                  </button>
                </div>
              </div>
            </div>
            {(error || createError) && (
              <p className="mt-3 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{createError ?? error}</p>
            )}
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Annuler</button>
              <button onClick={handleCreate} disabled={creating}
                className="flex-1 px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {creating ? 'Création…' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
