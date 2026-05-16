'use client'

import Link from 'next/link'
import { ArcEvent, EventOutcome, EventSubMarket } from '@/types'

function getOutcomeButtonClass(label: string, index: number): string {
  const lower = label.toLowerCase()
  if (lower === 'yes' || lower === 'up' || lower === 'win' || lower === 'over') {
    return 'outcome-btn outcome-btn-yes'
  }
  if (lower === 'no' || lower === 'down' || lower === 'lose' || lower === 'under') {
    return 'outcome-btn outcome-btn-no'
  }
  // For neutral outcomes like "Draw"
  return 'outcome-btn outcome-btn-neutral'
}

function computeProbability(event: ArcEvent, outcomeId?: string): number {
  if (!event.stakes || event.stakes.length === 0) return 50
  if (!outcomeId) return 50
  
  const total = event.stakes.reduce((sum, s) => sum + s.amount, 0)
  if (total === 0) return 50
  
  const outcomeTotal = event.stakes
    .filter(s => s.outcome_id === outcomeId)
    .reduce((sum, s) => sum + s.amount, 0)
  
  return Math.round((outcomeTotal / total) * 100)
}

function formatVolume(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`
  return amount.toLocaleString()
}

// Polymarket-style compact card with sub-market rows
function SubMarketCard({ event }: { event: ArcEvent }) {
  const subMarkets = event.sub_markets ?? []
  const topSubMarkets = subMarkets
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 3)

  return (
    <Link href={`/events/${event.id}`} className="block">
      <div className="pm-card rounded-xl p-4 h-full flex flex-col cursor-pointer group">
        {/* Title */}
        <h3 className="text-sm font-semibold text-pm-text leading-snug mb-3 group-hover:text-white transition-colors line-clamp-2">
          {event.title}
        </h3>

        {/* Sub-market rows */}
        <div className="flex-1 space-y-2 mb-3">
          {topSubMarkets.map((sub, idx) => {
            const subOutcomes = (event.outcomes ?? []).filter(o => o.sub_market_id === sub.id)
            const probability = computeProbability(event, subOutcomes[0]?.id)
            
            return (
              <div key={sub.id} className="flex items-center justify-between gap-2" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs text-pm-text-secondary truncate">{sub.label}</span>
                  <span className="text-xs font-semibold text-pm-text font-mono">{probability}%</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  {subOutcomes.slice(0, 2).map((outcome) => (
                    <button
                      key={outcome.id}
                      className={`${getOutcomeButtonClass(outcome.label, 0)} text-[11px] !px-2.5 !py-1`}
                      onClick={(e) => e.preventDefault()}
                    >
                      {outcome.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-pm-border">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-pm-text-muted font-mono">
              ◈{formatVolume(event.total_pool)} Vol.
            </span>
          </div>
          {event.status === 'live' && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-pm-green rounded-full live-pulse" />
              <span className="text-[10px] text-pm-green font-medium uppercase tracking-wider">Live</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// Polymarket-style card with direct outcome buttons
function DirectOutcomeCard({ event }: { event: ArcEvent }) {
  const outcomes = (event.outcomes ?? [])
    .filter(o => !o.sub_market_id)
    .sort((a, b) => a.sort_order - b.sort_order)

  // Compute main probability (for the first "positive" outcome)
  const mainProb = outcomes.length > 0 ? computeProbability(event, outcomes[0]?.id) : null

  return (
    <Link href={`/events/${event.id}`} className="block">
      <div className="pm-card rounded-xl p-4 h-full flex flex-col cursor-pointer group">
        {/* Header with optional probability */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-pm-text leading-snug group-hover:text-white transition-colors line-clamp-2 flex-1">
            {event.title}
          </h3>
          {mainProb !== null && (
            <div className="text-right shrink-0">
              <div className="text-xl font-bold text-pm-text font-mono leading-none">{mainProb}%</div>
              <div className="text-[10px] text-pm-text-muted mt-0.5">chance</div>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-pm-text-secondary leading-relaxed mb-4 line-clamp-2 flex-1">
          {event.description}
        </p>

        {/* Outcome buttons */}
        {outcomes.length > 0 && (
          <div className={`grid gap-2 mb-3 ${
            outcomes.length === 2 ? 'grid-cols-2' :
            outcomes.length === 3 ? 'grid-cols-3' :
            'grid-cols-2'
          }`}>
            {outcomes.map((outcome, i) => (
              <button
                key={outcome.id}
                className={`${getOutcomeButtonClass(outcome.label, i)} text-center`}
                onClick={(e) => e.preventDefault()}
              >
                {outcome.label}
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-pm-border">
          <span className="text-[11px] text-pm-text-muted font-mono">
            ◈{formatVolume(event.total_pool)} Vol.
          </span>
          <div className="flex items-center gap-2">
            {event.status === 'live' && (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-pm-green rounded-full live-pulse" />
                <span className="text-[10px] text-pm-green font-medium uppercase tracking-wider">Live</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// Fallback card for events without outcomes (legacy competition events)
function CompetitionCard({ event }: { event: ArcEvent }) {
  const fillPercent = event.max_competitors > 0
    ? Math.round(((event as any).stakes?.[0]?.count ?? 0) / event.max_competitors * 100)
    : 0

  const topMults = (event.multipliers ?? [])
    .sort((a, b) => a.position_rank - b.position_rank)
    .slice(0, 3)

  return (
    <Link href={`/events/${event.id}`} className="block">
      <div className="pm-card rounded-xl p-4 h-full flex flex-col cursor-pointer group">
        {/* Top row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-pm-text-muted uppercase tracking-wider bg-pm-surface border border-pm-border px-2 py-0.5 rounded">
            {event.domain}
          </span>
          {event.status === 'live' && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-pm-green rounded-full live-pulse" />
              <span className="text-[10px] text-pm-green font-medium">Live</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-pm-text leading-snug mb-2 group-hover:text-white transition-colors line-clamp-2">
          {event.title}
        </h3>

        <p className="text-xs text-pm-text-secondary leading-relaxed mb-3 line-clamp-2 flex-1">
          {event.description}
        </p>

        {/* Pool */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-bold text-pm-text font-mono">
            <span className="text-pm-blue">◈</span> {event.total_pool.toLocaleString()}
          </span>
          <span className="text-[10px] text-pm-text-muted uppercase tracking-wider">Pool</span>
        </div>

        {/* Multiplier badges */}
        <div className="flex gap-1 mb-3">
          {topMults.map((m, i) => (
            <span
              key={m.id}
              className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                i === 0
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-pm-surface text-pm-text-secondary border-pm-border'
              }`}
            >
              {m.position_label.split(' ')[0]} — {m.multiplier}×
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className={`w-full text-center py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
          event.status === 'live'
            ? 'bg-pm-blue text-white hover:bg-pm-blue/80'
            : 'bg-pm-surface text-pm-text-muted'
        }`}>
          {event.status === 'live' ? 'Stake Arc' : 'View'}
        </div>
      </div>
    </Link>
  )
}

export default function EventCard({ event }: { event: ArcEvent }) {
  const hasSubMarkets = (event.sub_markets ?? []).length > 0
  const hasOutcomes = (event.outcomes ?? []).filter(o => !o.sub_market_id).length > 0

  if (hasSubMarkets) {
    return <SubMarketCard event={event} />
  }
  
  if (hasOutcomes) {
    return <DirectOutcomeCard event={event} />
  }
  
  return <CompetitionCard event={event} />
}