import { useEffect } from 'react'
import { useOrganization } from '@clerk/react'
import { useSupabaseClient } from '../lib/supabase'
import { useNotifications } from '../data/notifications'
import { useInvoices } from '../data/invoices'
import { useLeaveRequests } from '../data/leaveRequests'
import { useEmployees } from '../data/employees'
import { useStockItems, stockStatus } from '../data/stockItems'
import { useTickets } from '../data/tickets'

type Candidate = { title: string; body: string; module: string }

// Headless: no UI of its own. Computes real alerts from live data (overdue
// invoices, pending leave, low/out-of-stock items, urgent open tickets) and
// fans each one out as an individual row per org member, so the bell
// reflects actual org state and every member's read/unread state stays
// theirs alone — a single shared "system" row (the previous design) meant
// one person reading an alert marked it read for everyone. There's no
// server-side job here — this runs client-side whenever the underlying
// data changes, which is sufficient for a single small team but won't catch
// changes that happen while nobody has the app open.
export function NotificationRules() {
  const { data: notifications } = useNotifications()
  const { memberships } = useOrganization({ memberships: true })
  const { organization } = useOrganization()
  const supabase = useSupabaseClient()
  const { data: invoices } = useInvoices()
  const { data: leaveRequests } = useLeaveRequests()
  const { data: employees } = useEmployees()
  const { data: stockItems } = useStockItems()
  const { data: tickets } = useTickets()

  const memberIds = Array.from(
    new Set((memberships?.data ?? []).map(m => m.publicUserData?.userId).filter((id): id is string => !!id)),
  )

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!organization || memberIds.length === 0) return
      const candidates: Candidate[] = []
      const today = new Date()

      for (const inv of invoices) {
        if (inv.status !== 'Payée' && inv.due_on && new Date(inv.due_on) < today) {
          candidates.push({ title: `Facture ${inv.number} en retard`, body: `${inv.client} · échéance dépassée`, module: 'Finance' })
        }
      }

      for (const leave of leaveRequests) {
        if (leave.status === 'En attente') {
          const employee = employees.find(e => e.id === leave.employee_id)
          candidates.push({ title: 'Demande de congé à valider', body: `${employee?.name ?? 'Employé'} · ${leave.days}j`, module: 'RH' })
        }
      }

      for (const item of stockItems) {
        const status = stockStatus(item.qty, item.min_qty)
        if (status !== 'En stock') {
          candidates.push({ title: status === 'Rupture' ? 'Rupture de stock' : 'Stock faible', body: item.name, module: 'Stock' })
        }
      }

      for (const ticket of tickets) {
        if ((ticket.priority === 'Critique' || ticket.priority === 'Haute') && (ticket.status === 'Ouvert' || ticket.status === 'En cours')) {
          candidates.push({ title: `Ticket ${ticket.priority.toLowerCase()} ouvert`, body: ticket.subject, module: 'Support' })
        }
      }

      const rows = candidates.flatMap(c =>
        memberIds
          .filter(userId => !notifications.some(n => n.user_id === userId && n.title === c.title && n.body === c.body))
          .map(userId => ({ org_id: organization.id, user_id: userId, title: c.title, body: c.body, module: c.module, read: false })),
      )
      if (rows.length === 0 || cancelled) return

      // upsert + ignoreDuplicates (backed by the notifications_dedup unique
      // index) makes this idempotent under the same-tick races this effect
      // is prone to (it re-runs on every realtime-driven data refresh) —
      // a plain insert() after a stale "does this exist" check is what
      // produced duplicate rows before.
      await (supabase.from('notifications') as any)
        .upsert(rows, { onConflict: 'org_id,user_id,title,body', ignoreDuplicates: true })
    }

    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, leaveRequests, employees, stockItems, tickets, notifications, organization?.id, memberIds.join(',')])

  return null
}
