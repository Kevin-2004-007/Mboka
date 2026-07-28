import { createClerkClient, verifyToken } from '@clerk/backend'
import { isClerkAPIResponseError } from '@clerk/backend/errors'

// Runs server-side only (Netlify Function) — this is the one place in the
// project allowed to hold CLERK_SECRET_KEY, since Clerk's Backend API is
// the only way to set `redirectUrl` on an org invitation. The frontend SDK's
// organization.inviteMember() has no such parameter, so invitations sent
// from the browser always fell back to Clerk's Account Portal, which can't
// reliably redirect back into MBOKA (see AcceptInvitation.tsx).
const secretKey = process.env.CLERK_SECRET_KEY

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }
  if (!secretKey) {
    return new Response(JSON.stringify({ error: 'CLERK_SECRET_KEY manquante côté serveur.' }), { status: 500 })
  }

  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) {
    return new Response(JSON.stringify({ error: 'Session manquante.' }), { status: 401 })
  }

  let payload: Record<string, any>
  try {
    payload = await verifyToken(token, { secretKey })
  } catch {
    return new Response(JSON.stringify({ error: 'Session invalide ou expirée.' }), { status: 401 })
  }

  // Trust only what the verified token says about the caller's org/role —
  // never a client-supplied org id or role, so this endpoint can't be used
  // to invite an admin into an organization the caller doesn't control.
  const orgId: string | undefined = payload.o?.id ?? payload.org_id
  const orgRole: string | undefined = payload.o?.rol ?? payload.org_role
  if (!orgId || (orgRole !== 'admin' && orgRole !== 'org:admin')) {
    return new Response(JSON.stringify({ error: "Vous devez être administrateur de l'organisation pour inviter un membre." }), { status: 403 })
  }

  let body: { emailAddress?: string; role?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Requête invalide.' }), { status: 400 })
  }

  const emailAddress = body.emailAddress?.trim()
  if (!emailAddress) {
    return new Response(JSON.stringify({ error: 'Adresse email requise.' }), { status: 400 })
  }
  const role = body.role === 'org:admin' ? 'org:admin' : 'org:member'

  const appUrl = process.env.URL || process.env.DEPLOY_URL || 'http://localhost:8443'
  const clerk = createClerkClient({ secretKey })

  try {
    const invitation = await clerk.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress,
      role,
      redirectUrl: appUrl,
    })
    return new Response(JSON.stringify({ id: invitation.id, status: invitation.status }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err) {
    // ClerkAPIResponseError's top-level .message is a generic HTTP status
    // string (e.g. "Bad Request") — the actionable detail is in .errors.
    const message = isClerkAPIResponseError(err)
      ? err.errors.map(e => e.longMessage ?? e.message).join(' ')
      : err instanceof Error ? err.message : "Impossible d'envoyer l'invitation."
    console.error('invite-member failed:', JSON.stringify(err))
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
