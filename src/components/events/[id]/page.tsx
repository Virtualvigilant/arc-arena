import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StakePanel from '@/components/events/StakePanel'
import { ArcEvent } from '@/types'

const ARC = '◈'

export default async function EventPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select(`*, multipliers:event_multipliers(*), stakes(*)`)
    .eq('id', id)
    .single()

  if (!event) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('arc_balance')
    .eq('id', user!.id)
    .single()

  const userStake = event.stakes?.find((s: any) => s.user_id === user!.id)

  const sortedMults = [...(event.multipliers ?? [])]
    .sort((a: any, b: any) => a.position_rank - b.position_rank)

  return (
    <div className="max-w-3xl mx-auto">

      {/* Back */}
      <a href="/markets" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-6 transition-colors">
        ← All events
      </a>

      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider bg-gray-50 border border-gray-100 px-2 py-1 rounded-md">
            {event.domain}
          </span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
            event.status === 'live' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}>
            {event.status === 'live' && <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1 mb-0.5" />}
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </span>
        </div>

        <h1 className="font-bold text-2xl text-gray-900 tracking-tight mb-3">
          {event.title}
        </h1>

        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          {event.description}
        </p>

        {/* Pool stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total pool', value: `${ARC} ${event.total_pool.toLocaleString()}`, accent: true },
            { label: 'Prize pool', value: `${ARC} ${event.prize_pool.toLocaleString()}`, accent: false },
            { label: 'Rake', value: `${event.rake_percent}%`, accent: false },
            { label: 'Competitors', value: `${event.stakes?.length ?? 0} / ${event.max_competitors}`, accent: false },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{s.label}</div>
              <div className={`font-mono text-sm font-medium ${s.accent ? 'text-arc-gold' : 'text-gray-900'}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multipliers */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
        <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-4">
          Payout tiers
        </h2>
        <div className="space-y-2">
          {sortedMults.map((m: any) => (
            <div
              key={m.id}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                m.tier_type === 'winner'
                  ? 'bg-amber-50 border-amber-100'
                  : m.tier_type === 'gray'
                    ? 'bg-gray-50 border-gray-100'
                    : 'bg-red-50 border-red-50'
              }`}
            >
              <span className={`text-sm font-medium ${
                m.tier_type === 'winner' ? 'text-amber-800' : 'text-gray-500'
              }`}>
                {m.position_label}
              </span>
              <span className={`font-mono text-sm font-medium ${
                m.tier_type === 'winner'
                  ? 'text-amber-700'
                  : m.tier_type === 'gray'
                    ? 'text-gray-500'
                    : 'text-red-400'
              }`}>
                {m.multiplier > 0 ? `${m.multiplier}× stake` : 'Full loss'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Judging */}
      {event.judging_criteria && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
          <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-3">
            Judging criteria
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {event.judging_criteria}
          </p>
        </div>
      )}

      {/* Stake panel */}
      {userStake ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <div className="text-green-700 font-bold text-lg mb-1">
            {ARC} {userStake.amount.toLocaleString()} Arc staked
          </div>
          <div className="text-green-600 text-sm">
            You are competing — good luck. Results will be announced after judging.
          </div>
        </div>
      ) : (
        <StakePanel
          event={event as ArcEvent}
          arcBalance={profile?.arc_balance ?? 0}
          multipliers={sortedMults}
        />
      )}

    </div>
  )
}
