import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const ARC = '◈'

const STATUS_STYLES: Record<string, string> = {
  live: 'text-pm-green bg-pm-green-soft border-pm-green/30',
  upcoming: 'text-pm-blue bg-pm-blue-soft border-pm-blue/30',
  judging: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  completed: 'text-pm-text-muted bg-pm-surface border-pm-border',
  cancelled: 'text-pm-red bg-pm-red-soft border-pm-red/30',
}

export const revalidate = 0

export default async function AdminEventsPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*, stakes(count)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-pm-text">Markets</h1>
          <p className="text-pm-text-secondary text-sm mt-0.5">
            {events?.length ?? 0} total markets
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="bg-pm-blue text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-pm-blue/90 transition-colors shadow-lg shadow-pm-blue/20"
        >
          + New market
        </Link>
      </div>

      <div className="bg-pm-card border border-pm-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-pm-border">
              {['Market', 'Status', 'Category', 'Pool', 'Prize pool', 'Rake', 'Participants', ''].map(h => (
                <th
                  key={h}
                  className="text-left text-[10px] text-pm-text-muted uppercase tracking-wider px-4 py-3 font-medium"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events?.map(event => (
              <tr
                key={event.id}
                className="border-b border-pm-border last:border-0 hover:bg-pm-surface transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-pm-text max-w-[200px] truncate">
                    {event.title}
                  </div>
                  <div className="text-[10px] text-pm-text-muted font-mono mt-0.5">
                    {event.id.slice(0, 8)}...
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-medium px-2 py-1 rounded border ${STATUS_STYLES[event.status]}`}>
                    {event.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-pm-text-secondary">
                  {event.domain}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-pm-blue">
                  {ARC} {event.total_pool.toLocaleString()}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-pm-text">
                  {ARC} {event.prize_pool.toLocaleString()}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-pm-green">
                  {ARC} {event.rake_collected.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs text-pm-text-secondary">
                  {(event.stakes as any)?.[0]?.count ?? 0} / {event.max_competitors}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="text-xs text-pm-text-muted hover:text-pm-text transition-colors"
                  >
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!events || events.length === 0) && (
          <div className="text-center py-16 text-pm-text-muted">
            <div className="font-mono text-3xl mb-3 text-pm-blue opacity-30">◈</div>
            <div className="text-sm">No markets yet — create your first one</div>
          </div>
        )}
      </div>
    </div>
  )
}