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
    .select(`
      *,
      multipliers:event_multipliers(*),
      stakes(*),
      outcomes:event_outcomes!event_outcomes_event_id_fkey(*),
      sub_markets:event_sub_markets(*, outcomes:event_outcomes!event_outcomes_event_id_fkey(*))
    `)
    .eq('id', id)
    .single()

  if (!event) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('arc_balance')
    .eq('id', user!.id)
    .single()

  // Flatten sub_market outcomes
  const subMarketOutcomes = (event.sub_markets ?? []).flatMap((sm: any) => sm.outcomes ?? [])
  const allOutcomes = [...(event.outcomes ?? []), ...subMarketOutcomes]
  const typedEvent = { ...event, outcomes: allOutcomes } as ArcEvent

  const userStake = typedEvent.stakes?.find((s: any) => s.user_id === user!.id)

  const sortedMults = [...(typedEvent.multipliers ?? [])]
    .sort((a: any, b: any) => a.position_rank - b.position_rank)

  return (
    <div className="max-w-3xl mx-auto">

      {/* Back */}
      <a href="/markets" className="inline-flex items-center gap-1.5 text-pm-text-secondary hover:text-pm-text text-sm mb-6 transition-colors">
        ← All markets
      </a>

      {/* Header */}
      <div className="bg-pm-card border border-pm-border rounded-xl p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <span className="text-[10px] text-pm-text-muted uppercase tracking-wider bg-pm-surface border border-pm-border px-2 py-1 rounded">
            {event.domain}
          </span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
            event.status === 'live' ? 'bg-pm-green-soft text-pm-green border-pm-green/30' : 'bg-pm-surface text-pm-text-muted border-pm-border'
          }`}>
            {event.status === 'live' && <span className="inline-block w-1.5 h-1.5 bg-pm-green rounded-full mr-1 mb-0.5 live-pulse" />}
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </span>
        </div>

        <h1 className="font-bold text-2xl text-pm-text tracking-tight mb-3">
          {event.title}
        </h1>

        <p className="text-pm-text-secondary text-sm leading-relaxed mb-6">
          {event.description}
        </p>

        {/* Pool stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total pool', value: `${ARC} ${event.total_pool.toLocaleString()}`, accent: true },
            { label: 'Prize pool', value: `${ARC} ${event.prize_pool.toLocaleString()}`, accent: false },
            { label: 'Rake', value: `${event.rake_percent}%`, accent: false },
            { label: 'Participants', value: `${event.stakes?.length ?? 0} / ${event.max_competitors}`, accent: false },
          ].map(s => (
            <div key={s.label} className="bg-pm-surface rounded-xl p-3">
              <div className="text-[10px] text-pm-text-muted uppercase tracking-wider mb-1">{s.label}</div>
              <div className={`font-mono text-sm font-medium ${s.accent ? 'text-pm-blue' : 'text-pm-text'}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multipliers */}
      {sortedMults.length > 0 && (
        <div className="bg-pm-card border border-pm-border rounded-xl p-6 mb-4">
          <h2 className="text-xs text-pm-text-secondary uppercase tracking-wider mb-4 font-medium">
            Payout tiers
          </h2>
          <div className="space-y-2">
            {sortedMults.map((m: any) => (
              <div
                key={m.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  m.tier_type === 'winner'
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : m.tier_type === 'gray'
                      ? 'bg-pm-surface border-pm-border'
                      : 'bg-pm-red-soft border-pm-red/20'
                }`}
              >
                <span className={`text-sm font-medium ${
                  m.tier_type === 'winner' ? 'text-amber-400' : 'text-pm-text-secondary'
                }`}>
                  {m.position_label}
                </span>
                <span className={`font-mono text-sm font-medium ${
                  m.tier_type === 'winner'
                    ? 'text-amber-400'
                    : m.tier_type === 'gray'
                      ? 'text-pm-text-muted'
                      : 'text-pm-red'
                }`}>
                  {m.multiplier > 0 ? `${m.multiplier}× stake` : 'Full loss'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Judging */}
      {event.judging_criteria && (
        <div className="bg-pm-card border border-pm-border rounded-xl p-6 mb-4">
          <h2 className="text-xs text-pm-text-secondary uppercase tracking-wider mb-3 font-medium">
            Resolution criteria
          </h2>
          <p className="text-sm text-pm-text-secondary leading-relaxed">
            {event.judging_criteria}
          </p>
        </div>
      )}

      {/* Stake panel */}
      {userStake ? (
        <div className="bg-pm-green-soft border border-pm-green/30 rounded-xl p-6 text-center">
          <div className="text-pm-green font-bold text-lg mb-1">
            {ARC} {userStake.amount.toLocaleString()} Arc staked
          </div>
          <div className="text-pm-green/70 text-sm">
            You are competing — good luck. Results will be announced after judging.
          </div>
        </div>
      ) : (
        <StakePanel
          event={typedEvent as ArcEvent}
          arcBalance={profile?.arc_balance ?? 0}
          multipliers={sortedMults}
        />
      )}

    </div>
  )
}
