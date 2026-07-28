import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/react'
import { useEmployees } from '../data/employees'
import { usePendingEmployeeInfo } from '../data/pendingEmployeeInfo'

// Headless: every org member is necessarily an employee, so instead of
// making an admin re-enter the same person by hand in Ressources Humaines
// after inviting them, this auto-creates their employee record the first
// time they land in the app post-join — pre-filled from the Poste/
// Département the admin set on the invite modal (LiveSettings.tsx), if any.
export function EmployeeSync() {
  const { user } = useUser()
  const { data: employees, loading, insert: insertEmployee } = useEmployees()
  const { data: pendingInfo, remove: removePendingInfo } = usePendingEmployeeInfo()
  const ranRef = useRef(false)

  useEffect(() => {
    if (loading || !user || ranRef.current) return
    if (employees.some(e => e.user_id === user.id)) return
    ranRef.current = true

    async function run() {
      const email = user!.primaryEmailAddress?.emailAddress?.toLowerCase()
      const match = email ? pendingInfo.find(p => p.email === email) : undefined
      const created = await insertEmployee({
        name: user!.fullName || email || 'Membre',
        role: match?.role ?? '',
        dept: match?.dept ?? '',
        contract: '',
        status: 'Actif',
        hire_date: new Date().toISOString().slice(0, 10),
        user_id: user!.id,
      })
      if (created && match) {
        await removePendingInfo(match.id)
      }
    }
    run()
  }, [loading, user, employees, pendingInfo, insertEmployee, removePendingInfo])

  return null
}
