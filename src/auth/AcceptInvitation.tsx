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

// Handles an org invitation link entirely inside MBOKA instead of Clerk's
// hosted Account Portal — the Account Portal redirect depends on Clerk
// resolving which host to send the user back to ($DEVHOST on development
// instances), which doesn't work reliably for a real invitee opening the
// email on a device that's never loaded this app before. This flow avoids
// that: it consumes the ticket directly via the client SDK, right here.
//
// A ticket can belong to either a brand-new person (sign-up) or someone who
// already has a Clerk account (sign-in) — there's no way to know which in
// advance, so this tries sign-up first and falls back to sign-in.
export function AcceptInvitationScreen({ ticket }: { ticket: string }) {
  const { signUp } = useSignUp()
  const { signIn } = useSignIn()
  const [state, setState] = useState<'working' | 'done' | 'error'>('working')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    // The ticket is single-use server-side, so React StrictMode's double-
    // invoke (or any re-render) must not fire this twice.
    let cancelled = false

    async function run() {
      const signUpAttempt = await signUp.ticket({ ticket })
      if (cancelled) return
      if (!signUpAttempt.error && signUp.status === 'complete') {
        await signUp.finalize()
        if (!cancelled) setState('done')
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
      setMessage(signInAttempt.error?.message ?? signUpAttempt.error?.message ?? "Ce lien d'invitation n'est plus valide.")
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
