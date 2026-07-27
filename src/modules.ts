import {
  LayoutDashboard, Users, Target, CreditCard, Calculator,
  ShoppingCart, Package, Settings as SettingsIcon,
  Receipt, FolderOpen, MessageSquare,
  BarChart3, PenLine, Workflow, ShieldCheck, Activity,
} from 'lucide-react'

export type Module =
  | 'dashboard' | 'hr' | 'crm' | 'finance' | 'accounting'
  | 'procurement' | 'stock' | 'expenses' | 'projects' | 'support'
  | 'documents' | 'esign' | 'bi' | 'automations' | 'quality' | 'settings'

// Always visible regardless of the "modules actifs" onboarding selection.
export const ALWAYS_ON_MODULES: Module[] = ['dashboard', 'settings']

export const navItems: { id: Module; label: string; Icon: React.ElementType; group?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'hr', label: 'Ressources Humaines', Icon: Users, group: 'Modules' },
  { id: 'crm', label: 'CRM', Icon: Target, group: 'Modules' },
  { id: 'finance', label: 'Finance', Icon: CreditCard, group: 'Modules' },
  { id: 'accounting', label: 'Comptabilité', Icon: Calculator, group: 'Modules' },
  { id: 'procurement', label: 'Achats', Icon: ShoppingCart, group: 'Modules' },
  { id: 'stock', label: 'Stock & Inventaire', Icon: Package, group: 'Modules' },
  { id: 'expenses', label: 'Notes de frais', Icon: Receipt, group: 'Modules' },
  { id: 'projects', label: 'Projets', Icon: BarChart3, group: 'Modules' },
  { id: 'support', label: 'Support client', Icon: MessageSquare, group: 'Modules' },
  { id: 'documents', label: 'Documents (GED)', Icon: FolderOpen, group: 'Modules' },
  { id: 'esign', label: 'Signature électronique', Icon: PenLine, group: 'Modules' },
  { id: 'bi', label: 'Business Intelligence', Icon: Activity, group: 'Modules' },
  { id: 'automations', label: 'Automatisations', Icon: Workflow, group: 'Modules' },
  { id: 'quality', label: 'Qualité / Conformité', Icon: ShieldCheck, group: 'Modules' },
  { id: 'settings', label: 'Paramètres', Icon: SettingsIcon, group: 'Admin' },
]

export const moduleConfig: Record<Module, { title: string; actionLabel?: string }> = {
  dashboard: { title: 'Dashboard' },
  hr: { title: 'Ressources Humaines', actionLabel: 'Nouvel employé' },
  crm: { title: 'CRM — Pipeline', actionLabel: 'Nouveau deal' },
  finance: { title: 'Finance — Factures', actionLabel: 'Nouvelle facture' },
  accounting: { title: 'Comptabilité' },
  procurement: { title: 'Achats', actionLabel: 'Bon de commande' },
  stock: { title: 'Stock & Inventaire', actionLabel: 'Mouvement de stock' },
  expenses: { title: 'Notes de frais' },
  projects: { title: 'Projets & Time tracking', actionLabel: 'Nouveau projet' },
  support: { title: 'Support client', actionLabel: 'Nouveau ticket' },
  documents: { title: 'Documents (GED)', actionLabel: 'Déposer un fichier' },
  esign: { title: 'Signature électronique', actionLabel: 'Nouvelle demande' },
  bi: { title: 'Business Intelligence' },
  automations: { title: 'Automatisations' },
  quality: { title: 'Qualité & Conformité', actionLabel: 'Nouvel audit' },
  settings: { title: 'Paramètres' },
}
