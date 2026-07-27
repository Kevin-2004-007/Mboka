import { useRef, useState } from 'react'
import { useOrganization } from '@clerk/react'
import { Upload, CheckCircle, Download, Paperclip } from 'lucide-react'
import { StatusBadge, formatEur, TableHeader } from '../App'
import { TableSkeleton } from '../ui/Skeleton'
import { useSupabaseClient } from '../lib/supabase'
import { useExpenses } from '../data/expenses'

const categories = ['Déplacement', 'Repas client', 'Matériel', 'Formation', 'Logiciel', 'Hébergement', 'Autre']

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

export function LiveExpenses() {
  const { data: expenses, loading, error, insert } = useExpenses()
  const { organization } = useOrganization()
  const supabase = useSupabaseClient()

  const [tab, setTab] = useState<'list' | 'submit'>('list')
  const [statusFilter, setStatusFilter] = useState('Toutes')
  const [category, setCategory] = useState('Déplacement')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const statuses = ['Toutes', 'Soumise', 'Validée', 'Remboursée']
  const filtered = expenses.filter(e => statusFilter === 'Toutes' || e.status === statusFilter)

  const submittedThisMonth = expenses.length
  const pendingCount = expenses.filter(e => e.status === 'Soumise').length
  const totalReimbursed = expenses.filter(e => e.status === 'Remboursée').reduce((s, e) => s + Number(e.amount), 0)

  async function handleDownload(path: string) {
    const { data } = await supabase.storage.from('attachments').createSignedUrl(path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function handleSubmit() {
    if (!amount || !organization) return
    setUploading(true)
    setUploadError(null)
    let receiptPath: string | null = null
    if (file) {
      receiptPath = `${organization.id}/expenses/${crypto.randomUUID()}-${file.name}`
      const { error: uploadErr } = await supabase.storage.from('attachments').upload(receiptPath, file)
      if (uploadErr) {
        setUploading(false)
        setUploadError(uploadErr.message)
        return
      }
    }
    const created = await insert({
      number: `NF-${Date.now()}`,
      category,
      amount: Number(amount) || 0,
      spent_on: new Date().toISOString().slice(0, 10),
      description: description || null,
      status: 'Soumise',
      receipt_path: receiptPath,
    })
    setUploading(false)
    if (!created) return
    setSubmitted(true)
  }

  function resetForm() {
    setSubmitted(false)
    setAmount('')
    setDescription('')
    setFile(null)
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit mb-6">
        {(['list', 'submit'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setSubmitted(false) }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'list' ? 'Liste des notes de frais' : 'Soumettre une note'}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Soumises', value: String(submittedThisMonth), color: 'text-blue-600' },
              { label: 'En attente de validation', value: String(pendingCount), color: 'text-amber-600' },
              { label: 'Total remboursé', value: formatEur(totalReimbursed), color: 'text-green-600' },
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
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-xs">
              <TableHeader cols={['N°', 'Catégorie', 'Montant', 'Description', 'Date', 'Reçu', 'Statut']} />
              <tbody>
                {filtered.map((exp, i) => (
                  <tr key={exp.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-4 py-3 font-mono text-gray-400 text-[11px]">{exp.number}</td>
                    <td className="px-4 py-3"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[11px] font-medium">{exp.category}</span></td>
                    <td className="px-4 py-3 font-semibold text-gray-900 tabular-nums">{formatEur(Number(exp.amount))}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{exp.description ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(exp.spent_on)}</td>
                    <td className="px-4 py-3">
                      {exp.receipt_path ? (
                        <button onClick={() => handleDownload(exp.receipt_path!)} className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700">
                          <Download size={11} />Voir
                        </button>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={exp.status} /></td>
                  </tr>
                ))}
                {loading && <TableSkeleton cols={7} />}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Aucune note de frais pour l'instant.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'submit' && (
        <div className="max-w-2xl">
          {submitted ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4"><CheckCircle size={24} className="text-green-500" /></div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Note de frais soumise</h3>
              <p className="text-xs text-gray-400">Votre note de frais a été envoyée pour validation.</p>
              <button onClick={resetForm}
                className="mt-5 px-4 py-2 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">Soumettre une autre note</button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Nouvelle note de frais</h2>
                <p className="text-xs text-gray-400 mt-0.5">Joignez votre justificatif et remplissez les informations ci-dessous</p>
              </div>
              <div className="p-5 grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Justificatif (reçu / facture)</label>
                  <input ref={fileInputRef} type="file" accept="application/pdf,image/*" className="hidden"
                    onChange={e => setFile(e.target.files?.[0] ?? null)} />
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer">
                    {file ? (
                      <div className="flex items-center justify-center gap-2 text-gray-700">
                        <Paperclip size={16} className="text-indigo-500" /><span className="text-xs font-medium">{file.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={20} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-medium">Cliquer pour <span className="text-indigo-600 underline">parcourir</span></p>
                        <p className="text-[11px] text-gray-400 mt-1">PDF, JPEG, PNG — max 10 Mo</p>
                      </>
                    )}
                  </button>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Catégorie</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white text-gray-700">
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Montant TTC (€)</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                    placeholder="Décrivez brièvement la dépense et son contexte professionnel…"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none placeholder:text-gray-400" />
                </div>
              </div>
              {(error || uploadError) && (
                <div className="px-5">
                  <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{uploadError ?? error}</p>
                </div>
              )}
              <div className="px-5 pb-5 pt-5 flex gap-2">
                <button onClick={handleSubmit} disabled={!amount || uploading}
                  className="flex-1 px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {uploading ? 'Envoi…' : 'Soumettre pour validation'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
