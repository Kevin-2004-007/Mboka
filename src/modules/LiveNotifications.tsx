import { useEffect } from 'react'
import { X, Bell, CreditCard, UserCheck, AlertTriangle, MessageSquare, Workflow, Target } from 'lucide-react'
import { useNotifications } from '../data/notifications'

const moduleIcon: Record<string, { Icon: React.ElementType; color: string }> = {
  Finance: { Icon: CreditCard, color: 'text-indigo-500 bg-indigo-50' },
  RH: { Icon: UserCheck, color: 'text-blue-500 bg-blue-50' },
  Stock: { Icon: AlertTriangle, color: 'text-amber-500 bg-amber-50' },
  Support: { Icon: MessageSquare, color: 'text-blue-500 bg-blue-50' },
  Automatisations: { Icon: Workflow, color: 'text-purple-500 bg-purple-50' },
  CRM: { Icon: Target, color: 'text-amber-500 bg-amber-50' },
}

function timeAgo(value: string) {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diffMs / (1000 * 60))
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

// Headless: reports the live unread count up to Workspace without owning
// any visible UI, so the demo-mode Topbar/badge stays untouched.
export function LiveUnreadCount({ onChange }: { onChange: (n: number) => void }) {
  const { data } = useNotifications()
  const unread = data.filter(n => !n.read).length
  useEffect(() => {
    onChange(unread)
  }, [unread, onChange])
  return null
}

export function LiveNotificationsPanel({ onClose }: { onClose: () => void }) {
  const { data: notifs, update } = useNotifications()
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
            <button onClick={() => notifs.filter(n => !n.read).forEach(n => update(n.id, { read: true }))}
              className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium">Tout marquer lu</button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><X size={15} className="text-gray-400" /></button>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
          {notifs.map(n => {
            const { Icon, color } = moduleIcon[n.module ?? ''] ?? { Icon: Bell, color: 'text-gray-500 bg-gray-100' }
            return (
              <button key={n.id} onClick={() => update(n.id, { read: true })}
                className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${n.read ? 'opacity-60' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${color}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-gray-900 leading-snug">{n.title}</p>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-1" />}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{n.body}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-gray-400">{timeAgo(n.created_at)}</span>
                    {n.module && (
                      <>
                        <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
                        <span className="text-[10px] text-gray-400">{n.module}</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
          {notifs.length === 0 && (
            <div className="text-center py-10 text-xs text-gray-400">Aucune notification pour l'instant.</div>
          )}
        </div>
      </div>
    </div>
  )
}
