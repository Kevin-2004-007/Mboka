import { useState } from 'react'
import { SignIn, SignUp } from '@clerk/react'
import { Users, Target, CreditCard, Package, MessageSquare, BarChart3, Building2, UserPlus, ToggleLeft } from 'lucide-react'
import { clerkAppearance } from './appearance'
import mbokaIcon from '../imports/mboka-icon-1a.png'

const moduleChips = ['RH', 'CRM', 'Finance', 'Stock', 'Support', 'Projets']

const employeeRows = [
  { initials: 'MD', name: 'Marie Dupont' },
  { initials: 'TM', name: 'Thomas Martin' },
  { initials: 'SB', name: 'Sophie Bernard' },
]

const kpiBars = [35, 55, 40, 70, 90, 60, 80]

const features = [
  { Icon: Users, title: 'RH', desc: 'Employés, congés et absences centralisés.' },
  { Icon: Target, title: 'CRM', desc: 'Pipeline de deals en kanban, mis à jour en temps réel.' },
  { Icon: CreditCard, title: 'Finance', desc: 'Factures, statuts et relances en un clic.' },
  { Icon: Package, title: 'Stock', desc: 'Suivi des références et alertes de rupture.' },
  { Icon: MessageSquare, title: 'Support', desc: 'Tickets, priorités et SLA suivis en direct.' },
  { Icon: BarChart3, title: 'Projets', desc: 'Avancement, budgets et feuilles de temps.' },
]

const steps = [
  { Icon: Building2, title: 'Créez votre organisation', desc: 'Un espace de travail dédié à votre entreprise, prêt en une minute.' },
  { Icon: UserPlus, title: 'Invitez votre équipe', desc: 'Ajoutez vos collègues par e-mail, avec le rôle qui leur correspond.' },
  { Icon: ToggleLeft, title: 'Activez vos modules', desc: 'Choisissez les modules dont vous avez besoin — désactivez le reste.' },
]

