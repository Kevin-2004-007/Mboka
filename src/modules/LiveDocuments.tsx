import { useRef, useState } from 'react'
import { useOrganization } from '@clerk/react'
import { Search, Folder, List, Grid, Upload, Trash2, Download } from 'lucide-react'
import { DocIcon, TableHeader, docFolders } from '../App'
import { TableSkeleton } from '../ui/Skeleton'
import { useSupabaseClient } from '../lib/supabase'
import { useDocuments } from '../data/documents'

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function fileTypeOf(file: File): string {
  if (/\.(xlsx?|csv)$/i.test(file.name)) return 'xls'
  if (file.type.startsWith('image/')) return 'img'
  return 'pdf'
}

export function LiveDocuments() {
  const { data: documents, loading, error, insert, remove } = useDocuments()
  const { organization } = useOrganization()
  const supabase = useSupabaseClient()

  const [activeFolder, setActiveFolder] = useState('Tous')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [search, setSearch] = useState('')
  const [folderForUpload, setFolderForUpload] = useState(docFolders[0])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = documents.filter(d => {
    const matchFolder = activeFolder === 'Tous' || d.folder === activeFolder
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase())
    return matchFolder && matchSearch
  })

  async function handleUpload(file: File) {
    if (!organization) return
    setUploading(true)
    setUploadError(null)
    const path = `${organization.id}/documents/${crypto.randomUUID()}-${file.name}`
    const { error: storageError } = await supabase.storage.from('attachments').upload(path, file)
    if (storageError) {
      setUploadError(storageError.message)
      setUploading(false)
      return
    }
    await insert({
      name: file.name,
      folder: folderForUpload,
      size_bytes: file.size,
      file_type: fileTypeOf(file),
      storage_path: path,
      updated_at: new Date().toISOString(),
    })
    setUploading(false)
  }

  async function handleDownload(path: string | null) {
    if (!path) return
    const { data } = await supabase.storage.from('attachments').createSignedUrl(path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function handleDelete(id: string, path: string | null) {
    if (!window.confirm('Supprimer ce document ?')) return
    if (path) await supabase.storage.from('attachments').remove([path])
    await remove(id)
  }

  return (
    <div className="flex h-full">
      <aside className="w-48 flex-shrink-0 border-r border-gray-100 bg-gray-50/50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-2 mb-2">Dossiers</p>
        <div className="space-y-0.5">
          {['Tous', ...docFolders].map(f => (
            <button key={f} onClick={() => setActiveFolder(f)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${activeFolder === f ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700 hover:bg-white/70'}`}>
              <Folder size={13} className={activeFolder === f ? 'text-indigo-500' : 'text-gray-400'} />
              {f}
              <span className="ml-auto text-[10px] text-gray-400">{f === 'Tous' ? documents.length : documents.filter(d => d.folder === f).length}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 p-5 min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Recherche plein texte…"
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
          </div>
          <select value={folderForUpload} onChange={e => setFolderForUpload(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
            {docFolders.map(f => <option key={f}>{f}</option>)}
          </select>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}><List size={13} /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}><Grid size={13} /></button>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = '' }} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            <Upload size={12} />{uploading ? 'Envoi…' : 'Déposer'}
          </button>
        </div>

        {(error || uploadError) && (
          <p className="mb-4 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{uploadError ?? error}</p>
        )}

        {viewMode === 'list' ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-xs">
              <TableHeader cols={['', 'Nom', 'Dossier', 'Modifié le', 'Taille', '']} />
              <tbody>
                {filtered.map((doc, i) => (
                  <tr key={doc.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-4 py-3 w-8"><DocIcon type={doc.file_type ?? 'pdf'} /></td>
                    <td className="px-4 py-3 font-medium text-gray-900">{doc.name}</td>
                    <td className="px-4 py-3"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[11px] font-medium">{doc.folder}</span></td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(doc.updated_at)}</td>
                    <td className="px-4 py-3 text-gray-400 tabular-nums">{formatSize(doc.size_bytes)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDownload(doc.storage_path)} className="p-1 rounded hover:bg-gray-100 transition-colors"><Download size={14} className="text-gray-400" /></button>
                        <button onClick={() => handleDelete(doc.id, doc.storage_path)} className="p-1 rounded hover:bg-red-50 transition-colors"><Trash2 size={14} className="text-gray-300 hover:text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {loading && <TableSkeleton cols={6} />}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Aucun document pour l'instant.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map(doc => (
              <div key={doc.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <DocIcon type={doc.file_type ?? 'pdf'} />
                  <button onClick={() => handleDelete(doc.id, doc.storage_path)} className="p-0.5 rounded hover:bg-red-50 transition-colors"><Trash2 size={13} className="text-gray-300 hover:text-red-400" /></button>
                </div>
                <p className="text-xs font-medium text-gray-900 leading-snug mb-2 line-clamp-2">{doc.name}</p>
                <div className="flex items-center justify-between">
                  <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] font-medium">{doc.folder}</span>
                  <span className="text-[10px] text-gray-400">{formatSize(doc.size_bytes)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
