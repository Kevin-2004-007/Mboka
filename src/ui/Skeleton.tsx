export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-100 ${className}`} />
}

// A table body full of shimmering placeholder rows, matching the column
// count of the real table so the layout doesn't jump once data arrives.
export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-gray-50 last:border-0">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-4 py-3">
              <Skeleton className={`h-3 ${c === 0 ? 'w-20' : 'w-full max-w-[140px]'}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// Placeholder for card-list layouts (CRM columns, project cards, automations).
export function CardSkeleton({ className = 'h-20' }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-gray-100 bg-white p-4 ${className}`}>
      <Skeleton className="h-3 w-2/3 mb-2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  )
}
