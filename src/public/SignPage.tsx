import { useEffect, useState } from 'react'
import { CheckCircle, FileText, Loader2 } from 'lucide-react'
import mbokaIcon from '../imports/mboka-icon-1a.png'
import { createPublicSupabaseClient } from '../lib/supabase'

type SignerInfo = {
  document_title: string
  document_deadline: string | null
  document_status: string
  document_storage_path: string | null
  signer_id: string
  signer_name: string
  signer_done: boolean
}

function formatDate(value: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value))
}

export function SignPage({ token }: { token: string }) {
  const [supabase] = useState(() => createPublicSupabaseClient())
  const [info, setInfo] = useState<SignerInfo | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [signing, setSigning] = useState(false)
  const [justSigned, setJustSigned] = useState(false)
  const [confirmName, setConfirmName] = useState('')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_esign_signer_by_token', { p_token: token }).maybeSingle()
    if (error || !data) {
      setNotFound(true)
      setLoading(false)
      return
    }
    setInfo(data as SignerInfo)
    const path = (data as SignerInfo).document_storage_path
    if (path) {
      const { data: signed, error: signError } = await supabase.storage.from('attachments').createSignedUrl(path, 3600)
      if (signError) setFileError(signError.message)
      else setFileUrl(signed?.signedUrl ?? null)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleSign() {
    setSigning(true)
    await supabase.rpc('sign_esign_by_token', { p_token: token })
    setSigning(false)
    setJustSigned(true)
    await load()
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center px-4 py-10">
      <img src={mbokaIcon} alt="MBOKA" className="w-10 h-10 rounded-xl mb-6" />

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
          </div>
        )}

        {!loading && notFound && (
          <div className="text-center py-10">
            <p className="text-sm font-semibold text-gray-900 mb-1">Lien invalide</p>
            <p className="text-xs text-gray-400">Ce lien de signature n'existe pas ou a expiré.</p>
          </div>
        )}

        {!loading && info && (
          <>
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{info.document_title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Pour signature de <span className="font-medium text-gray-600">{info.signer_name}</span>
                  {formatDate(info.document_deadline) && ` · échéance le ${formatDate(info.document_deadline)}`}
                </p>
              </div>
            </div>

            {fileUrl ? (
              <a href={fileUrl} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 mb-5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <FileText size={13} />Ouvrir le document
              </a>
            ) : fileError ? (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 mb-5">Impossible de charger le fichier : {fileError}</p>
            ) : (
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2.5 mb-5">Aucun fichier n'a été joint à cette demande.</p>
            )}

            {info.document_status === 'Expiré' ? (
              <p className="text-center text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg py-3">Cette demande de signature a été annulée.</p>
            ) : info.signer_done || justSigned ? (
              <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 border border-green-100 rounded-lg py-3">
                <CheckCircle size={14} />
                <p className="text-xs font-medium">Vous avez signé ce document.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">Tapez votre nom complet pour confirmer votre identité</label>
                  <input value={confirmName} onChange={e => setConfirmName(e.target.value)} placeholder={info.signer_name}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                </div>
                <button onClick={handleSign} disabled={signing || confirmName.trim().toLowerCase() !== info.signer_name.trim().toLowerCase()}
                  className="w-full py-2.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  {signing ? 'Signature…' : 'Je signe ce document'}
                </button>
                <p className="text-[10px] text-gray-300 text-center">Signature électronique simple — sans valeur légale probatoire.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
