// Row shapes mirroring supabase/schema.sql. Every row also has `id: string`
// and `org_id: string`, added generically by useSupabaseTable<T>.

export type Employee = {
  name: string
  role: string
  dept: string
  contract: string
  status: string
  hire_date: string | null
}

export type LeaveRequest = {
  employee_id: string | null
  type: string
  starts_on: string
  ends_on: string
  days: number
  status: string
  manager: string | null
}

export type Deal = {
  company: string
  amount: number
  contact: string | null
  close_date: string | null
  stage: string
}

export type Invoice = {
  number: string
  client: string
  amount: number
  issued_on: string
  due_on: string | null
  status: string
}

export type BankTransaction = {
  txn_date: string
  label: string
  amount: number
  type: string
  matched: boolean
}

export type PurchaseOrder = {
  number: string
  supplier: string
  amount: number
  ordered_on: string
  delivery_on: string | null
  status: string
  items_count: number
}

export type StockItem = {
  ref: string
  name: string
  qty: number
  warehouse: string | null
  min_qty: number
  value: number
}

export type Expense = {
  number: string
  employee_id: string | null
  category: string
  amount: number
  spent_on: string
  description: string | null
  status: string
  receipt_path: string | null
}

export type Project = {
  name: string
  client: string | null
  progress: number
  budget: number
  spent: number
  members_count: number
  deadline: string | null
  status: string
  logged_hours: number
}

export type TimeEntry = {
  project_id: string | null
  employee_id: string | null
  work_date: string
  hours: number
}

export type Ticket = {
  number: string
  subject: string
  client: string | null
  assignee: string | null
  priority: string
  status: string
  sla_deadline: string | null
}

export type Document = {
  name: string
  folder: string | null
  size_bytes: number
  file_type: string | null
  storage_path: string | null
  updated_at: string
}

export type EsignDocument = {
  title: string
  status: string
  deadline: string | null
  storage_path: string | null
  created_by: string | null
}

export type EsignSigner = {
  esign_document_id: string | null
  name: string
  initials: string | null
  done: boolean
  token: string
  user_id: string | null
}

export type BiReport = {
  name: string
  type: string | null
  owner: string | null
  schedule: string | null
  views: number
  config: Record<string, unknown>
  updated_at: string
}

export type Automation = {
  name: string
  trigger_module: string | null
  trigger_description: string | null
  actions: string[]
  status: string
  runs_count: number
  last_run_at: string | null
}

export type Audit = {
  title: string
  type: string | null
  assignee: string | null
  deadline: string | null
  status: string
  progress: number
  nc_count: number
}

export type AuditChecklistItem = {
  audit_id: string | null
  item: string
  done: boolean
  nc: boolean
  sort_order: number
}

export type Notification = {
  user_id: string
  title: string
  body: string | null
  module: string | null
  read: boolean
}

export type OrgSettings = {
  active_modules: string[]
  updated_at: string
}
