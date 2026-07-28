import { useEffect, useState } from 'react'
import { useSignIn, useSignUp } from '@clerk/react'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import mbokaIcon from '../imports/mboka-icon-1a.png'

// Reads the invitation ticket Clerk appends to the link in invite emails
// (e.g. https://app.example.com/?__clerk_ticket=...) once, on first mount —
// this must stay stable across re-renders even after the param is stripped
// from the URL bar below.
export function useInvitationTicket() {
  const [ticket] = useState(() => new URLSearchParams(window.location.search).get('__clerk_ticket'))
  return ticket
}

type State = 'working' | 'needs-name' | 'done' | 'error'

// Handles an org invitation link entirely inside MBOKA instead of Clerk's
// hosted Account Portal — the Account Portal redirect depends on Clerk
// resolving which host to send the user back to ($DEVHOST on development
// instances), which doesn't work reliably for a real invitee opening the
// email on a device that's never loaded this app before. This flow avoids
// that: it consumes the ticket directly via the client SDK, right here.
export function AcceptInvitationScreen({ ticket }: { ticket: string }) {
  const { signUp } = useSignUp()
  const { signIn } = useSignIn()
  const [state, setState] = useState<State>('working')
  const [message, setMessage] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // The ticket is single-use server-side, so React StrictMode's double-
    // invoke (or any re-render) must not fire this twice.
    let cancelled = false

    async function run() {
      const signUpAttempt = await signUp.ticket({ ticket })
      if (cancelled) return

      if (!signUpAttempt.error) {
        if (signUp.status === 'complete') {
          await signUp.finalize()
          if (!cancelled) setState('done')
          return
        }
        // Most common case: the instance requires first/last name, which a
        // bare ticket doesn't supply — collect it here instead of failing.
        if (signUp.status === 'missing_requirements') {
          if (!cancelled) setState('needs-name')
          return
        }
        if (!cancelled) {
          setState('error')
          setMessage(`Statut inattendu (${signUp.status}). Contactez la personne qui vous a invité.`)
        }
        return
      }

      // A ticket only needs the sign-in path when the person already has a
      // Clerk account under this email — any other sign-up error is the
      // real problem and shouldn't be masked by a secondary attempt.
      if (signUpAttempt.error.code !== 'form_identifier_exists' && signUpAttempt.error.code !== 'identifier_already_signed_in') {
        if (!cancelled) {
          setState('error')
          setMessage(signUpAttempt.error.longMessage ?? signUpAttempt.error.message)
        }
        return
      }

      const signInAttempt = await signIn.ticket({ ticket })
      if (cancelled) return
      if (!signInAttempt.error && signIn.status === 'complete') {
        await signIn.finalize()
        if (!cancelled) setState('done')
        return
      }

      setState('error')
      setMessage(signInAttempt.error?.longMessage ?? signInAttempt.error?.message ?? signUpAttempt.error.longMessage ?? signUpAttempt.error.message)
    }

    run()
    // Drop the ticket from the URL immediately so a refresh doesn't retry
    // an already-consumed (or now-invalid) ticket.
    window.history.replaceState({}, '', window.location.pathname)

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket])

  async function handleSubmitName() {
    if (!firstName.trim() || !lastName.trim()) return
    setSubmitting(true)
    const { error } = await signUp.update({ firstName: firstName.trim(), lastName: lastName.trim() })
    setSubmitting(false)
    if (error) {
      setState('error')
      setMessage(error.longMessage ?? error.message)
      return
    }
    if (signUp.status === 'complete') {
      await signUp.finalize()
      setState('done')
    } else {
      setState('error')
      setMessage(`Statut inattendu (${signUp.status}). Contactez la personne qui vous a invité.`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 text-center">
        <img src={mbokaIcon} alt="MBOKA" className="w-10 h-10 rounded-xl mx-auto mb-4" />
        {state === 'working' && (
          <>
            <Loader2 size={20} className="animate-spin text-indigo-500 mx-auto mb-3" />
            <p className="text-xs text-gray-500">Traitement de votre invitation…</p>
          </>
        )}
        {state === 'needs-name' && (
          <div className="text-left">
            <p className="text-xs text-gray-500 mb-4 text-center">Encore une étape pour rejoindre l'organisation</p>
            <div className="space-y-3">
              <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Prénom"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
              <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nom"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
              <button onClick={handleSubmitName} disabled={submitting || !firstName.trim() || !lastName.trim()}
                className="w-full py-2.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors">
                {submitting ? 'Validation…' : 'Continuer'}
              </button>
            </div>
          </div>
        )}
        {state === 'done' && (
          <>
            <CheckCircle2 size={20} className="text-green-500 mx-auto mb-3" />
            <p className="text-xs text-gray-600">Invitation acceptée — vous allez être redirigé…</p>
          </>
        )}
        {state === 'error' && (
          <>
            <AlertTriangle size={20} className="text-amber-500 mx-auto mb-3" />
            <p className="text-xs text-gray-600">{message}</p>
          </>
        )}
      </div>
    </div>
  )
}
