import { useState, useEffect, useRef } from 'react'
import { Show, useUser, useOrganization, useOrganizationList, useClerk, UserButton } from '@clerk/react'
import {
  Users, Target, CreditCard,
  Search, Bell, ChevronDown, Plus, MoreHorizontal,
  ArrowUpRight, ArrowDownRight, Building2, FileText,
  CheckCircle, AlertCircle, Clock, UserCheck,
  TrendingUp, Briefcase, ChevronRight, X, LogOut, Zap,
  MessageSquare, Truck,
  RefreshCw, Upload, Folder, Grid, List,
  FileSpreadsheet, FileImage,
  AlertTriangle, Boxes, ArrowLeftRight,
  PlugZap, File as FilePdf,
  PenLine, Workflow, Moon, Sun,
  GripVertical, Play, Pause, Trash2, Eye,
  ChevronLeft,
  Download, Send, PlusCircle, Minus
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'
import { type Module, navItems, moduleConfig, ALWAYS_ON_MODULES } from './modules'
import mbokaIcon from './imports/mboka-icon-1a.png'
import { isClerkConfigured } from './auth/clerk-config'
import { clerkAppearance } from './auth/appearance'
import { LoginScreen } from './auth/LoginScreen'
import { OrgSelectScreen } from './auth/OrgSelectScreen'
import { OnboardingFlow } from './auth/OnboardingFlow'
import { LiveDashboard } from './modules/LiveDashboard'
import { LiveHR } from './modules/LiveHR'
import { LiveCRM } from './modules/LiveCRM'
import { LiveFinance } from './modules/LiveFinance'
import { LiveAccounting } from './modules/LiveAccounting'
import { LiveProcurement } from './modules/LiveProcurement'
import { LiveStock } from './modules/LiveStock'
import { LiveExpenses } from './modules/LiveExpenses'
import { LiveProjects } from './modules/LiveProjects'
import { LiveSupport } from './modules/LiveSupport'
import { LiveDocuments } from './modules/LiveDocuments'
import { LiveESign } from './modules/LiveESign'
import { LiveSettings } from './modules/LiveSettings'
import { useOrgSettings } from './data/orgSettings'
import { useMemberModuleAccess } from './data/memberModuleAccess'
import { LiveBI } from './modules/LiveBI'
import { LiveAutomations } from './modules/LiveAutomations'
import { LiveQuality } from './modules/LiveQuality'
import { LiveNotificationsHost } from './modules/LiveNotifications'
import { LiveCmdKModal } from './modules/LiveCmdKModal'
import { NotificationRules } from './modules/NotificationRules'
import { EmployeeSync } from './modules/EmployeeSync'
import { isSupabaseConfigured } from './lib/supabase'
import { SupabaseSetupNotice } from './auth/SupabaseSetupNotice'
import { useInvitationTicket, AcceptInvitationScreen } from './auth/AcceptInvitation'

// ── Data ────────────────────────────────────────────────────────────────────

export const revenueData = [
  { month: 'Août', ca: 98400 },
  { month: 'Sep', ca: 112300 },
  { month: 'Oct', ca: 107800 },
  { month: 'Nov', ca: 134500 },
  { month: 'Déc', ca: 148900 },
  { month: 'Jan', ca: 118700 },
  { month: 'Fév', ca: 125400 },
  { month: 'Mar', ca: 142100 },
  { month: 'Avr', ca: 138600 },
  { month: 'Mai', ca: 156800 },
  { month: 'Juin', ca: 143200 },
  { month: 'Juil', ca: 128450 },
]

const employees = [
  { id: 1, name: 'Marie Dupont', role: 'Responsable RH', dept: 'RH', contract: 'CDI', status: 'Actif', date: '15 mars 2021' },
  { id: 2, name: 'Thomas Martin', role: 'Développeur Senior', dept: 'Tech', contract: 'CDI', status: 'Actif', date: '02 jan. 2022' },
  { id: 3, name: 'Sophie Bernard', role: 'Directrice Financière', dept: 'Finance', contract: 'CDI', status: 'Actif', date: '10 juin 2020' },
  { id: 4, name: 'Lucas Petit', role: 'Account Executive', dept: 'Commercial', contract: 'CDI', status: 'Actif', date: '18 fév. 2023' },
  { id: 5, name: 'Emma Rousseau', role: 'Designer Produit', dept: 'Tech', contract: 'CDD', status: 'Congé', date: '05 sep. 2022' },
  { id: 6, name: 'Julien Morel', role: 'Comptable', dept: 'Finance', contract: 'CDI', status: 'Actif', date: '22 avr. 2021' },
  { id: 7, name: 'Camille Lefebvre', role: 'SDR', dept: 'Commercial', contract: 'Stage', status: 'Actif', date: '01 fév. 2024' },
  { id: 8, name: 'Antoine Girard', role: 'Ingénieur DevOps', dept: 'Tech', contract: 'CDI', status: 'Actif', date: '14 juil. 2022' },
  { id: 9, name: 'Claire Fontaine', role: 'Customer Success', dept: 'Commercial', contract: 'CDI', status: 'Actif', date: '08 oct. 2023' },
  { id: 10, name: 'Romain Leblanc', role: 'Analyste BI', dept: 'Finance', contract: 'CDI', status: 'Actif', date: '20 nov. 2022' },
]

export type DealStatus = 'Prospection' | 'Qualification' | 'Proposition' | 'Négociation' | 'Gagné'
export const dealColumns: DealStatus[] = ['Prospection', 'Qualification', 'Proposition', 'Négociation', 'Gagné']
const deals: Record<DealStatus, { id: number; company: string; amount: string; contact: string; close: string; initials: string }[]> = {
  Prospection: [
    { id: 1, company: 'Nexaris SAS', amount: '€24 000', contact: 'Pierre Leclerc', close: '31 août', initials: 'PL' },
    { id: 2, company: 'Orbis Finance', amount: '€67 500', contact: 'Anne Blanc', close: '15 sep.', initials: 'AB' },
  ],
  Qualification: [
    { id: 3, company: 'Synapse Media', amount: '€18 200', contact: 'Marc Fontaine', close: '20 août', initials: 'MF' },
    { id: 4, company: 'Tekton BTP', amount: '€142 000', contact: 'Isabelle Roy', close: '30 sep.', initials: 'IR' },
  ],
  Proposition: [
    { id: 5, company: 'Lumière & Co', amount: '€35 800', contact: 'Sylvain Gros', close: '10 août', initials: 'SG' },
  ],
  Négociation: [
    { id: 6, company: 'Atlas Retail', amount: '€89 000', contact: 'Nadia Perrin', close: '05 août', initials: 'NP' },
    { id: 7, company: 'Vertex Cloud', amount: '€213 000', contact: 'Damien Koch', close: '25 juil.', initials: 'DK' },
  ],
  Gagné: [
    { id: 8, company: 'Pragma Studios', amount: '€45 000', contact: 'Julie Dumont', close: '01 juil.', initials: 'JD' },
  ],
}

const invoices = [
  { id: 'FCT-2024-0087', client: 'Atlas Retail', amount: '€89 000', date: '01 juil. 2024', due: '01 août 2024', status: 'En attente' },
  { id: 'FCT-2024-0086', client: 'Vertex Cloud', amount: '€45 200', date: '28 juin 2024', due: '28 juil. 2024', status: 'Payée' },
  { id: 'FCT-2024-0085', client: 'Lumière & Co', amount: '€12 800', date: '15 juin 2024', due: '15 juil. 2024', status: 'En retard' },
  { id: 'FCT-2024-0084', client: 'Synapse Media', amount: '€8 400', date: '10 juin 2024', due: '10 juil. 2024', status: 'Payée' },
  { id: 'FCT-2024-0083', client: 'Nexaris SAS', amount: '€31 500', date: '05 juin 2024', due: '05 juil. 2024', status: 'En retard' },
  { id: 'FCT-2024-0082', client: 'Tekton BTP', amount: '€178 000', date: '01 juin 2024', due: '01 juil. 2024', status: 'Payée' },
  { id: 'FCT-2024-0081', client: 'Pragma Studios', amount: '€22 600', date: '20 mai 2024', due: '20 juin 2024', status: 'Payée' },
]

const activities = [
  { Icon: UserCheck, color: 'text-green-500 bg-green-50', text: 'Marie Dupont a approuvé le congé de Emma Rousseau', time: 'il y a 5 min', module: 'RH' },
  { Icon: CreditCard, color: 'text-indigo-500 bg-indigo-50', text: 'Facture FCT-2024-0087 envoyée à Atlas Retail', time: 'il y a 22 min', module: 'Finance' },
  { Icon: Target, color: 'text-amber-500 bg-amber-50', text: 'Deal Vertex Cloud passé en Négociation (€213 000)', time: 'il y a 1h', module: 'CRM' },
  { Icon: AlertCircle, color: 'text-red-500 bg-red-50', text: 'Facture FCT-2024-0085 en retard — Lumière & Co', time: 'il y a 2h', module: 'Finance' },
  { Icon: Users, color: 'text-blue-500 bg-blue-50', text: "Camille Lefebvre a rejoint l'équipe Commercial", time: 'il y a 3h', module: 'RH' },
  { Icon: CheckCircle, color: 'text-green-500 bg-green-50', text: 'Deal Pragma Studios — Gagné ✓  €45 000', time: 'il y a 5h', module: 'CRM' },
]

const members = [
  { id: 1, name: 'Sophie Bernard', email: 'sophie.bernard@os.io', role: 'Admin', modules: ['Finance', 'Compta', 'RH'], status: 'Actif' },
  { id: 2, name: 'Marie Dupont', email: 'marie.dupont@os.io', role: 'Manager', modules: ['RH'], status: 'Actif' },
  { id: 3, name: 'Lucas Petit', email: 'lucas.petit@os.io', role: 'Manager', modules: ['CRM', 'Achats'], status: 'Actif' },
  { id: 4, name: 'Thomas Martin', email: 'thomas.martin@os.io', role: 'Employé', modules: ['Projets'], status: 'Actif' },
  { id: 5, name: 'Emma Rousseau', email: 'emma.rousseau@os.io', role: 'Employé', modules: ['Projets'], status: 'Inactif' },
  { id: 6, name: 'Julien Morel', email: 'julien.morel@os.io', role: 'Employé', modules: ['Finance', 'Compta'], status: 'Actif' },
]

const purchaseOrders = [
  { id: 'BC-2024-0042', supplier: 'Grainger Fournitures', amount: '€14 800', date: '12 juil. 2024', delivery: '25 juil. 2024', status: 'Envoyé', items: 8 },
  { id: 'BC-2024-0041', supplier: 'Bureau Vallée Pro', amount: '€2 340', date: '08 juil. 2024', delivery: '15 juil. 2024', status: 'Reçu', items: 12 },
  { id: 'BC-2024-0040', supplier: 'Dell Technologies', amount: '€38 600', date: '05 juil. 2024', delivery: '20 juil. 2024', status: 'Envoyé', items: 4 },
  { id: 'BC-2024-0039', supplier: 'EDF Pro', amount: '€5 200', date: '01 juil. 2024', delivery: '01 août 2024', status: 'Brouillon', items: 1 },
  { id: 'BC-2024-0038', supplier: 'Aramark Services', amount: '€9 700', date: '25 juin 2024', delivery: '10 juil. 2024', status: 'Reçu', items: 6 },
  { id: 'BC-2024-0037', supplier: 'Schneider Electric', amount: '€22 150', date: '18 juin 2024', delivery: '02 juil. 2024', status: 'Reçu', items: 3 },
]

const stockItems = [
  { id: 1, ref: 'PRD-0087', name: 'Ordinateur portable Dell XPS 15', qty: 12, warehouse: 'Paris — A3', minQty: 5, value: '€23 880', status: 'En stock' },
  { id: 2, ref: 'PRD-0088', name: 'Écran 27" 4K LG UltraFine', qty: 3, warehouse: 'Paris — A4', minQty: 4, value: '€2 397', status: 'Stock faible' },
  { id: 3, ref: 'PRD-0089', name: 'Casque audio Bose QC45', qty: 0, warehouse: 'Lyon — B1', minQty: 2, value: '€0', status: 'Rupture' },
  { id: 4, ref: 'PRD-0090', name: 'Clavier mécanique Keychron K2', qty: 28, warehouse: 'Paris — A3', minQty: 8, value: '€5 040', status: 'En stock' },
  { id: 5, ref: 'PRD-0091', name: 'Souris ergonomique Logitech MX', qty: 15, warehouse: 'Paris — A4', minQty: 5, value: '€2 175', status: 'En stock' },
  { id: 6, ref: 'PRD-0092', name: 'Station d\'accueil Thunderbolt 4', qty: 2, warehouse: 'Lyon — B2', minQty: 3, value: '€798', status: 'Stock faible' },
  { id: 7, ref: 'PRD-0093', name: 'Webcam Logitech C920 HD Pro', qty: 9, warehouse: 'Paris — A3', minQty: 3, value: '€891', status: 'En stock' },
]

const bankData = [
  { date: '14 juil.', label: 'Virement entrant — Atlas Retail', amount: '+€45 200', type: 'crédit', matched: true },
  { date: '13 juil.', label: 'Prélèvement AWS Cloud Services', amount: '-€3 847', type: 'débit', matched: true },
  { date: '12 juil.', label: 'Virement entrant — Tekton BTP', amount: '+€178 000', type: 'crédit', matched: false },
  { date: '11 juil.', label: 'Loyer juillet — SCI Haussmann', amount: '-€12 400', type: 'débit', matched: true },
  { date: '10 juil.', label: 'Virement entrant — Pragma Studios', amount: '+€22 600', type: 'crédit', matched: true },
  { date: '09 juil.', label: 'Salaires juin — virement masse', amount: '-€187 430', type: 'débit', matched: false },
]

const expenses = [
  { id: 'NF-2024-0056', employee: 'Lucas Petit', category: 'Déplacement', amount: '€847', date: '12 juil. 2024', description: 'TGV Paris-Lyon + hôtel — client Tekton', status: 'Soumise' },
  { id: 'NF-2024-0055', employee: 'Claire Fontaine', category: 'Repas client', amount: '€124', date: '10 juil. 2024', description: 'Déjeuner avec Pragma Studios', status: 'Validée' },
  { id: 'NF-2024-0054', employee: 'Thomas Martin', category: 'Matériel', amount: '€289', date: '08 juil. 2024', description: 'Câbles et adaptateurs pour bureau', status: 'Remboursée' },
  { id: 'NF-2024-0053', employee: 'Marie Dupont', category: 'Formation', amount: '€1 450', date: '05 juil. 2024', description: 'Certification RH — CEGOS Paris', status: 'Validée' },
  { id: 'NF-2024-0052', employee: 'Antoine Girard', category: 'Logiciel', amount: '€359', date: '02 juil. 2024', description: 'Licence JetBrains annuelle', status: 'Remboursée' },
  { id: 'NF-2024-0051', employee: 'Camille Lefebvre', category: 'Déplacement', amount: '€215', date: '01 juil. 2024', description: 'Frais de déplacement salon LeadGenConf', status: 'Soumise' },
]

const projects = [
  { id: 1, name: 'Refonte plateforme client', client: 'Atlas Retail', progress: 68, budget: '€120 000', spent: '€81 600', members: 4, deadline: '15 sep. 2024', status: 'En cours', logged: '342h' },
  { id: 2, name: 'Migration infrastructure cloud', client: 'Interne', progress: 92, budget: '€45 000', spent: '€41 400', members: 3, deadline: '31 juil. 2024', status: 'En cours', logged: '187h' },
  { id: 3, name: 'Module BI & analytics', client: 'Vertex Cloud', progress: 34, budget: '€78 000', spent: '€26 520', members: 5, deadline: '30 nov. 2024', status: 'En cours', logged: '156h' },
  { id: 4, name: 'Audit sécurité ISO 27001', client: 'Interne', progress: 100, budget: '€22 000', spent: '€21 800', members: 2, deadline: '01 juin 2024', status: 'Terminé', logged: '98h' },
  { id: 5, name: 'Intégration Stripe Billing', client: 'Nexaris SAS', progress: 15, budget: '€18 500', spent: '€2 775', members: 2, deadline: '15 oct. 2024', status: 'En cours', logged: '34h' },
]

const tickets = [
  { id: 'TKT-1042', subject: 'Impossible de se connecter après MàJ', client: 'Tekton BTP', assignee: 'TM', priority: 'Critique', status: 'Ouvert', sla: '2h 14m', created: '14 juil. 11:32' },
  { id: 'TKT-1041', subject: 'Export PDF des factures incorrect', client: 'Atlas Retail', assignee: 'CF', priority: 'Haute', status: 'En cours', sla: '5h 48m', created: '14 juil. 09:15' },
  { id: 'TKT-1040', subject: 'Bug calcul TVA 20% sur lignes mixtes', client: 'Nexaris SAS', assignee: 'JM', priority: 'Haute', status: 'En cours', sla: '1j 3h', created: '13 juil. 16:44' },
  { id: 'TKT-1039', subject: 'Demande d\'ajout d\'un utilisateur', client: 'Vertex Cloud', assignee: '', priority: 'Normale', status: 'Ouvert', sla: '2j 6h', created: '13 juil. 14:20' },
  { id: 'TKT-1038', subject: 'Intégration Slack ne fonctionne plus', client: 'Pragma Studios', assignee: 'AG', priority: 'Haute', status: 'Résolu', sla: '—', created: '12 juil. 10:00' },
  { id: 'TKT-1037', subject: 'Question sur la facturation mensuelle', client: 'Synapse Media', assignee: 'CF', priority: 'Basse', status: 'Fermé', sla: '—', created: '11 juil. 09:30' },
]

export const docFolders = ['RH', 'Finance', 'Contrats', 'Conformité', 'Projets', 'Factures']
const documents = [
  { name: 'Contrat CDI — Thomas Martin.pdf', folder: 'RH', size: '248 Ko', modified: '10 juil. 2024', type: 'pdf' },
  { name: 'Facture FCT-2024-0087.pdf', folder: 'Factures', size: '124 Ko', modified: '01 juil. 2024', type: 'pdf' },
  { name: 'Rapport financier Q2 2024.xlsx', folder: 'Finance', size: '1.4 Mo', modified: '30 juin 2024', type: 'xls' },
  { name: 'Audit sécurité ISO 27001.pdf', folder: 'Conformité', size: '3.2 Mo', modified: '01 juin 2024', type: 'pdf' },
  { name: 'Accord de confidentialité — Atlas.pdf', folder: 'Contrats', size: '180 Ko', modified: '15 mai 2024', type: 'pdf' },
  { name: 'Plan projet — Refonte plateforme.xlsx', folder: 'Projets', size: '890 Ko', modified: '12 mai 2024', type: 'xls' },
  { name: 'Fiche de paie mai 2024 — M.Dupont.pdf', folder: 'RH', size: '98 Ko', modified: '01 juin 2024', type: 'pdf' },
  { name: 'Charte graphique v3.png', folder: 'Projets', size: '4.1 Mo', modified: '08 avr. 2024', type: 'img' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Actif: 'bg-green-50 text-green-700 ring-1 ring-green-200',
    Congé: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    Inactif: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
    Payée: 'bg-green-50 text-green-700 ring-1 ring-green-200',
    'En attente': 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    'En retard': 'bg-red-50 text-red-600 ring-1 ring-red-200',
    Brouillon: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
    Envoyé: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    Reçu: 'bg-green-50 text-green-700 ring-1 ring-green-200',
    'En stock': 'bg-green-50 text-green-700 ring-1 ring-green-200',
    'Stock faible': 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    Rupture: 'bg-red-50 text-red-600 ring-1 ring-red-200',
    Soumise: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    Validée: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
    Remboursée: 'bg-green-50 text-green-700 ring-1 ring-green-200',
    'En cours': 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    Terminé: 'bg-green-50 text-green-700 ring-1 ring-green-200',
    Ouvert: 'bg-red-50 text-red-600 ring-1 ring-red-200',
    Résolu: 'bg-green-50 text-green-700 ring-1 ring-green-200',
    Fermé: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
    Critique: 'bg-red-100 text-red-700 ring-1 ring-red-300',
    Haute: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    Normale: 'bg-blue-50 text-blue-600 ring-1 ring-blue-200',
    Basse: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
    Admin: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
    Manager: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
    Employé: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

export function Avatar({ initials, size = 'sm' }: { initials: string; size?: 'sm' | 'md' }) {
  const colors = ['bg-indigo-100 text-indigo-700', 'bg-purple-100 text-purple-700', 'bg-blue-100 text-blue-700', 'bg-teal-100 text-teal-700', 'bg-amber-100 text-amber-700']
  const color = colors[initials.charCodeAt(0) % colors.length]
  const sz = size === 'md' ? 'w-8 h-8 text-xs' : 'w-6 h-6 text-[10px]'
  return (
    <span className={`inline-flex items-center justify-center rounded-full font-semibold flex-shrink-0 ${color} ${sz}`}>
      {initials}
    </span>
  )
}

export function formatEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

export function ProgressBar({ value, color = 'bg-indigo-500' }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${value >= 100 ? 'bg-green-500' : value > 60 ? color : 'bg-amber-400'}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[11px] text-gray-500 tabular-nums w-7 text-right">{value}%</span>
    </div>
  )
}

export function TableHeader({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-gray-100 bg-gray-50/60">
        {cols.map(col => (
          <th key={col} className="text-left px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">{col}</th>
        ))}
      </tr>
    </thead>
  )
}

export function DocIcon({ type }: { type: string }) {
  if (type === 'xls') return <FileSpreadsheet size={18} className="text-green-600" />
  if (type === 'img') return <FileImage size={18} className="text-blue-400" />
  return <FilePdf size={18} className="text-red-500" />
}

// ── Navigation ───────────────────────────────────────────────────────────────

function Sidebar({
  active, onNavigate, onSearch, darkMode, onToggleDark, visibleModules,
  orgName = 'Acme Corp', onSwitchOrg,
  userName = 'Sophie Bernard', userRole = 'Admin', userInitials = 'SB',
  onSignOut, accountMenu,
}: {
  active: Module; onNavigate: (m: Module) => void; onSearch: () => void; darkMode: boolean; onToggleDark: () => void
  visibleModules: Module[]
  orgName?: string; onSwitchOrg?: () => void
  userName?: string; userRole?: string; userInitials?: string
  onSignOut?: () => void; accountMenu?: React.ReactNode
}) {
  const items = navItems.filter(item => visibleModules.includes(item.id))

  return (
    <aside className="w-60 flex-shrink-0 h-screen flex flex-col bg-[#0B0F19] text-gray-400 border-r border-white/[0.06]">
      <div className="h-14 flex items-center px-4 border-b border-white/[0.06] gap-2.5">
        <img src={mbokaIcon} alt="MBOKA" className="w-7 h-7 rounded-lg flex-shrink-0" />
        <span className="font-semibold text-white text-sm tracking-tight">MBOKA</span>
      </div>

      <button onClick={onSwitchOrg} className="flex items-center gap-2 mx-3 mt-3 px-2.5 py-2 rounded-lg hover:bg-white/[0.05] transition-colors text-left">
        <div className="w-5 h-5 rounded bg-indigo-500/20 flex items-center justify-center">
          <Building2 size={11} className="text-indigo-400" />
        </div>
        <span className="text-xs font-medium text-gray-300 flex-1 truncate">{orgName}</span>
        <ChevronDown size={12} />
      </button>

      <nav className="flex-1 overflow-y-auto px-2 mt-4 pb-4 space-y-0.5">
        <button onClick={onSearch} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.05] text-gray-500 hover:text-gray-300 transition-colors mb-2">
          <Search size={14} />
          <span className="text-xs">Rechercher…</span>
          <span className="ml-auto text-[10px] bg-white/[0.08] px-1.5 py-0.5 rounded text-gray-500">⌘K</span>
        </button>

        {items.map((item, i) => {
          const prevGroup = i > 0 ? items[i - 1].group : undefined
          const showDivider = item.group && item.group !== prevGroup
          const isActive = active === item.id
          return (
            <div key={item.id}>
              {showDivider && (
                <p className="text-[10px] font-medium uppercase tracking-widest text-gray-600 px-2.5 pt-4 pb-1">{item.group}</p>
              )}
              <button
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors text-xs font-medium ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/[0.05] hover:text-gray-200'
                }`}
              >
                <item.Icon size={14} className={isActive ? 'text-white' : ''} />
                {item.label}
              </button>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-white/[0.06] p-3 space-y-1">
        <button onClick={onToggleDark} className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors text-gray-500 hover:text-gray-300">
          {darkMode ? <Sun size={13} /> : <Moon size={13} />}
          <span className="text-xs">{darkMode ? 'Mode clair' : 'Mode sombre'}</span>
          <span className={`ml-auto w-7 h-4 rounded-full transition-colors flex items-center ${darkMode ? 'bg-indigo-500' : 'bg-gray-700'}`}>
            <span className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform mx-0.5 ${darkMode ? 'translate-x-3' : 'translate-x-0'}`} />
          </span>
        </button>
        <div className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors">
          {accountMenu ?? (
            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0">{userInitials}</div>
          )}
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs font-medium text-gray-200 truncate">{userName}</p>
            <p className="text-[10px] text-gray-500 truncate">{userRole}</p>
          </div>
          <button onClick={onSignOut} className="p-0.5 flex-shrink-0">
            <LogOut size={12} className="text-gray-600 hover:text-gray-400 transition-colors" />
          </button>
        </div>
      </div>
    </aside>
  )
}

// ── Top bar ───────────────────────────────────────────────────────────────────

function Topbar({ title, action, onBell, unreadCount }: {
  title: string; action?: React.ReactNode; onBell: () => void; unreadCount: number
}) {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-gray-100 bg-white flex-shrink-0">
      <h1 className="font-semibold text-gray-900 text-sm">{title}</h1>
      <div className="flex items-center gap-3">
        {action}
        <button onClick={onBell} className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <Bell size={16} className="text-gray-500" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[14px] h-3.5 bg-indigo-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}

// ── Global search modal ───────────────────────────────────────────────────────

function CmdKModal({ onClose, onNavigate }: { onClose: () => void; onNavigate: (m: Module) => void }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const results = query.length > 0
    ? searchIndex.filter(s => s.label.toLowerCase().includes(query.toLowerCase()) || s.sub.toLowerCase().includes(query.toLowerCase()))
    : searchIndex.slice(0, 5)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [onClose])

  const typeColors: Record<string, string> = {
    Employé: 'bg-blue-50 text-blue-600',
    Deal: 'bg-purple-50 text-purple-600',
    Facture: 'bg-amber-50 text-amber-600',
    Ticket: 'bg-red-50 text-red-600',
    Projet: 'bg-indigo-50 text-indigo-600',
    Audit: 'bg-teal-50 text-teal-600',
    Document: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher dans MBOKA…"
            className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none" />
          {query && <button onClick={() => setQuery('')}><X size={14} className="text-gray-400 hover:text-gray-600" /></button>}
          <kbd className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-medium">Esc</kbd>
        </div>
        <div className="py-2 max-h-80 overflow-y-auto">
          {!query && <p className="text-[11px] text-gray-400 px-4 pt-1 pb-2 font-medium uppercase tracking-wider">Accès rapide</p>}
          {results.length === 0 && (
            <div className="text-center py-8 text-xs text-gray-400">Aucun résultat pour « {query} »</div>
          )}
          {results.map((r, i) => (
            <button key={i} onClick={() => { onNavigate(r.module); onClose() }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${typeColors[r.type] ?? 'bg-gray-100 text-gray-500'}`}>{r.type}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-900 truncate">{r.label}</p>
                <p className="text-[11px] text-gray-400 truncate">{r.sub}</p>
              </div>
              <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
        <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-4 text-[10px] text-gray-400">
          <span><kbd className="bg-gray-100 px-1 rounded">↑↓</kbd> Naviguer</span>
          <span><kbd className="bg-gray-100 px-1 rounded">↵</kbd> Ouvrir</span>
          <span><kbd className="bg-gray-100 px-1 rounded">Esc</kbd> Fermer</span>
        </div>
      </div>
    </div>
  )
}

// ── Notifications panel ───────────────────────────────────────────────────────

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [notifs, setNotifs] = useState(notifications)
  const unread = notifs.filter(n => !n.read).length

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div className="absolute top-14 right-4 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {unread > 0 && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">{unread}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setNotifs(n => n.map(x => ({ ...x, read: true })))}
              className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium">Tout marquer lu</button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={15} className="text-gray-400" /></button>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
          {notifs.map(n => (
            <button key={n.id} onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
              className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${n.read ? 'opacity-60' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${n.color}`}>
                <n.icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-900 leading-snug">{n.title}</p>
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-1" />}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">{n.body}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-gray-400">{n.time}</span>
                  <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
                  <span className="text-[10px] text-gray-400">{n.module}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="border-t border-gray-100 px-4 py-2.5">
          <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium w-full text-center">Voir toutes les notifications</button>
        </div>
      </div>
    </div>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

export function KpiCard({ label, value, trend, trendLabel, Icon, iconColor }: {
  label: string; value: string; trend?: 'up' | 'down'; trendLabel?: string; Icon: React.ElementType; iconColor: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${iconColor} flex items-center justify-center`}>
          <Icon size={15} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        {trend && trendLabel && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
            {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trendLabel}
          </div>
        )}
      </div>
    </div>
  )
}

export function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-gray-900">{formatEur(payload[0].value)}</p>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard() {
  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="CA du mois" value="€128 450" trend="up" trendLabel="+12% vs juin" Icon={TrendingUp} iconColor="bg-indigo-50 text-indigo-600" />
        <KpiCard label="Factures en attente" value="23" trend="down" trendLabel="-3 vs semaine dern." Icon={FileText} iconColor="bg-amber-50 text-amber-600" />
        <KpiCard label="Effectifs" value="247" trend="up" trendLabel="+5 ce trimestre" Icon={Users} iconColor="bg-blue-50 text-blue-600" />
        <KpiCard label="Nouveaux deals" value="18" trend="up" trendLabel="+4 cette semaine" Icon={Briefcase} iconColor="bg-green-50 text-green-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Chiffre d'affaires</h2>
              <p className="text-xs text-gray-400 mt-0.5">12 derniers mois</p>
            </div>
            <div className="flex items-center gap-1.5">
              {['3M', '6M', '12M'].map((p, i) => (
                <button key={p} className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${i === 2 ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}>{p}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="ca" stroke="#4F46E5" strokeWidth={2} fill="url(#gradCA)" dot={false} activeDot={{ r: 4, fill: '#4F46E5', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Activité récente</h2>
            <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Tout voir</button>
          </div>
          <div className="space-y-3">
            {activities.map((act, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${act.color}`}>
                  <act.Icon size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-700 leading-snug">{act.text}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-gray-400">{act.time}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
                    <span className="text-[10px] text-gray-400">{act.module}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Paiements reçus ce mois', value: '€214 300', sub: '14 transactions', color: 'text-green-600' },
          { label: 'Pipeline CRM total', value: '€589 700', sub: '12 opportunités actives', color: 'text-indigo-600' },
          { label: 'Congés en attente de validation', value: '7', sub: '3 urgents cette semaine', color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center justify-between hover:shadow-sm transition-shadow">
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── HR ────────────────────────────────────────────────────────────────────────

function HRModule() {
  const [hrTab, setHrTab] = useState<'employees' | 'leaves'>('employees')
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('Tous')
  const depts = ['Tous', 'RH', 'Tech', 'Finance', 'Commercial']
  const filtered = employees.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase())
    const matchDept = deptFilter === 'Tous' || e.dept === deptFilter
    return matchSearch && matchDept
  })

  return (
    <div className="p-6">
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit mb-5">
        {(['employees', 'leaves'] as const).map(t => (
          <button key={t} onClick={() => setHrTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${hrTab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'employees' ? 'Employés' : 'Congés & absences'}
          </button>
        ))}
      </div>

      {hrTab === 'employees' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un employé…"
                className="pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 w-56 placeholder:text-gray-400" />
            </div>
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
              {depts.map(d => (
                <button key={d} onClick={() => setDeptFilter(d)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${deptFilter === d ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>{d}</button>
              ))}
            </div>
            <span className="text-xs text-gray-400 ml-auto">{filtered.length} employé{filtered.length > 1 ? 's' : ''}</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-xs">
              <TableHeader cols={['Nom', 'Poste', 'Département', 'Contrat', 'Statut', "Date d'entrée", '']} />
              <tbody>
                {filtered.map((emp, i) => (
                  <tr key={emp.id} className={`border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar initials={emp.name.split(' ').map(n => n[0]).join('')} size="md" /><span className="font-medium text-gray-900">{emp.name}</span></div></td>
                    <td className="px-4 py-3 text-gray-600">{emp.role}</td>
                    <td className="px-4 py-3"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[11px] font-medium">{emp.dept}</span></td>
                    <td className="px-4 py-3 text-gray-600">{emp.contract}</td>
                    <td className="px-4 py-3"><StatusBadge status={emp.status} /></td>
                    <td className="px-4 py-3 text-gray-400">{emp.date}</td>
                    <td className="px-4 py-3"><button className="p-1 rounded hover:bg-gray-100 transition-colors"><MoreHorizontal size={14} className="text-gray-400" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {hrTab === 'leaves' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: 'En attente de validation', value: String(leaveRequests.filter(l => l.status === 'En attente').length), color: 'text-amber-600' },
              { label: 'Approuvées ce mois', value: String(leaveRequests.filter(l => l.status === 'Approuvé').length), color: 'text-green-600' },
              { label: 'Jours total posés', value: String(leaveRequests.reduce((s, l) => s + l.days, 0)), color: 'text-indigo-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-xs">
              <TableHeader cols={['Employé', 'Type', 'Du', 'Au', 'Jours', 'Manager', 'Statut', '']} />
              <tbody>
                {leaveRequests.map((req, i) => (
                  <tr key={req.id} className={`border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors ${i === leaveRequests.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar initials={req.initials} size="md" /><span className="font-medium text-gray-900">{req.employee}</span></div></td>
                    <td className="px-4 py-3"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[11px] font-medium">{req.type}</span></td>
                    <td className="px-4 py-3 text-gray-600">{req.from}</td>
                    <td className="px-4 py-3 text-gray-600">{req.to}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{req.days}j</td>
                    <td className="px-4 py-3 text-gray-500">{req.manager}</td>
                    <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                    <td className="px-4 py-3">
                      {req.status === 'En attente' && (
                        <div className="flex items-center gap-1">
                          <button className="px-2 py-1 text-[11px] bg-green-50 text-green-700 rounded-md font-medium hover:bg-green-100 transition-colors">Approuver</button>
                          <button className="px-2 py-1 text-[11px] bg-red-50 text-red-600 rounded-md font-medium hover:bg-red-100 transition-colors">Refuser</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ── CRM ───────────────────────────────────────────────────────────────────────

export const columnColors: Record<DealStatus, string> = {
  Prospection: 'text-blue-600 bg-blue-50',
  Qualification: 'text-purple-600 bg-purple-50',
  Proposition: 'text-amber-600 bg-amber-50',
  Négociation: 'text-orange-600 bg-orange-50',
  Gagné: 'text-green-600 bg-green-50',
}

function CRMModule() {
  return (
    <div className="p-6 overflow-x-auto">
      <div className="flex gap-4 min-w-max">
        {dealColumns.map(col => {
          const colDeals = deals[col]
          const total = colDeals.reduce((sum, d) => sum + parseInt(d.amount.replace(/[€ ]/g, '')), 0)
          return (
            <div key={col} className="w-64 flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${columnColors[col]}`}>{col}</span>
                  <span className="text-xs text-gray-400 font-medium">{colDeals.length}</span>
                </div>
                <span className="text-[11px] text-gray-400 font-medium">{formatEur(total)}</span>
              </div>
              {colDeals.map(deal => (
                <div key={deal.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-xs font-semibold text-gray-900 leading-snug">{deal.company}</p>
                    <button className="p-0.5 rounded hover:bg-gray-50 transition-colors flex-shrink-0"><MoreHorizontal size={13} className="text-gray-300" /></button>
                  </div>
                  <p className="text-base font-bold text-gray-900">{deal.amount}</p>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                    <Avatar initials={deal.initials} size="sm" />
                    <span className="text-[11px] text-gray-500">{deal.contact}</span>
                    <div className="ml-auto flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock size={10} />{deal.close}
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full mt-1 py-2.5 rounded-xl border border-dashed border-gray-200 text-[11px] text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center gap-1.5">
                <Plus size={12} />Ajouter
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Finance ───────────────────────────────────────────────────────────────────

function FinanceModule() {
  const [statusFilter, setStatusFilter] = useState('Toutes')
  const statuses = ['Toutes', 'Payée', 'En attente', 'En retard']
  const filtered = invoices.filter(inv => statusFilter === 'Toutes' || inv.status === statusFilter)

  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total émis', value: '€387 500', color: 'text-gray-900' },
          { label: 'En attente', value: '€89 000', color: 'text-amber-600' },
          { label: 'En retard', value: '€44 300', color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>{s}</button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <TableHeader cols={['N° Facture', 'Client', 'Montant', 'Date', 'Échéance', 'Statut', '']} />
          <tbody>
            {filtered.map((inv, i) => (
              <tr key={inv.id} className={`border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                <td className="px-4 py-3 font-mono text-gray-500 font-medium text-[11px]">{inv.id}</td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar initials={inv.client.split(' ').map(w => w[0]).join('').slice(0, 2)} size="sm" /><span className="font-medium text-gray-900">{inv.client}</span></div></td>
                <td className="px-4 py-3 font-semibold text-gray-900 tabular-nums">{inv.amount}</td>
                <td className="px-4 py-3 text-gray-400">{inv.date}</td>
                <td className="px-4 py-3 text-gray-400">{inv.due}</td>
                <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                <td className="px-4 py-3"><button className="p-1 rounded hover:bg-gray-100 transition-colors"><MoreHorizontal size={14} className="text-gray-400" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Accounting ────────────────────────────────────────────────────────────────

function AccountingModule() {
  const [activeTab, setActiveTab] = useState<'rapprochement' | 'sync'>('rapprochement')
  const unmatched = bankData.filter(b => !b.matched).length

  return (
    <div className="p-6">
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit mb-6">
        {(['rapprochement', 'sync'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'rapprochement' ? 'Rapprochement bancaire' : 'Synchronisation Pennylane'}
          </button>
        ))}
      </div>

      {activeTab === 'rapprochement' && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Transactions ce mois', value: '47', icon: ArrowLeftRight, color: 'text-indigo-600 bg-indigo-50' },
              { label: 'Non rapprochées', value: String(unmatched), icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
              { label: 'Solde rapproché', value: '€54 123', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}><s.icon size={18} /></div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-700">Transactions bancaires — juillet 2024</p>
              <button className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:text-indigo-700">
                <RefreshCw size={12} />Synchroniser
              </button>
            </div>
            <table className="w-full text-xs">
              <TableHeader cols={['Date', 'Libellé', 'Montant', 'Rapprochement', '']} />
              <tbody>
                {bankData.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50/40 transition-colors ${i === bankData.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-3 text-gray-700">{row.label}</td>
                    <td className={`px-4 py-3 font-semibold tabular-nums ${row.type === 'crédit' ? 'text-green-600' : 'text-gray-900'}`}>{row.amount}</td>
                    <td className="px-4 py-3">
                      {row.matched
                        ? <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle size={12} />Rapproché</span>
                        : <span className="flex items-center gap-1 text-amber-500 font-medium"><AlertTriangle size={12} />À rapprocher</span>}
                    </td>
                    <td className="px-4 py-3">
                      {!row.matched && (
                        <button className="text-[11px] px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md font-medium hover:bg-indigo-100 transition-colors">Affecter</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'sync' && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <PlugZap size={18} className="text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Pennylane</p>
                <p className="text-xs text-gray-400">Synchronisation comptable automatique</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-green-600">Connecté</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Dernière sync', value: 'Aujourd\'hui à 09:14' },
                { label: 'Prochaine sync', value: 'Aujourd\'hui à 21:14' },
                { label: 'Écritures envoyées', value: '1 247 ce mois' },
                { label: 'Statut', value: 'Opérationnel' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-lg px-3 py-2.5">
                  <p className="text-gray-400">{item.label}</p>
                  <p className="font-medium text-gray-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <RefreshCw size={12} />Forcer la synchronisation
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800">2 écritures en attente de validation</p>
              <p className="text-xs text-amber-600 mt-0.5">Les transactions BC-2024-0039 et NF-2024-0056 n'ont pas encore été affectées à un compte comptable.</p>
              <button className="mt-2 text-xs font-medium text-amber-700 underline underline-offset-2">Voir les écritures →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Procurement ───────────────────────────────────────────────────────────────

function ProcurementModule() {
  const [statusFilter, setStatusFilter] = useState('Tous')
  const statuses = ['Tous', 'Brouillon', 'Envoyé', 'Reçu']
  const filtered = purchaseOrders.filter(po => statusFilter === 'Tous' || po.status === statusFilter)

  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Commandes ce mois', value: '6', color: 'text-gray-900' },
          { label: 'Montant engagé', value: '€92 790', color: 'text-indigo-600' },
          { label: 'En attente de livraison', value: '2', color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Rechercher un fournisseur…"
            className="pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-52 placeholder:text-gray-400" />
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <TableHeader cols={['N° BC', 'Fournisseur', 'Articles', 'Montant', 'Date', 'Livraison prévue', 'Statut', '']} />
          <tbody>
            {filtered.map((po, i) => (
              <tr key={po.id} className={`border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                <td className="px-4 py-3 font-mono text-gray-500 font-medium text-[11px]">{po.id}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar initials={po.supplier.split(' ').map(w => w[0]).join('').slice(0, 2)} size="sm" />
                    <span className="font-medium text-gray-900">{po.supplier}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{po.items} articles</td>
                <td className="px-4 py-3 font-semibold text-gray-900 tabular-nums">{po.amount}</td>
                <td className="px-4 py-3 text-gray-400">{po.date}</td>
                <td className="px-4 py-3 text-gray-400">{po.delivery}</td>
                <td className="px-4 py-3"><StatusBadge status={po.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {po.status === 'Envoyé' && (
                      <button className="flex items-center gap-1 text-[11px] px-2 py-1 bg-green-50 text-green-700 rounded-md font-medium hover:bg-green-100 transition-colors">
                        <Truck size={10} />Réceptionner
                      </button>
                    )}
                    <button className="p-1 rounded hover:bg-gray-100 transition-colors"><MoreHorizontal size={14} className="text-gray-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Stock ─────────────────────────────────────────────────────────────────────

function StockModule() {
  const ruptures = stockItems.filter(i => i.status === 'Rupture').length
  const faible = stockItems.filter(i => i.status === 'Stock faible').length

  return (
    <div className="p-6">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Références totales', value: String(stockItems.length), color: 'text-gray-900', icon: Boxes },
          { label: 'Alertes rupture', value: String(ruptures), color: 'text-red-600', icon: AlertCircle },
          { label: 'Stock faible', value: String(faible), color: 'text-amber-600', icon: AlertTriangle },
          { label: 'Valeur totale stock', value: '€35 181', color: 'text-indigo-600', icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color === 'text-red-600' ? 'bg-red-50' : s.color === 'text-amber-600' ? 'bg-amber-50' : s.color === 'text-indigo-600' ? 'bg-indigo-50' : 'bg-gray-50'}`}>
              <s.icon size={16} className={s.color} />
            </div>
            <div>
              <p className="text-[11px] text-gray-500">{s.label}</p>
              <p className={`text-lg font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <TableHeader cols={['Référence', 'Produit', 'Quantité', 'Seuil min.', 'Entrepôt', 'Valeur', 'Statut', '']} />
          <tbody>
            {stockItems.map((item, i) => (
              <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors ${i === stockItems.length - 1 ? 'border-0' : ''}`}>
                <td className="px-4 py-3 font-mono text-gray-400 text-[11px]">{item.ref}</td>
                <td className="px-4 py-3 font-medium text-gray-900 max-w-[220px] truncate">{item.name}</td>
                <td className={`px-4 py-3 font-semibold tabular-nums ${item.qty === 0 ? 'text-red-600' : item.qty <= item.minQty ? 'text-amber-600' : 'text-gray-900'}`}>{item.qty}</td>
                <td className="px-4 py-3 text-gray-400">{item.minQty}</td>
                <td className="px-4 py-3 text-gray-500">{item.warehouse}</td>
                <td className="px-4 py-3 tabular-nums text-gray-600">{item.value}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3">
                  <button className="p-1 rounded hover:bg-gray-100 transition-colors"><MoreHorizontal size={14} className="text-gray-400" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Expenses ──────────────────────────────────────────────────────────────────

function ExpensesModule() {
  const [tab, setTab] = useState<'list' | 'submit'>('list')
  const [statusFilter, setStatusFilter] = useState('Toutes')
  const [category, setCategory] = useState('Déplacement')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const statuses = ['Toutes', 'Soumise', 'Validée', 'Remboursée']
  const filtered = expenses.filter(e => statusFilter === 'Toutes' || e.status === statusFilter)

  return (
    <div className="p-6">
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit mb-6">
        {(['list', 'submit'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setSubmitted(false) }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'list' ? 'Liste des notes de frais' : 'Soumettre une note'}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Soumises ce mois', value: '6', color: 'text-blue-600' },
              { label: 'En attente de validation', value: '2', color: 'text-amber-600' },
              { label: 'Total remboursé', value: '€648', color: 'text-green-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
              {statuses.map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-xs">
              <TableHeader cols={['N°', 'Employé', 'Catégorie', 'Montant', 'Description', 'Date', 'Statut', '']} />
              <tbody>
                {filtered.map((exp, i) => (
                  <tr key={exp.id} className={`border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-4 py-3 font-mono text-gray-400 text-[11px]">{exp.id}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar initials={exp.employee.split(' ').map(n => n[0]).join('')} size="sm" /><span className="font-medium text-gray-900">{exp.employee}</span></div></td>
                    <td className="px-4 py-3"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[11px] font-medium">{exp.category}</span></td>
                    <td className="px-4 py-3 font-semibold text-gray-900 tabular-nums">{exp.amount}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{exp.description}</td>
                    <td className="px-4 py-3 text-gray-400">{exp.date}</td>
                    <td className="px-4 py-3"><StatusBadge status={exp.status} /></td>
                    <td className="px-4 py-3"><button className="p-1 rounded hover:bg-gray-100 transition-colors"><MoreHorizontal size={14} className="text-gray-400" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'submit' && (
        <div className="max-w-2xl">
          {submitted ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4"><CheckCircle size={24} className="text-green-500" /></div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Note de frais soumise</h3>
              <p className="text-xs text-gray-400">Votre note de frais a été envoyée pour validation. Vous serez notifié dès qu'elle sera traitée.</p>
              <button onClick={() => { setSubmitted(false); setAmount(''); setDescription('') }}
                className="mt-5 px-4 py-2 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">Soumettre une autre note</button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Nouvelle note de frais</h2>
                <p className="text-xs text-gray-400 mt-0.5">Joignez votre justificatif et remplissez les informations ci-dessous</p>
              </div>
              <div className="p-5 grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Justificatif (reçu / facture)</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer">
                    <Upload size={20} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-medium">Glisser-déposer ou <span className="text-indigo-600 underline">parcourir</span></p>
                    <p className="text-[11px] text-gray-400 mt-1">PDF, JPEG, PNG — max 10 Mo</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Catégorie</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white text-gray-700">
                    {['Déplacement', 'Repas client', 'Matériel', 'Formation', 'Logiciel', 'Hébergement', 'Autre'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Montant TTC (€)</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Date de la dépense</label>
                  <input type="date" defaultValue="2024-07-15"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-gray-700" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Projet lié (optionnel)</label>
                  <select className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white text-gray-700">
                    <option value="">Aucun projet</option>
                    {projects.map(p => <option key={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                    placeholder="Décrivez brièvement la dépense et son contexte professionnel…"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none placeholder:text-gray-400" />
                </div>
              </div>
              <div className="px-5 pb-5 flex gap-2">
                <button className="flex-1 px-4 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Enregistrer brouillon</button>
                <button onClick={() => setSubmitted(true)}
                  className="flex-1 px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">Soumettre pour validation</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Projects ──────────────────────────────────────────────────────────────────

const timeEntries = [
  { employee: 'Thomas Martin', project: 'Refonte plateforme client', mon: 8, tue: 7.5, wed: 8, thu: 6, fri: 7, total: '36.5h' },
  { employee: 'Emma Rousseau', project: 'Module BI & analytics', mon: 0, tue: 7, wed: 8, thu: 7.5, fri: 8, total: '30.5h' },
  { employee: 'Antoine Girard', project: 'Migration infrastructure cloud', mon: 8, tue: 8, wed: 6, thu: 8, fri: 7, total: '37h' },
]

function ProjectsModule() {
  const [tab, setTab] = useState<'projects' | 'time'>('projects')

  return (
    <div className="p-6">
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit mb-6">
        {(['projects', 'time'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'projects' ? 'Projets' : 'Feuilles de temps'}
          </button>
        ))}
      </div>

      {tab === 'projects' && (
        <div className="space-y-3">
          {projects.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{p.client} · {p.members} membres · {p.logged} saisis</p>
                  <ProgressBar value={p.progress} />
                </div>
                <div className="flex items-start gap-6 text-xs flex-shrink-0">
                  <div className="text-right">
                    <p className="text-gray-400">Budget</p>
                    <p className="font-semibold text-gray-900 mt-0.5">{p.budget}</p>
                    <p className="text-gray-400">{p.spent} dépensé</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400">Deadline</p>
                    <p className={`font-semibold mt-0.5 ${p.status === 'Terminé' ? 'text-green-600' : 'text-gray-900'}`}>{p.deadline}</p>
                  </div>
                  <button className="p-1 rounded hover:bg-gray-100 transition-colors mt-0.5"><MoreHorizontal size={15} className="text-gray-400" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'time' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-700">Semaine du 8 au 12 juillet 2024</p>
            <div className="flex items-center gap-2">
              <button className="text-xs text-gray-400 hover:text-gray-600 p-1"><ChevronDown size={14} className="rotate-90" /></button>
              <button className="text-xs text-gray-400 hover:text-gray-600 p-1"><ChevronDown size={14} className="-rotate-90" /></button>
            </div>
          </div>
          <table className="w-full text-xs">
            <TableHeader cols={['Employé', 'Projet', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Total']} />
            <tbody>
              {timeEntries.map((row, i) => (
                <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50/40 transition-colors ${i === timeEntries.length - 1 ? 'border-0' : ''}`}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar initials={row.employee.split(' ').map(n => n[0]).join('')} size="sm" /><span className="font-medium text-gray-900">{row.employee}</span></div></td>
                  <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{row.project}</td>
                  {[row.mon, row.tue, row.wed, row.thu, row.fri].map((h, j) => (
                    <td key={j} className={`px-4 py-3 text-center tabular-nums ${h === 0 ? 'text-gray-300' : h >= 8 ? 'text-green-600 font-semibold' : 'text-gray-700'}`}>{h === 0 ? '—' : `${h}h`}</td>
                  ))}
                  <td className="px-4 py-3 font-bold text-indigo-600 tabular-nums">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Support ───────────────────────────────────────────────────────────────────

function SupportModule() {
  const [statusFilter, setStatusFilter] = useState('Tous')
  const statuses = ['Tous', 'Ouvert', 'En cours', 'Résolu', 'Fermé']
  const filtered = tickets.filter(t => statusFilter === 'Tous' || t.status === statusFilter)

  return (
    <div className="p-6">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Ouverts', value: String(tickets.filter(t => t.status === 'Ouvert').length), color: 'text-red-600' },
          { label: 'En cours', value: String(tickets.filter(t => t.status === 'En cours').length), color: 'text-blue-600' },
          { label: 'Résolus cette semaine', value: '3', color: 'text-green-600' },
          { label: 'Temps de résolution moy.', value: '4h 22m', color: 'text-gray-900' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Rechercher un ticket…"
            className="pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-52 placeholder:text-gray-400" />
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <TableHeader cols={['ID', 'Sujet', 'Client', 'Priorité', 'Statut', 'SLA restant', 'Assigné', 'Créé le', '']} />
          <tbody>
            {filtered.map((tkt, i) => (
              <tr key={tkt.id} className={`border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                <td className="px-4 py-3 font-mono text-gray-400 text-[11px]">{tkt.id}</td>
                <td className="px-4 py-3 font-medium text-gray-900 max-w-[220px] truncate">{tkt.subject}</td>
                <td className="px-4 py-3 text-gray-600">{tkt.client}</td>
                <td className="px-4 py-3"><StatusBadge status={tkt.priority} /></td>
                <td className="px-4 py-3"><StatusBadge status={tkt.status} /></td>
                <td className={`px-4 py-3 font-medium tabular-nums ${tkt.sla !== '—' && (tkt.priority === 'Critique' || tkt.priority === 'Haute') ? 'text-red-600' : 'text-gray-500'}`}>{tkt.sla}</td>
                <td className="px-4 py-3">
                  {tkt.assignee ? <Avatar initials={tkt.assignee} size="sm" /> : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{tkt.created}</td>
                <td className="px-4 py-3"><button className="p-1 rounded hover:bg-gray-100 transition-colors"><MoreHorizontal size={14} className="text-gray-400" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Documents (GED) ───────────────────────────────────────────────────────────

function DocumentsModule() {
  const [activeFolder, setActiveFolder] = useState('Tous')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [search, setSearch] = useState('')

  const filtered = documents.filter(d => {
    const matchFolder = activeFolder === 'Tous' || d.folder === activeFolder
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase())
    return matchFolder && matchSearch
  })

  return (
    <div className="flex h-full">
      {/* Folder sidebar */}
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

      {/* Main */}
      <div className="flex-1 p-5 min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Recherche plein texte…"
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
          </div>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}><List size={13} /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}><Grid size={13} /></button>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            <Upload size={12} />Déposer
          </button>
        </div>

        {viewMode === 'list' ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-xs">
              <TableHeader cols={['', 'Nom', 'Dossier', 'Modifié le', 'Taille', '']} />
              <tbody>
                {filtered.map((doc, i) => (
                  <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-4 py-3 w-8"><DocIcon type={doc.type} /></td>
                    <td className="px-4 py-3 font-medium text-gray-900">{doc.name}</td>
                    <td className="px-4 py-3"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[11px] font-medium">{doc.folder}</span></td>
                    <td className="px-4 py-3 text-gray-400">{doc.modified}</td>
                    <td className="px-4 py-3 text-gray-400 tabular-nums">{doc.size}</td>
                    <td className="px-4 py-3"><button className="p-1 rounded hover:bg-gray-100 transition-colors"><MoreHorizontal size={14} className="text-gray-400" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map((doc, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm cursor-pointer transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <DocIcon type={doc.type} />
                  <button className="p-0.5 rounded hover:bg-gray-50 transition-colors"><MoreHorizontal size={13} className="text-gray-300" /></button>
                </div>
                <p className="text-xs font-medium text-gray-900 leading-snug mb-2 line-clamp-2">{doc.name}</p>
                <div className="flex items-center justify-between">
                  <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] font-medium">{doc.folder}</span>
                  <span className="text-[10px] text-gray-400">{doc.size}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── E-Signature data & module ─────────────────────────────────────────────────

const esignDocs = [
  { id: 'SGN-0024', title: 'Contrat CDI — Claire Fontaine', parties: ['Claire Fontaine', 'Marie Dupont (RH)'], created: '14 juil. 2024', deadline: '21 juil. 2024', status: 'En attente', signers: [{ name: 'Claire Fontaine', initials: 'CF', done: false }, { name: 'Marie Dupont', initials: 'MD', done: true }] },
  { id: 'SGN-0023', title: 'Avenant salaire Q3 — Thomas Martin', parties: ['Thomas Martin', 'Sophie Bernard (DG)'], created: '10 juil. 2024', deadline: '17 juil. 2024', status: 'Expiré', signers: [{ name: 'Thomas Martin', initials: 'TM', done: false }, { name: 'Sophie Bernard', initials: 'SB', done: true }] },
  { id: 'SGN-0022', title: 'NDA — Vertex Cloud', parties: ['Damien Koch (Vertex)', 'Lucas Petit'], created: '08 juil. 2024', deadline: '15 juil. 2024', status: 'Signé', signers: [{ name: 'Damien Koch', initials: 'DK', done: true }, { name: 'Lucas Petit', initials: 'LP', done: true }] },
  { id: 'SGN-0021', title: 'Contrat prestation — Pragma Studios', parties: ['Julie Dumont', 'Sophie Bernard'], created: '01 juil. 2024', deadline: '10 juil. 2024', status: 'Signé', signers: [{ name: 'Julie Dumont', initials: 'JD', done: true }, { name: 'Sophie Bernard', initials: 'SB', done: true }] },
  { id: 'SGN-0020', title: 'Accord de confidentialité — Nexaris', parties: ['Pierre Leclerc', 'Lucas Petit'], created: '25 juin 2024', deadline: '05 juil. 2024', status: 'En attente', signers: [{ name: 'Pierre Leclerc', initials: 'PL', done: false }, { name: 'Lucas Petit', initials: 'LP', done: true }] },
]

function ESignModule() {
  const [selected, setSelected] = useState<typeof esignDocs[0] | null>(null)
  const [statusFilter, setStatusFilter] = useState('Tous')
  const statuses = ['Tous', 'En attente', 'Signé', 'Expiré']
  const filtered = esignDocs.filter(d => statusFilter === 'Tous' || d.status === statusFilter)

  if (selected) {
    return (
      <div className="p-6 max-w-5xl">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-5 transition-colors">
          <ChevronLeft size={14} />Retour à la liste
        </button>
        <div className="grid grid-cols-5 gap-5">
          {/* Document preview */}
          <div className="col-span-3 bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-700">{selected.title}</p>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"><Eye size={12} />Aperçu</button>
                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"><Download size={12} />Télécharger</button>
              </div>
            </div>
            <div className="p-8 min-h-[480px] flex flex-col">
              {/* Simulated document */}
              <div className="border-b border-gray-200 pb-4 mb-6">
                <p className="text-base font-bold text-gray-900 mb-1">{selected.title}</p>
                <p className="text-xs text-gray-400">Document confidentiel · Réf. {selected.id}</p>
              </div>
              <div className="space-y-3 flex-1">
                {['Entre les soussignés :', 'La société MBOKA SAS, au capital de 50 000 €, dont le siège social est situé au 42 Avenue des Champs-Élysées, 75008 Paris, représentée par Mme Sophie Bernard, en qualité de Directrice Générale,', 'Et :', selected.parties[0] + ', ci-après dénommé(e) « le Signataire »,', 'Il a été convenu ce qui suit :'].map((p, i) => (
                  <p key={i} className="text-xs text-gray-600 leading-relaxed">{p}</p>
                ))}
                <div className="h-16 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center mt-4">
                  <p className="text-xs text-gray-400">… contenu du document …</p>
                </div>
              </div>
              {/* Signature zones */}
              <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                {selected.signers.map(s => (
                  <div key={s.name} className={`rounded-lg border-2 border-dashed p-3 ${s.done ? 'border-green-200 bg-green-50' : 'border-indigo-200 bg-indigo-50/40'}`}>
                    <p className="text-[11px] text-gray-500 mb-1">Signature de {s.name}</p>
                    {s.done ? (
                      <div className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle size={13} />
                        <p className="text-xs font-semibold italic" style={{ fontFamily: 'Georgia, serif' }}>{s.name.split(' ')[0]}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-indigo-500">
                        <PenLine size={13} />
                        <p className="text-xs text-indigo-500">En attente de signature</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-700 mb-3">Statut du document</p>
              <div className="flex items-center gap-2 mb-4">
                <StatusBadge status={selected.status} />
                <span className="text-xs text-gray-400">· Créé le {selected.created}</span>
              </div>
              <div className="space-y-3">
                {selected.signers.map(s => (
                  <div key={s.name} className="flex items-center gap-3">
                    <Avatar initials={s.initials} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">{s.name}</p>
                      <p className={`text-[11px] ${s.done ? 'text-green-600' : 'text-amber-500'}`}>{s.done ? 'A signé' : 'En attente'}</p>
                    </div>
                    {s.done ? <CheckCircle size={14} className="text-green-500" /> : <Clock size={14} className="text-amber-400" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-700 mb-3">Actions</p>
              <div className="space-y-2">
                {selected.status === 'En attente' && (
                  <button className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                    <Send size={12} />Relancer les signataires
                  </button>
                )}
                <button className="w-full flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  <Download size={12} />Télécharger le PDF
                </button>
                {selected.status !== 'Signé' && (
                  <button className="w-full flex items-center justify-center gap-1.5 py-2 border border-red-100 text-red-500 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors">
                    <X size={12} />Annuler la demande
                  </button>
                )}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-800 mb-1">Échéance</p>
              <p className="text-xs text-amber-600">{selected.deadline}</p>
              {selected.status === 'En attente' && <p className="text-[11px] text-amber-500 mt-1">Relance automatique J-2</p>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'En attente de signature', value: String(esignDocs.filter(d => d.status === 'En attente').length), color: 'text-amber-600' },
          { label: 'Signés ce mois', value: String(esignDocs.filter(d => d.status === 'Signé').length), color: 'text-green-600' },
          { label: 'Expirés', value: String(esignDocs.filter(d => d.status === 'Expiré').length), color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <TableHeader cols={['Réf.', 'Document', 'Parties', 'Créé le', 'Échéance', 'Signataires', 'Statut', '']} />
          <tbody>
            {filtered.map((doc, i) => (
              <tr key={doc.id} onClick={() => setSelected(doc)} className={`border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                <td className="px-4 py-3 font-mono text-gray-400 text-[11px]">{doc.id}</td>
                <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{doc.title}</td>
                <td className="px-4 py-3 text-gray-500">{doc.parties.length} parties</td>
                <td className="px-4 py-3 text-gray-400">{doc.created}</td>
                <td className="px-4 py-3 text-gray-400">{doc.deadline}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {doc.signers.map(s => (
                      <div key={s.name} className="relative">
                        <Avatar initials={s.initials} size="sm" />
                        {s.done && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />}
                      </div>
                    ))}
                    <span className="text-[10px] text-gray-400 ml-1">{doc.signers.filter(s => s.done).length}/{doc.signers.length}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                <td className="px-4 py-3"><ChevronRight size={14} className="text-gray-300" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── BI / Reports data & module ────────────────────────────────────────────────

const biReports = [
  { id: 1, name: 'CA mensuel par module', type: 'Graphique barres', owner: 'Sophie Bernard', updated: '14 juil. 2024', schedule: 'Hebdo', views: 34 },
  { id: 2, name: 'Pipeline CRM — taux de conversion', type: 'Entonnoir', owner: 'Lucas Petit', updated: '10 juil. 2024', schedule: 'Mensuel', views: 18 },
  { id: 3, name: 'Masse salariale vs budget', type: 'Tableau croisé', owner: 'Julien Morel', updated: '05 juil. 2024', schedule: 'Mensuel', views: 12 },
  { id: 4, name: 'SLA Support — résolution par priorité', type: 'Graphique lignes', owner: 'Marie Dupont', updated: '01 juil. 2024', schedule: 'Quotidien', views: 51 },
]

export const biBarData = [
  { module: 'Finance', ca: 45200 }, { module: 'CRM', ca: 38700 }, { module: 'RH', ca: 12400 },
  { module: 'Achats', ca: 22100 }, { module: 'Support', ca: 9800 },
]

const biPieData = [
  { name: 'Gagné', value: 45000, color: '#16A34A' },
  { name: 'Négociation', value: 302000, color: '#4F46E5' },
  { name: 'Proposition', value: 35800, color: '#D97706' },
  { name: 'Qualification', value: 160200, color: '#9333EA' },
  { name: 'Prospection', value: 91500, color: '#2563EB' },
]

export const availableMetrics = [
  'Chiffre d\'affaires', 'Marge brute', 'Nombre de deals', 'Taux de conversion',
  'Effectifs actifs', 'Masse salariale', 'Tickets ouverts', 'Délai moyen résolution',
  'Valeur stock total', 'Commandes en attente', 'Notes de frais soumises', 'Heures facturables',
]

function BIModule() {
  const [tab, setTab] = useState<'library' | 'builder'>('library')
  const [addedMetrics, setAddedMetrics] = useState<string[]>(['Chiffre d\'affaires', 'Nombre de deals'])

  return (
    <div className="p-6">
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit mb-6">
        {(['library', 'builder'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'library' ? 'Bibliothèque de rapports' : 'Constructeur de rapport'}
          </button>
        ))}
      </div>

      {tab === 'library' && (
        <div className="space-y-5">
          {/* Quick charts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-700 mb-4">CA par module (juil. 2024)</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={biBarData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="module" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
                  <Tooltip formatter={(v) => [formatEur(Number(v)), 'CA']} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                  <Bar dataKey="ca" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-700 mb-4">Pipeline CRM — répartition</p>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={biPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2} dataKey="value">
                      {biPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [formatEur(Number(v))]} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1">
                  {biPieData.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-[11px] text-gray-600 flex-1">{d.name}</span>
                      <span className="text-[11px] font-medium text-gray-700 tabular-nums">{formatEur(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Saved reports */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-700">Rapports sauvegardés</p>
            </div>
            <table className="w-full text-xs">
              <TableHeader cols={['Nom du rapport', 'Type', 'Propriétaire', 'Mis à jour', 'Planification', 'Vues', '']} />
              <tbody>
                {biReports.map((r, i) => (
                  <tr key={r.id} className={`border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors ${i === biReports.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3"><span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[11px] font-medium">{r.type}</span></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar initials={r.owner.split(' ').map(n => n[0]).join('')} size="sm" /><span className="text-gray-600">{r.owner}</span></div></td>
                    <td className="px-4 py-3 text-gray-400">{r.updated}</td>
                    <td className="px-4 py-3"><span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[11px]">{r.schedule}</span></td>
                    <td className="px-4 py-3 text-gray-400 tabular-nums">{r.views}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="text-[11px] px-2 py-1 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-1"><Download size={10} />Export</button>
                        <button className="p-1 rounded hover:bg-gray-100 transition-colors"><MoreHorizontal size={14} className="text-gray-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'builder' && (
        <div className="grid grid-cols-3 gap-5">
          {/* Metric picker */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-700 mb-3">Métriques disponibles</p>
            <div className="relative mb-3">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input placeholder="Filtrer…" className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
            </div>
            <div className="space-y-1">
              {availableMetrics.map(m => {
                const added = addedMetrics.includes(m)
                return (
                  <button key={m} onClick={() => setAddedMetrics(prev => added ? prev.filter(x => x !== m) : [...prev, m])}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${added ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <GripVertical size={12} className="text-gray-300 flex-shrink-0" />
                    <span className="flex-1">{m}</span>
                    {added ? <Minus size={12} className="text-indigo-400" /> : <PlusCircle size={12} className="text-gray-300" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Builder canvas */}
          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <input defaultValue="Nouveau rapport" className="text-sm font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-400 focus:outline-none pb-0.5 transition-colors" />
                  <p className="text-xs text-gray-400 mt-0.5">{addedMetrics.length} métriques · Graphique barres</p>
                </div>
                <div className="flex items-center gap-2">
                  <select className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                    {['Graphique barres', 'Graphique lignes', 'Camembert', 'Tableau', 'KPI cards'].map(o => <option key={o}>{o}</option>)}
                  </select>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"><Download size={12} />Exporter</button>
                </div>
              </div>

              {addedMetrics.length === 0 ? (
                <div className="h-48 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center">
                  <GripVertical size={20} className="text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400">Glissez des métriques depuis le panneau gauche</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={addedMetrics.map((m, i) => ({ name: m.length > 14 ? m.slice(0, 14) + '…' : m, value: [128450, 18, 247, 589700, 92790, 35181, 648, 342, 47, 23, 6, 156][i % 12] }))} margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                    <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-700 mb-3">Filtres & planification</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Période', type: 'select', options: ['Ce mois', 'Ce trimestre', 'Cette année', 'Personnalisé'] },
                  { label: 'Regrouper par', type: 'select', options: ['Module', 'Département', 'Utilisateur', 'Statut'] },
                  { label: 'Planification', type: 'select', options: ['Aucune', 'Quotidien', 'Hebdo', 'Mensuel'] },
                  { label: 'Destinataires', type: 'text', placeholder: 'sophie.bernard@os.io' },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-[11px] font-medium text-gray-600 mb-1 block">{f.label}</label>
                    {f.type === 'select' ? (
                      <select className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                        {f.options!.map(o => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input placeholder={f.placeholder} className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors">Enregistrer le rapport</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Automations data & module ─────────────────────────────────────────────────

const automations = [
  { id: 1, name: 'Embauche → Création compte Finance', trigger: 'Nouvel employé créé (RH)', actions: ['Créer compte Finance', 'Notifier Comptabilité', 'Envoyer e-mail de bienvenue'], status: 'Actif', runs: 14, lastRun: 'il y a 2j' },
  { id: 2, name: 'Deal Gagné → Facturation automatique', trigger: 'Deal passé au statut Gagné (CRM)', actions: ['Créer brouillon de facture', 'Assigner au commercial', 'Notifier Finance'], status: 'Actif', runs: 8, lastRun: 'il y a 5j' },
  { id: 3, name: 'Facture en retard → Alerte Slack', trigger: 'Facture non payée J+30 (Finance)', actions: ['Envoyer alerte Slack #finance', 'Créer tâche relance CRM'], status: 'Actif', runs: 3, lastRun: 'il y a 1j' },
  { id: 4, name: 'Stock faible → Bon de commande', trigger: 'Quantité produit < seuil minimum (Stock)', actions: ['Créer bon de commande brouillon', 'Notifier Responsable Achats'], status: 'Pausé', runs: 0, lastRun: 'Jamais' },
  { id: 5, name: 'Ticket critique → Escalade manager', trigger: 'Ticket Critique ouvert > 2h (Support)', actions: ['Escalader au manager', 'Notifier par SMS', 'Créer alerte dashboard'], status: 'Actif', runs: 5, lastRun: 'il y a 3h' },
]

export const triggerModules = ['RH', 'CRM', 'Finance', 'Stock', 'Support', 'Achats', 'Projets']
export const availableActions = [
  'Envoyer un e-mail', 'Notifier sur Slack', 'Créer une tâche', 'Créer une facture',
  'Créer un bon de commande', 'Assigner à un utilisateur', 'Changer un statut',
  'Déclencher un webhook', 'Générer un rapport', 'Envoyer une notification push',
]

function AutomationsModule() {
  const [tab, setTab] = useState<'list' | 'builder'>('list')
  const [builderActions, setBuilderActions] = useState<string[]>(['Envoyer un e-mail'])

  return (
    <div className="p-6">
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit mb-6">
        {(['list', 'builder'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'list' ? 'Automatisations actives' : 'Créer une automatisation'}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Automatisations actives', value: String(automations.filter(a => a.status === 'Actif').length), color: 'text-green-600' },
              { label: 'Exécutions ce mois', value: String(automations.reduce((s, a) => s + a.runs, 0)), color: 'text-indigo-600' },
              { label: 'En pause', value: String(automations.filter(a => a.status === 'Pausé').length), color: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {automations.map(auto => (
              <div key={auto.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${auto.status === 'Actif' ? 'bg-green-500' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-semibold text-gray-900">{auto.name}</p>
                      <StatusBadge status={auto.status} />
                    </div>
                    {/* Flow diagram */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                        <Zap size={10} />{auto.trigger}
                      </div>
                      <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
                      {auto.actions.map((action, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-[11px] font-medium">{action}</div>
                          {i < auto.actions.length - 1 && <ChevronRight size={12} className="text-gray-300" />}
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">{auto.runs} exécution{auto.runs !== 1 ? 's' : ''} · Dernière : {auto.lastRun}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button className={`p-1.5 rounded-lg border transition-colors ${auto.status === 'Actif' ? 'border-amber-100 bg-amber-50 text-amber-600 hover:bg-amber-100' : 'border-green-100 bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {auto.status === 'Actif' ? <Pause size={13} /> : <Play size={13} />}
                    </button>
                    <button className="p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"><MoreHorizontal size={13} className="text-gray-400" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'builder' && (
        <div className="max-w-3xl">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <input defaultValue="Nouvelle automatisation" className="text-sm font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-400 focus:outline-none pb-0.5 w-full transition-colors" />
              <p className="text-xs text-gray-400 mt-0.5">Définissez un déclencheur puis enchaînez les actions</p>
            </div>

            <div className="p-5 space-y-4">
              {/* Trigger */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">1</span>
                  <p className="text-xs font-semibold text-gray-700">Déclencheur</p>
                </div>
                <div className="ml-7 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-500 mb-1 block">Module source</label>
                    <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                      {triggerModules.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 mb-1 block">Événement</label>
                    <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                      {['Création d\'un enregistrement', 'Changement de statut', 'Valeur seuil atteinte', 'Date d\'échéance dépassée'].map(e => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Connector */}
              <div className="ml-7 flex items-center gap-2">
                <div className="w-px h-6 bg-gray-200 ml-2.5" />
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Alors</span>
              </div>

              {/* Actions */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">2</span>
                  <p className="text-xs font-semibold text-gray-700">Actions</p>
                </div>
                <div className="ml-7 space-y-2">
                  {builderActions.map((action, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                        <GripVertical size={12} className="text-indigo-300 cursor-grab" />
                        <select value={action} onChange={e => setBuilderActions(prev => prev.map((a, j) => j === i ? e.target.value : a))}
                          className="flex-1 text-xs bg-transparent text-indigo-700 font-medium focus:outline-none">
                          {availableActions.map(a => <option key={a}>{a}</option>)}
                        </select>
                      </div>
                      <button onClick={() => setBuilderActions(prev => prev.filter((_, j) => j !== i))}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                    </div>
                  ))}
                  <button onClick={() => setBuilderActions(prev => [...prev, 'Envoyer un e-mail'])}
                    className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-indigo-200 text-indigo-500 text-xs font-medium rounded-lg hover:bg-indigo-50 transition-colors">
                    <Plus size={12} />Ajouter une action
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 flex gap-2">
              <button className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">Tester l'automatisation</button>
              <button className="flex-1 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors">Activer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Quality / Compliance data & module ────────────────────────────────────────

const audits = [
  { id: 'AUD-2024-008', title: 'Audit RGPD — traitement des données RH', type: 'Conformité', assignee: 'Sophie Bernard', initials: 'SB', deadline: '31 août 2024', status: 'En cours', progress: 65, nc: 2 },
  { id: 'AUD-2024-007', title: 'Contrôle qualité processus achats', type: 'Qualité', assignee: 'Julien Morel', initials: 'JM', deadline: '15 août 2024', status: 'En cours', progress: 40, nc: 1 },
  { id: 'AUD-2024-006', title: 'ISO 27001 — sécurité des systèmes', type: 'Sécurité', assignee: 'Antoine Girard', initials: 'AG', deadline: '01 juil. 2024', status: 'Clôturé', progress: 100, nc: 0 },
  { id: 'AUD-2024-005', title: 'Audit financier interne Q2', type: 'Finance', assignee: 'Sophie Bernard', initials: 'SB', deadline: '30 juin 2024', status: 'Clôturé', progress: 100, nc: 1 },
  { id: 'AUD-2024-004', title: 'Vérification conformité facturation', type: 'Finance', assignee: 'Julien Morel', initials: 'JM', deadline: '15 sep. 2024', status: 'Planifié', progress: 0, nc: 0 },
]

const auditChecklist = [
  { item: 'Vérification des droits d\'accès utilisateurs', done: true, nc: false },
  { item: 'Contrôle des journaux de connexion (90 jours)', done: true, nc: false },
  { item: 'Inventaire des données personnelles traitées', done: true, nc: true },
  { item: 'Validation des contrats sous-traitants (DPA)', done: false, nc: false },
  { item: 'Test de restauration des sauvegardes', done: false, nc: true },
  { item: 'Révision de la politique de conservation', done: false, nc: false },
]

function QualityModule() {
  const [selected, setSelected] = useState<typeof audits[0] | null>(null)

  if (selected) {
    return (
      <div className="p-6 max-w-4xl">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-5 transition-colors">
          <ChevronLeft size={14} />Retour à la liste
        </button>
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{selected.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[11px] font-medium">{selected.type}</span>
                    <StatusBadge status={selected.status} />
                  </div>
                </div>
                <ProgressBar value={selected.progress} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-700">Checklist de contrôle</p>
                  <span className="text-[11px] text-gray-400">{auditChecklist.filter(c => c.done).length}/{auditChecklist.length} points</span>
                </div>
                <div className="space-y-2">
                  {auditChecklist.map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg border ${item.nc ? 'border-red-100 bg-red-50' : 'border-gray-100'}`}>
                      <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-green-500' : 'border-2 border-gray-200'}`}>
                        {item.done && <CheckCircle size={12} className="text-white" />}
                      </div>
                      <span className={`text-xs flex-1 ${item.done ? 'text-gray-600' : 'text-gray-800'}`}>{item.item}</span>
                      {item.nc && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">Non-conformité</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-700 mb-3">Plan d'action</p>
              {auditChecklist.filter(c => c.nc).map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg mb-2 last:mb-0">
                  <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-red-700">{item.item}</p>
                    <input placeholder="Décrire l'action corrective…" className="mt-1.5 w-full text-xs bg-white border border-red-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-300/30 placeholder:text-red-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-700 mb-3">Informations</p>
              {[
                { label: 'Responsable', value: selected.assignee },
                { label: 'Échéance', value: selected.deadline },
                { label: 'Non-conformités', value: `${selected.nc} détectée${selected.nc > 1 ? 's' : ''}` },
                { label: 'Avancement', value: `${selected.progress}%` },
              ].map(info => (
                <div key={info.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-[11px] text-gray-400">{info.label}</span>
                  <span className="text-xs font-medium text-gray-700">{info.value}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-700 mb-3">Preuves documentaires</p>
              <div className="space-y-2">
                {['Politique_sécurité_v3.pdf', 'Journal_connexions_juin.csv'].map(f => (
                  <div key={f} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <FilePdf size={13} className="text-red-500" />
                    <span className="text-[11px] text-gray-600 flex-1 truncate">{f}</span>
                    <Download size={11} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                  </div>
                ))}
                <button className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-gray-200 text-xs text-gray-400 rounded-lg hover:border-indigo-300 hover:text-indigo-500 transition-colors">
                  <Upload size={12} />Ajouter une preuve
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Audits en cours', value: String(audits.filter(a => a.status === 'En cours').length), color: 'text-blue-600' },
          { label: 'Clôturés ce trimestre', value: String(audits.filter(a => a.status === 'Clôturé').length), color: 'text-green-600' },
          { label: 'Non-conformités ouvertes', value: String(audits.reduce((s, a) => s + a.nc, 0)), color: 'text-red-600' },
          { label: 'Planifiés', value: String(audits.filter(a => a.status === 'Planifié').length), color: 'text-gray-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <TableHeader cols={['Réf.', 'Audit', 'Type', 'Responsable', 'Avancement', 'Échéance', 'NC', 'Statut', '']} />
          <tbody>
            {audits.map((audit, i) => (
              <tr key={audit.id} onClick={() => setSelected(audit)} className={`border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors ${i === audits.length - 1 ? 'border-0' : ''}`}>
                <td className="px-4 py-3 font-mono text-gray-400 text-[11px]">{audit.id}</td>
                <td className="px-4 py-3 font-medium text-gray-900 max-w-[220px] truncate">{audit.title}</td>
                <td className="px-4 py-3"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[11px] font-medium">{audit.type}</span></td>
                <td className="px-4 py-3"><div className="flex items-center gap-1.5"><Avatar initials={audit.initials} size="sm" /><span className="text-gray-600">{audit.assignee.split(' ')[0]}</span></div></td>
                <td className="px-4 py-3 w-32"><ProgressBar value={audit.progress} /></td>
                <td className="px-4 py-3 text-gray-400">{audit.deadline}</td>
                <td className="px-4 py-3">{audit.nc > 0 ? <span className="text-red-600 font-semibold">{audit.nc}</span> : <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3"><StatusBadge status={audit.status} /></td>
                <td className="px-4 py-3"><ChevronRight size={14} className="text-gray-300" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── HR leave tab data ─────────────────────────────────────────────────────────

const leaveRequests = [
  { id: 1, employee: 'Emma Rousseau', initials: 'ER', type: 'Congés payés', from: '15 juil.', to: '02 août', days: 13, status: 'Approuvé', manager: 'Marie Dupont' },
  { id: 2, employee: 'Camille Lefebvre', initials: 'CL', type: 'RTT', from: '22 juil.', to: '22 juil.', days: 1, status: 'En attente', manager: 'Lucas Petit' },
  { id: 3, employee: 'Thomas Martin', initials: 'TM', type: 'Congés payés', from: '01 août', to: '16 août', days: 12, status: 'En attente', manager: 'Sophie Bernard' },
  { id: 4, employee: 'Antoine Girard', initials: 'AG', type: 'Maladie', from: '10 juil.', to: '12 juil.', days: 3, status: 'Approuvé', manager: 'Sophie Bernard' },
  { id: 5, employee: 'Julien Morel', initials: 'JM', type: 'Congé sans solde', from: '05 août', to: '09 août', days: 5, status: 'Refusé', manager: 'Sophie Bernard' },
]

// ── Notifications data ────────────────────────────────────────────────────────

const notifications = [
  { id: 1, icon: AlertCircle, color: 'text-red-500 bg-red-50', title: 'Facture FCT-2024-0085 en retard', body: 'Lumière & Co · 14 jours de retard', time: 'il y a 5 min', read: false, module: 'Finance' },
  { id: 2, icon: CheckCircle, color: 'text-green-500 bg-green-50', title: 'Paiement reçu', body: 'Vertex Cloud a payé €45 200', time: 'il y a 22 min', read: false, module: 'Finance' },
  { id: 3, icon: UserCheck, color: 'text-indigo-500 bg-indigo-50', title: 'Demande de congé à valider', body: 'Thomas Martin · 1-16 août (12j)', time: 'il y a 1h', read: false, module: 'RH' },
  { id: 4, icon: AlertTriangle, color: 'text-amber-500 bg-amber-50', title: 'Stock faible', body: 'Écran 27" 4K — 3 unités restantes', time: 'il y a 2h', read: true, module: 'Stock' },
  { id: 5, icon: MessageSquare, color: 'text-blue-500 bg-blue-50', title: 'Nouveau ticket critique', body: 'TKT-1042 · Tekton BTP', time: 'il y a 3h', read: true, module: 'Support' },
  { id: 6, icon: Workflow, color: 'text-purple-500 bg-purple-50', title: 'Automatisation déclenchée', body: 'Deal Gagné → Facturation · Pragma Studios', time: 'il y a 5h', read: true, module: 'Automatisations' },
]

// ── Global search data ────────────────────────────────────────────────────────

const searchIndex = [
  { type: 'Employé', label: 'Marie Dupont', sub: 'Responsable RH · RH', module: 'hr' as Module },
  { type: 'Employé', label: 'Thomas Martin', sub: 'Développeur Senior · Tech', module: 'hr' as Module },
  { type: 'Deal', label: 'Vertex Cloud', sub: '€213 000 · Négociation', module: 'crm' as Module },
  { type: 'Facture', label: 'FCT-2024-0087', sub: 'Atlas Retail · €89 000 · En attente', module: 'finance' as Module },
  { type: 'Ticket', label: 'TKT-1042', sub: 'Connexion après MàJ · Critique', module: 'support' as Module },
  { type: 'Projet', label: 'Refonte plateforme client', sub: 'Atlas Retail · 68%', module: 'projects' as Module },
  { type: 'Audit', label: 'Audit RGPD — traitement RH', sub: 'En cours · 65%', module: 'quality' as Module },
  { type: 'Document', label: 'Rapport financier Q2 2024.xlsx', sub: 'Finance · 1.4 Mo', module: 'documents' as Module },
]

// ── Settings ──────────────────────────────────────────────────────────────────

function SettingsModule() {
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Employé')
  const [settingsTab, setSettingsTab] = useState<'members' | 'integrations'>('members')

  const integrations = [
    { name: 'Stripe Billing', desc: 'Paiements et abonnements', status: 'Connecté', color: 'text-violet-600 bg-violet-50' },
    { name: 'Pennylane', desc: 'Synchronisation comptable', status: 'Connecté', color: 'text-blue-600 bg-blue-50' },
    { name: 'Resend', desc: "Envoi d'e-mails transactionnels", status: 'Connecté', color: 'text-orange-600 bg-orange-50' },
    { name: 'Slack', desc: 'Notifications et alertes', status: 'Non configuré', color: 'text-gray-400 bg-gray-100' },
    { name: 'Zapier', desc: 'Automatisations inter-outils', status: 'Non configuré', color: 'text-gray-400 bg-gray-100' },
  ]

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit mb-6">
        {(['members', 'integrations'] as const).map(t => (
          <button key={t} onClick={() => setSettingsTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${settingsTab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'members' ? 'Membres & rôles' : 'Intégrations'}
          </button>
        ))}
      </div>

      {settingsTab === 'members' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-500">{members.length} membres dans l'organisation</p>
            <button onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus size={13} />Inviter un membre
            </button>
          </div>

          {showInvite && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-gray-900">Inviter un membre</h3>
                  <button onClick={() => setShowInvite(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} className="text-gray-400" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">Adresse email</label>
                    <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="prenom.nom@entreprise.fr"
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">Rôle</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Admin', 'Manager', 'Employé'].map(r => (
                        <button key={r} onClick={() => setInviteRole(r)}
                          className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${inviteRole === r ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{r}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button onClick={() => setShowInvite(false)} className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Annuler</button>
                  <button onClick={() => setShowInvite(false)} className="flex-1 px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">Envoyer l'invitation</button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-xs">
              <TableHeader cols={['Membre', 'Email', 'Rôle', 'Modules', 'Statut', '']} />
              <tbody>
                {members.map((m, i) => (
                  <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${i === members.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar initials={m.name.split(' ').map(n => n[0]).join('')} size="md" /><span className="font-medium text-gray-900">{m.name}</span></div></td>
                    <td className="px-4 py-3 text-gray-500">{m.email}</td>
                    <td className="px-4 py-3"><StatusBadge status={m.role} /></td>
                    <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{m.modules.map(mod => (<span key={mod} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium">{mod}</span>))}</div></td>
                    <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                    <td className="px-4 py-3"><button className="p-1 rounded hover:bg-gray-100 transition-colors"><MoreHorizontal size={14} className="text-gray-400" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {settingsTab === 'integrations' && (
        <div className="space-y-3">
          {integrations.map(intg => (
            <div key={intg.name} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${intg.color}`}>
                <PlugZap size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{intg.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{intg.desc}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${intg.status === 'Connecté' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className={`text-xs font-medium ${intg.status === 'Connecté' ? 'text-green-600' : 'text-gray-400'}`}>{intg.status}</span>
                </div>
                <button className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${intg.status === 'Connecté' ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}>
                  {intg.status === 'Connecté' ? 'Configurer' : 'Connecter'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

function Workspace({
  visibleModules = navItems.map(m => m.id),
  live = false,
  orgName, onSwitchOrg,
  userName, userRole, userInitials,
  onSignOut, accountMenu,
}: {
  visibleModules?: Module[]
  live?: boolean
  orgName?: string; onSwitchOrg?: () => void
  userName?: string; userRole?: string; userInitials?: string
  onSignOut?: () => void; accountMenu?: React.ReactNode
} = {}) {
  const [activeModule, setActiveModule] = useState<Module>('dashboard')
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [liveUnread, setLiveUnread] = useState(0)
  const unread = live ? liveUnread : notifications.filter(n => !n.read).length

  const cfg = moduleConfig[activeModule]

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true) }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])

  // In live mode, every module now has its own working create control placed
  // contextually inside the module (search/filter row, kanban column, etc.).
  // This generic topbar button was always decorative (no onClick) — showing
  // it next to a real, working one was confusing, so it's demo-mode only.
  const action = !live && cfg.actionLabel ? (
    <button className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors">
      <Plus size={13} />{cfg.actionLabel}
    </button>
  ) : undefined

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-[#0B0F19]' : 'bg-[#F9FAFB]'}`}>
      {showSearch && (
        live
          ? <LiveCmdKModal onClose={() => setShowSearch(false)} onNavigate={(m) => { setActiveModule(m); setShowSearch(false) }} />
          : <CmdKModal onClose={() => setShowSearch(false)} onNavigate={(m) => { setActiveModule(m); setShowSearch(false) }} />
      )}
      {live && (
        <LiveNotificationsHost show={showNotifs} onClose={() => setShowNotifs(false)} onNavigate={setActiveModule} onUnreadChange={setLiveUnread} />
      )}
      {!live && showNotifs && <NotificationsPanel onClose={() => setShowNotifs(false)} />}

      <Sidebar
        active={activeModule} onNavigate={setActiveModule} onSearch={() => setShowSearch(true)}
        darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)}
        visibleModules={visibleModules}
        orgName={orgName} onSwitchOrg={onSwitchOrg}
        userName={userName} userRole={userRole} userInitials={userInitials}
        onSignOut={onSignOut} accountMenu={accountMenu}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar title={cfg.title} action={action} onBell={() => setShowNotifs(s => !s)} unreadCount={unread} />
        <main className={`flex-1 overflow-y-auto ${activeModule === 'documents' ? 'flex flex-col' : ''}`}>
          {activeModule === 'dashboard' && (live ? <LiveDashboard /> : <Dashboard />)}
          {activeModule === 'hr' && (live ? <LiveHR /> : <HRModule />)}
          {activeModule === 'crm' && (live ? <LiveCRM /> : <CRMModule />)}
          {activeModule === 'finance' && (live ? <LiveFinance /> : <FinanceModule />)}
          {activeModule === 'accounting' && (live ? <LiveAccounting /> : <AccountingModule />)}
          {activeModule === 'procurement' && (live ? <LiveProcurement /> : <ProcurementModule />)}
          {activeModule === 'stock' && (live ? <LiveStock /> : <StockModule />)}
          {activeModule === 'expenses' && (live ? <LiveExpenses /> : <ExpensesModule />)}
          {activeModule === 'projects' && (live ? <LiveProjects /> : <ProjectsModule />)}
          {activeModule === 'support' && (live ? <LiveSupport /> : <SupportModule />)}
          {activeModule === 'documents' && (live ? <LiveDocuments /> : <DocumentsModule />)}
          {activeModule === 'esign' && (live ? <LiveESign /> : <ESignModule />)}
          {activeModule === 'bi' && (live ? <LiveBI /> : <BIModule />)}
          {activeModule === 'automations' && (live ? <LiveAutomations /> : <AutomationsModule />)}
          {activeModule === 'quality' && (live ? <LiveQuality /> : <QualityModule />)}
          {activeModule === 'settings' && (live ? <LiveSettings /> : <SettingsModule />)}
        </main>
      </div>
    </div>
  )
}

// Only entered once signed in. Decides between: onboarding (no orgs yet, or
// creating a new one), the org picker (signed in, no active org selected
// yet), or handing off to the authenticated workspace.
function OrgGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, userMemberships } = useOrganizationList({ userMemberships: true })
  const { organization } = useOrganization()
  const [creatingNew, setCreatingNew] = useState(false)

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] text-xs text-gray-400">Chargement…</div>
  }

  const hasOrgs = (userMemberships.data?.length ?? 0) > 0

  if (creatingNew || !hasOrgs) {
    return (
      <OnboardingFlow
        onFinish={() => setCreatingNew(false)}
        onCancel={hasOrgs ? () => setCreatingNew(false) : undefined}
      />
    )
  }

  if (!organization) {
    return <OrgSelectScreen variant="fullscreen" onCreateNew={() => setCreatingNew(true)} />
  }

  return <>{children}</>
}

function AuthedWorkspace() {
  const { user } = useUser()
  const { organization, membership } = useOrganization()
  const { signOut } = useClerk()
  const { activeModules } = useOrgSettings()
  const { rows: moduleAccessRows } = useMemberModuleAccess()
  const [showOrgSwitch, setShowOrgSwitch] = useState(false)
  const [creatingOrg, setCreatingOrg] = useState(false)

  if (creatingOrg) {
    return <OnboardingFlow onFinish={() => setCreatingOrg(false)} onCancel={() => setCreatingOrg(false)} />
  }

  const allModuleIds = navItems.map(m => m.id)
  const orgVisibleModules = activeModules
    ? Array.from(new Set([...activeModules, ...ALWAYS_ON_MODULES])) as Module[]
    : allModuleIds

  // No restriction row for this member -> they see every module the org has
  // active (see useMemberModuleAccess); a row narrows that down further.
  const myAccess = user ? moduleAccessRows.find(r => r.user_id === user.id) : undefined
  const visibleModules = myAccess
    ? Array.from(new Set([...myAccess.modules, ...ALWAYS_ON_MODULES])).filter(m => orgVisibleModules.includes(m as Module)) as Module[]
    : orgVisibleModules

  return (
    <>
      <NotificationRules />
      <EmployeeSync />
      {showOrgSwitch && (
        <OrgSelectScreen variant="modal" onClose={() => setShowOrgSwitch(false)} onCreateNew={() => setCreatingOrg(true)} />
      )}
      <Workspace
        live
        visibleModules={visibleModules}
        orgName={organization?.name}
        onSwitchOrg={() => setShowOrgSwitch(true)}
        userName={user?.fullName || user?.primaryEmailAddress?.emailAddress}
        userRole={membership?.role === 'org:admin' ? 'Admin' : 'Membre'}
        userInitials={((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')) || 'U'}
        onSignOut={() => signOut()}
        accountMenu={<UserButton appearance={clerkAppearance} />}
      />
    </>
  )
}

export default function App() {
  const [demoMode, setDemoMode] = useState(false)
  const invitationTicket = useInvitationTicket()

  if (!isClerkConfigured || demoMode) {
    return <Workspace />
  }

  const fallback = invitationTicket
    ? <AcceptInvitationScreen ticket={invitationTicket} />
    : <LoginScreen onDemo={() => setDemoMode(true)} />

  return (
    <Show when="signed-in" fallback={fallback}>
      {isSupabaseConfigured ? (
        <OrgGate>
          <AuthedWorkspace />
        </OrgGate>
      ) : (
        <SupabaseSetupNotice onDemo={() => setDemoMode(true)} />
      )}
    </Show>
  )
}
