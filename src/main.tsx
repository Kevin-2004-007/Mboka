import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import { frFR } from '@clerk/localizations'
import App from './App'
import { CLERK_PUBLISHABLE_KEY, isClerkConfigured } from './auth/clerk-config'
import { SignPage } from './public/SignPage'
import './index.css'

// /sign/{token} is a public page for an external e-signature signer, who has
// no Clerk account — it must render outside ClerkProvider, before anything
// in App.tsx assumes a signed-in (or even configured-Clerk) context.
const signMatch = /^\/sign\/([^/]+)\/?$/.exec(window.location.pathname)

const app = signMatch ? (
  <SignPage token={signMatch[1]} />
) : isClerkConfigured ? (
  <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} localization={frFR}>
    <App />
  </ClerkProvider>
) : (
  <App />
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{app}</React.StrictMode>,
)
