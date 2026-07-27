import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import { frFR } from '@clerk/localizations'
import App from './App'
import { CLERK_PUBLISHABLE_KEY, isClerkConfigured } from './auth/clerk-config'
import './index.css'

const app = isClerkConfigured ? (
  <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} localization={frFR}>
    <App />
  </ClerkProvider>
) : (
  <App />
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{app}</React.StrictMode>,
)
