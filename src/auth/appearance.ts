// Shared theme so every Clerk component (SignIn, SignUp, UserButton) matches
// the rest of the app instead of looking like default Clerk UI.
export const clerkAppearance = {
  variables: {
    colorPrimary: '#4F46E5',
    colorForeground: '#111827',
    colorMutedForeground: '#6B7280',
    colorBackground: '#FFFFFF',
    colorInput: '#FFFFFF',
    colorInputForeground: '#111827',
    colorDanger: '#DC2626',
    colorSuccess: '#16A34A',
    colorWarning: '#D97706',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    borderRadius: '10px',
  },
}
