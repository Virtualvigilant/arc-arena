import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const ARC = '◈'

const STATUS_STYLES: Record<string, string> = {
  live: 'text-green-400 bg-green-950 border-green-800',
  upcoming: 'text-blue-400 bg-blue-950 border-blue-800',
  judging: 'text-amber-400 bg-amber-950 border-amber-800',
  completed: 'text-gray-500 bg-gray-800 border-gray-700',
  cancelled: 'text-red-400 bg-red-950 border-red-800',
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
          <h1 className="text-xl font-bold tracking-tight">Events</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {events?.length ?? 0} total events
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors"
        >
          + New event
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              {['Event', 'Status', 'Domain', 'Pool', 'Prize pool', 'Rake', 'Competitors', ''].map(h => (
                <th
                  key={h}
                  className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-4 py-3"
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
                className="border-b border-gray-800 last:border-0 hover:bg-gray-800 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-white max-w-[200px] truncate">
                    {event.title}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                    {event.id.slice(0, 8)}...
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-medium px-2 py-1 rounded border ${STATUS_STYLES[event.status]}`}>
                    {event.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {event.domain}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-amber-400">
                  {ARC} {event.total_pool.toLocaleString()}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-white">
                  {ARC} {event.prize_pool.toLocaleString()}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-green-400">
                  {ARC} {event.rake_collected.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {(event.stakes as any)?.[0]?.count ?? 0} / {event.max_competitors}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!events || events.length === 0) && (
          <div className="text-center py-16 text-gray-600">
            <div className="font-mono text-3xl mb-3">◈</div>
            <div className="text-sm">No events yet — create your first one</div>
          </div>
        )}
      </div>
    </div>
  )
}