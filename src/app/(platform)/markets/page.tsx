import { createClient } from '@/lib/supabase/server'
import EventGrid from '@/components/events/EventGrid'
import { ArcEvent } from '@/types'

export const revalidate = 0

export default async function MarketsPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      multipliers:event_multipliers(*),
      stakes(count)
    `)
    .in('status', ['upcoming', 'live', 'judging'])
    .order('created_at', { ascending: false })

  const { data: stats } = await supabase
    .from('events')
    .select('total_pool, rake_collected, status')
    .in('status', ['live', 'completed'])

  const totalPool = stats?.reduce((a, b) => a + (b.total_pool || 0), 0) ?? 0
  const totalRake = stats?.reduce((a, b) => a + (b.rake_collected || 0), 0) ?? 0
  const liveCount = stats?.filter(e => e.status === 'live').length ?? 0

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total pool', value: `◈ ${totalPool.toLocaleString()}`, accent: true },
          { label: 'Rake collected', value: `◈ ${totalRake.toLocaleString()}`, accent: false },
          { label: 'Live events', value: liveCount.toString(), accent: false },
          { label: 'Arc rate', value: '1 KES = 1 Arc', accent: false },
        ].map(stat => (
          <div
            key={stat.label}
            className="bg-white border border-gray-100 rounded-xl p-4"
          >
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
              {stat.label}
            </div>
            <div className={`font-mono text-lg font-medium ${stat.accent ? 'text-arc-gold' : 'text-gray-900'}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Events */}
      <EventGrid events={(events as ArcEvent[]) ?? []} />
    </div>
  )
}