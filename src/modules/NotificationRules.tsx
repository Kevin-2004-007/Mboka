import { useEffect } from 'react'
import { useNotifications } from '../data/notifications'
import { useInvoices } from '../data/invoices'
import { useLeaveRequests } from '../data/leaveRequests'
import { useEmployees } from '../data/employees'
import { useStockItems, stockStatus } from '../data/stockItems'
import { useTickets } from '../data/tickets'

type Candidate = { title: string; body: string; module: string }

// Headless: no UI of its own. Computes real alerts from live data (overdue
// invoices, pending leave, low/out-of-stock items, urgent open tickets) and
// persists any not already recorded, so the notification bell reflects
// actual org state instead of staying permanently empty. There's no
// server-side job here — this runs client-side whenever the underlying
// data changes, which is sufficient for a single small team but won't catch
// changes that happen while nobody has the app open.
export function NotificationRules() {
  const { data: notifications, insert } = useNotifications()
  const { data: invoices } = useInvoices()
  const { data: leaveRequests } = useLeaveRequests()
  const { data: employees } = useEmployees()
  const { data: stockItems } = useStockItems()
  const { data: tickets } = useTickets()

  useEffect(() => {
    let cancelled = false

    async function run() {
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

      const missing = candidates.filter(c => !notifications.some(n => n.title === c.title && n.body === c.body))
      for (const c of missing) {
        if (cancelled) return
        await insert({ user_id: 'system', title: c.title, body: c.body, module: c.module, read: false })
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [invoices, leaveRequests, employees, stockItems, tickets, notifications, insert])

  return null
}
