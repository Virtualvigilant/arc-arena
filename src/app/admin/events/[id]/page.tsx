import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EventStatusControl from '@/components/admin/EventStatusControl'
import JudgingPanel from '@/components/admin/JudgingPanel'

const ARC = '◈'

export const revalidate = 0

export default async function AdminEventPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*, multipliers:event_multipliers(*), stakes(*, profiles(username, phone))')
    .eq('id', id)
    .single()

  if (!event) notFound()

  const sortedMults = [...(event.multipliers ?? [])]
    .sort((a: any, b: any) => a.position_rank - b.position_rank)

  const sortedStakes = [...(event.stakes ?? [])]
    .sort((a: any, b: any) => b.amount - a.amount)

  return (
    <div className="max-w-4xl">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <a href="/admin/events" className="text-gray-500 hover:text-white text-sm transition-colors">
            ← Events
          </a>
          <span className="text-gray-700">/</span>
          <span className="text-gray-300 text-sm truncate">{event.title}</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">{event.title}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{event.domain} · {event.id}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total pool', value: `${ARC} ${event.total_pool.toLocaleString()}`, accent: true },
          { label: 'Prize pool', value: `${ARC} ${event.prize_pool.toLocaleString()}`, accent: false },
          { label: 'Rake', value: `${ARC} ${event.rake_collected.toLocaleString()}`, green: true },
          { label: 'Competitors', value: `${sortedStakes.length} / ${event.max_competitors}`, accent: false },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">{s.label}</div>
            <div className={`font-mono text-lg font-medium ${
              s.accent ? 'text-amber-400' : (s as any).green ? 'text-green-400' : 'text-white'
            }`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">

        {/* Status control */}
        <EventStatusControl
          eventId={event.id}
          currentStatus={event.status}
        />

        {/* Payout tiers */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-4">
            Payout tiers
          </h2>
          <div className="space-y-2">
            {sortedMults.map((m: any) => (
              <div
                key={m.id}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-gray-400">{m.position_label}</span>
                <span className={`font-mono font-medium ${
                  m.tier_type === 'winner'
                    ? 'text-amber-400'
                    : m.tier_type === 'gray'
                      ? 'text-gray-500'
                      : 'text-red-500'
                }`}>
                  {m.multiplier > 0 ? `${m.multiplier}×` : '0× — loss'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Judging panel */}
      {(event.status === 'judging' || event.status === 'live') && (
        <JudgingPanel
          eventId={event.id}
          stakes={sortedStakes}
          multipliers={sortedMults}
          eventStatus={event.status}
        />
      )}

      {/* Competitors table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-xs text-gray-400 uppercase tracking-wider">
            Competitors — {sortedStakes.length} entered
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              {['Competitor', 'Band', 'Stake', 'Position', 'Payout', 'Status'].map(h => (
                <th
                  key={h}
                  className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedStakes.map((stake: any) => (
              <tr
                key={stake.id}
                className="border-b border-gray-800 last:border-0"
              >
                <td className="px-5 py-3">
                  <div className="text-sm font-medium text-white">
                    @{stake.profiles?.username ?? 'unknown'}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    {stake.profiles?.phone ?? '—'}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs text-gray-400 capitalize">{stake.band}</span>
                </td>
                <td className="px-5 py-3 font-mono text-sm text-amber-400">
                  {ARC} {stake.amount.toLocaleString()}
                </td>
                <td className="px-5 py-3 font-mono text-sm text-white">
                  {stake.finishing_position ? `#${stake.finishing_position}` : '—'}
                </td>
                <td className="px-5 py-3 font-mono text-sm text-green-400">
                  {stake.payout > 0 ? `${ARC} ${stake.payout.toLocaleString()}` : '—'}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] font-medium px-2 py-1 rounded border ${
                    stake.status === 'won'
                      ? 'text-green-400 bg-green-950 border-green-800'
                      : stake.status === 'gray'
                        ? 'text-amber-400 bg-amber-950 border-amber-800'
                        : stake.status === 'lost'
                          ? 'text-red-400 bg-red-950 border-red-800'
                          : 'text-gray-400 bg-gray-800 border-gray-700'
                  }`}>
                    {stake.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedStakes.length === 0 && (
          <div className="text-center py-12 text-gray-600 text-sm">
            No competitors yet
          </div>
        )}
      </div>

    </div>
  )
}