export function LoginScreen({ onDemo }: { onDemo: () => void }) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')

  function goToAuth(next: 'sign-in' | 'sign-up') {
    setMode(next)
    document.getElementById('auth-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function goToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[#FBFBFD]">
      {/* Header — floating pill nav, fixed in place while scrolling */}
      <header className="fixed top-4 inset-x-4 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 bg-white rounded-2xl shadow-lg shadow-black/[0.08] px-5 h-16">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <img src={mbokaIcon} alt="MBOKA" className="w-7 h-7 rounded-md flex-shrink-0" />
            <span className="font-display font-bold text-slate-800 text-sm tracking-tight">MBOKA</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => goToSection('features')} className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
              Fonctionnalités
            </button>
            <button onClick={() => goToSection('how-it-works')} className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
              Comment ça marche
            </button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button onClick={onDemo} className="hidden sm:block text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
              Voir la démo
            </button>
            <button onClick={() => goToAuth('sign-in')} className="text-xs font-medium text-slate-600 border border-slate-200 rounded-lg px-3.5 py-2 hover:border-slate-300 hover:text-slate-900 transition-colors">
              Connexion
            </button>
            <button onClick={() => goToAuth('sign-up')} className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-2 transition-colors">
              Créer un compte
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden bg-[linear-gradient(160deg,#FDF6EC_0%,#F8EAD9_35%,#F4E3CD_65%,#FBFBFD_100%)]">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[40rem] h-[26rem] rounded-full bg-white/60 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -left-24 w-80 h-80 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="pointer-events-none absolute top-64 -right-24 w-80 h-80 rounded-full bg-teal-200/25 blur-3xl" />

        <div className="relative flex flex-col items-center px-6 pt-32 pb-16">
          <h1 className="font-display font-extrabold text-[2.75rem] sm:text-5xl leading-[1.15] text-slate-800 tracking-tight text-center max-w-2xl">
            Tout votre business sur{' '}
            <span className="relative inline-block whitespace-nowrap">
              <span className="absolute inset-x-0 bottom-1.5 h-4 sm:h-5 bg-indigo-300/60 -rotate-1 rounded" />
              <span className="relative">un seul système</span>
            </span>
            .
          </h1>
          <p className="text-[15px] text-slate-500 leading-relaxed text-center max-w-md mt-5">
            Conçu pour les équipes qui veulent avancer vite, sans jongler entre dix outils différents.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-lg">
            {moduleChips.map(m => (
              <span key={m} className="text-xs font-medium text-slate-600 bg-white/80 border border-slate-200/80 rounded-full px-3 py-1.5 shadow-sm">
                {m}
              </span>
            ))}
          </div>

          {/* Auth card, with the product-preview cluster floating behind it */}
          <div id="auth-card" className="relative w-full max-w-3xl mt-14 flex justify-center scroll-mt-24">
            <div className="hidden lg:block absolute left-0 top-6 w-52 bg-white rounded-2xl shadow-2xl shadow-black/10 p-4 -rotate-6 hover:rotate-0 transition-transform duration-500">
              <p className="text-[11px] font-semibold text-slate-700 mb-3">Gérez vos <span className="text-indigo-600">employés</span></p>
              <div className="space-y-2.5">
                {employeeRows.map(e => (
                  <div key={e.initials} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-semibold flex items-center justify-center flex-shrink-0">{e.initials}</span>
                    <span className="text-[11px] text-slate-600 truncate">{e.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:block absolute right-2 top-0 w-60 bg-white rounded-2xl shadow-2xl shadow-black/10 p-5 rotate-3 hover:rotate-0 transition-transform duration-500">
              <p className="text-[11px] text-slate-400 mb-0.5">Bienvenue 👋</p>
              <p className="text-sm font-semibold text-slate-800 mb-4">Tableau de bord</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide">CA du mois</p>
                  <p className="text-base font-bold text-indigo-600">128 450 €</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide">Effectifs</p>
                  <p className="text-base font-bold text-slate-800">247</p>
                </div>
              </div>
              <div className="flex items-end gap-1 h-10">
                {kpiBars.map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm bg-indigo-500" style={{ height: `${h}%`, opacity: 0.4 + (i / kpiBars.length) * 0.6 }} />
                ))}
              </div>
            </div>

            <div className="hidden lg:flex absolute right-16 top-52 bg-white rounded-xl shadow-xl shadow-black/10 px-3 py-2.5 -rotate-3 items-center gap-2 hover:rotate-0 transition-transform duration-500">
              <span className="w-7 h-7 rounded-full bg-teal-50 text-teal-700 text-[10px] font-semibold flex items-center justify-center flex-shrink-0">LP</span>
              <div>
                <p className="text-[11px] font-medium text-slate-800 leading-tight">Lucas Petit</p>
                <p className="text-[9px] text-slate-400 leading-tight">Deal · Négociation</p>
              </div>
            </div>

            <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-5">
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full p-1 shadow-sm">
                {(['sign-in', 'sign-up'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === m ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {m === 'sign-in' ? 'Connexion' : 'Inscription'}
                  </button>
                ))}
              </div>

              <div className="w-full">
                {mode === 'sign-in'
                  ? <SignIn routing="hash" appearance={clerkAppearance} />
                  : <SignUp routing="hash" appearance={clerkAppearance} />}
              </div>

              <button onClick={onDemo} className="text-xs text-slate-400 hover:text-indigo-600 transition-colors">
                Voir la démo sans compte →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div id="features" className="max-w-5xl mx-auto px-6 py-20 scroll-mt-24">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-800 text-center mb-2">
          Tout ce qu'il faut pour <span className="text-indigo-600">piloter votre entreprise</span>
        </h2>
        <p className="text-sm text-slate-500 text-center max-w-md mx-auto mb-12">
          Seize modules, un seul design system, une seule organisation.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f.title} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-lg hover:shadow-black/5 transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <f.Icon size={18} className="text-indigo-600" />
              </div>
              <p className="text-sm font-semibold text-slate-800 mb-1">{f.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div id="how-it-works" className="bg-[#F7F1E8] scroll-mt-24">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-800 text-center mb-12">
            En route en <span className="text-indigo-600">trois étapes</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={s.title} className="relative bg-white rounded-2xl p-6 shadow-sm">
                <span className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                  <s.Icon size={18} className="text-indigo-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-1.5">{s.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-10">
            <button onClick={() => goToAuth('sign-up')}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-full px-6 py-3 transition-colors">
              Commencer maintenant →
            </button>
          </div>
        </div>
      </div>

      {/* Footer — dark watermark band */}
      <footer className="relative bg-[#0B0F19] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none">
          <span className="font-display font-extrabold text-[9rem] sm:text-[13rem] text-white/[0.04] leading-none whitespace-nowrap">MBOKA</span>
        </div>

        <div className="relative max-w-2xl mx-auto text-center px-6 pt-20 pb-14">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-3 leading-tight">
            Rejoignez l'aventure <span className="text-indigo-400">MBOKA</span>
          </h2>
          <p className="text-sm text-gray-400 mb-8">
            Créez votre organisation et invitez votre équipe en quelques minutes.
          </p>
          <button onClick={() => goToAuth('sign-up')}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-full px-6 py-3 transition-colors">
            Créer mon organisation →
          </button>
        </div>

        <div className="relative border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img src={mbokaIcon} alt="MBOKA" className="w-5 h-5 rounded" />
              <span className="text-xs text-gray-400">© 2026 MBOKA — Tous droits réservés</span>
            </div>
            <p className="text-[11px] text-gray-500">L'OS qui fait tourner votre entreprise.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
