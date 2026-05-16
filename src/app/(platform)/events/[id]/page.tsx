import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StakePanel from '@/components/events/StakePanel'
import type { ArcEvent, EventMultiplier, EventOutcome, Stake } from '@/types'

const ARC = '◈'

export const revalidate = 0

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: event, error } = await supabase
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

  if (error || !event) {
    console.error('Event fetch error:', { id, error })
    notFound()
  }

  // Flatten sub_market outcomes
  const subMarketOutcomes = (event.sub_markets ?? []).flatMap((sm: any) => sm.outcomes ?? [])
  const allOutcomes = [...(event.outcomes ?? []), ...subMarketOutcomes]
  const typedEvent = { ...event, outcomes: allOutcomes } as ArcEvent

  const { data: profile } = await supabase
    .from('profiles')
    .select('arc_balance')
    .eq('id', user!.id)
    .single()

  const userStake = typedEvent.stakes?.find((stake: Stake) => stake.user_id === user!.id)

  const sortedMults = [...(typedEvent.multipliers ?? [])].sort(
    (a: EventMultiplier, b: EventMultiplier) => a.position_rank - b.position_rank
  )

  const directOutcomes = (typedEvent.outcomes ?? []).filter((o: EventOutcome) => !o.sub_market_id)
  const hasOutcomes = directOutcomes.length > 0 || (event.sub_markets ?? []).length > 0

  const statusStyles: Record<string, string> = {
    live: 'bg-pm-green-soft text-pm-green border-pm-green/30',
    upcoming: 'bg-pm-blue-soft text-pm-blue border-pm-blue/30',
    judging: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    completed: 'bg-pm-surface text-pm-text-muted border-pm-border',
    cancelled: 'bg-pm-red-soft text-pm-red border-pm-red/30',
  }

  // Compute outcome probabilities
  function getOutcomeProb(outcomeId: string): number {
    const stakes = typedEvent.stakes ?? []
    const total = stakes.reduce((sum, s) => sum + s.amount, 0)
    if (total === 0) return 50
    const outcomeTotal = stakes
      .filter(s => s.outcome_id === outcomeId)
      .reduce((sum, s) => sum + s.amount, 0)
    return Math.round((outcomeTotal / total) * 100)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-pm-text-secondary hover:text-pm-text text-sm mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        All markets
      </Link>

      {/* Header card */}
      <div className="bg-pm-card border border-pm-border rounded-xl p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <span className="text-[10px] text-pm-text-muted uppercase tracking-wider bg-pm-surface border border-pm-border px-2 py-1 rounded">
            {typedEvent.domain}
          </span>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
              statusStyles[typedEvent.status] ?? statusStyles.upcoming
            }`}
          >
            {typedEvent.status === 'live' && (
              <span className="inline-block w-1.5 h-1.5 bg-pm-green rounded-full mr-1.5 mb-0.5 live-pulse" />
            )}
            {typedEvent.status.charAt(0).toUpperCase() + typedEvent.status.slice(1)}
          </span>
        </div>

        <h1 className="font-bold text-2xl text-pm-text tracking-tight mb-3">
          {typedEvent.title}
        </h1>

        <p className="text-pm-text-secondary text-sm leading-relaxed mb-6">
          {typedEvent.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total pool', value: `${ARC} ${typedEvent.total_pool.toLocaleString()}`, accent: true },
            { label: 'Prize pool', value: `${ARC} ${typedEvent.prize_pool.toLocaleString()}`, accent: false },
            { label: 'Rake', value: `${typedEvent.rake_percent}%`, accent: false },
            {
              label: 'Participants',
              value: `${typedEvent.stakes?.length ?? 0} / ${typedEvent.max_competitors}`,
              accent: false,
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-pm-surface rounded-xl p-3">
              <div className="text-[10px] text-pm-text-muted uppercase tracking-wider mb-1">
                {stat.label}
              </div>
              <div
                className={`font-mono text-sm font-medium ${
                  stat.accent ? 'text-pm-blue' : 'text-pm-text'
                }`}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outcomes display */}
      {hasOutcomes && (
        <div className="bg-pm-card border border-pm-border rounded-xl p-6 mb-4">
          <h2 className="text-xs text-pm-text-secondary uppercase tracking-wider mb-4 font-medium">
            Outcomes
          </h2>
          
          {/* Direct outcomes */}
          {directOutcomes.length > 0 && (
            <div className="space-y-2 mb-4">
              {directOutcomes.map((outcome: EventOutcome) => {
                const prob = getOutcomeProb(outcome.id)
                const lower = outcome.label.toLowerCase()
                const isPositive = lower === 'yes' || lower === 'up' || lower === 'win' || lower === 'over'
                const isNegative = lower === 'no' || lower === 'down' || lower === 'lose' || lower === 'under'
                
                return (
                  <div key={outcome.id} className="flex items-center justify-between p-3 rounded-xl bg-pm-surface border border-pm-border">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${
                        isPositive ? 'text-pm-green' : isNegative ? 'text-pm-red' : 'text-pm-blue'
                      }`}>
                        {outcome.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-pm-bg rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isPositive ? 'bg-pm-green' : isNegative ? 'bg-pm-red' : 'bg-pm-blue'
                          }`}
                          style={{ width: `${prob}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold font-mono text-pm-text w-12 text-right">{prob}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Sub-market outcomes */}
          {(event.sub_markets ?? []).length > 0 && (
            <div className="space-y-2">
              {(event.sub_markets as any[]).map((sm: any) => {
                const smOutcomes = sm.outcomes ?? []
                const mainProb = smOutcomes.length > 0 ? getOutcomeProb(smOutcomes[0]?.id) : 50
                
                return (
                  <div key={sm.id} className="flex items-center justify-between p-3 rounded-xl bg-pm-surface border border-pm-border">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-sm text-pm-text">{sm.label}</span>
                      <span className="text-sm font-bold font-mono text-pm-text">{mainProb}%</span>
                    </div>
                    <div className="flex gap-1.5">
                      {smOutcomes.map((o: any) => {
                        const lower = o.label.toLowerCase()
                        const btnClass = (lower === 'yes' || lower === 'up' || lower === 'win')
                          ? 'outcome-btn outcome-btn-yes'
                          : (lower === 'no' || lower === 'down' || lower === 'lose')
                            ? 'outcome-btn outcome-btn-no'
                            : 'outcome-btn outcome-btn-neutral'
                        return (
                          <span key={o.id} className={`${btnClass} text-xs`}>
                            {o.label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Payout tiers (competition mode) */}
      {sortedMults.length > 0 && (
        <div className="bg-pm-card border border-pm-border rounded-xl p-6 mb-4">
          <h2 className="text-xs text-pm-text-secondary uppercase tracking-wider mb-4 font-medium">
            Payout tiers
          </h2>
          <div className="space-y-2">
            {sortedMults.map((multiplier: EventMultiplier) => (
              <div
                key={multiplier.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  multiplier.tier_type === 'winner'
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : multiplier.tier_type === 'gray'
                      ? 'bg-pm-surface border-pm-border'
                      : 'bg-pm-red-soft border-pm-red/20'
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    multiplier.tier_type === 'winner' ? 'text-amber-400' : 'text-pm-text-secondary'
                  }`}
                >
                  {multiplier.position_label}
                </span>
                <span
                  className={`font-mono text-sm font-medium ${
                    multiplier.tier_type === 'winner'
                      ? 'text-amber-400'
                      : multiplier.tier_type === 'gray'
                        ? 'text-pm-text-muted'
                        : 'text-pm-red'
                  }`}
                >
                  {multiplier.multiplier > 0
                    ? `${multiplier.multiplier}× stake`
                    : 'Full loss'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {typedEvent.judging_criteria && (
        <div className="bg-pm-card border border-pm-border rounded-xl p-6 mb-4">
          <h2 className="text-xs text-pm-text-secondary uppercase tracking-wider mb-3 font-medium">
            {hasOutcomes ? 'Resolution criteria' : 'Judging criteria'}
          </h2>
          <p className="text-sm text-pm-text-secondary leading-relaxed">
            {typedEvent.judging_criteria}
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-pm-card border border-pm-border rounded-xl p-6 mb-4">
        <h2 className="text-xs text-pm-text-secondary uppercase tracking-wider mb-4 font-medium">
          Timeline
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Registration closes', value: typedEvent.registration_end },
            { label: 'Market opens', value: typedEvent.competition_start },
            { label: 'Market closes', value: typedEvent.competition_end },
          ].map((timelineItem) => (
            <div key={timelineItem.label} className="bg-pm-surface rounded-xl p-3">
              <div className="text-[10px] text-pm-text-muted uppercase tracking-wider mb-1">
                {timelineItem.label}
              </div>
              <div className="font-mono text-xs text-pm-text">
                {timelineItem.value
                  ? new Date(timelineItem.value).toLocaleDateString('en-KE', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'TBD'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stake panel */}
      {userStake ? (
        <div className="bg-pm-green-soft border border-pm-green/30 rounded-xl p-6 text-center">
          <div className="text-pm-green font-bold text-lg mb-1">
            {ARC} {userStake.amount.toLocaleString()} Arc staked
          </div>
          <div className="text-pm-green/70 text-sm">
            {hasOutcomes
              ? 'Your position is locked. Results will be announced when the market resolves.'
              : 'You are in the competition. Results announced after judging closes.'}
          </div>
        </div>
      ) : (
        <StakePanel
          event={typedEvent}
          arcBalance={profile?.arc_balance ?? 0}
          multipliers={sortedMults}
        />
      )}
    </div>
  )
}
