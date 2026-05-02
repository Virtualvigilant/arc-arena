import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StakePanel from '@/components/events/StakePanel'
import type { ArcEvent, EventMultiplier, Stake } from '@/types'

const ARC = 'ARC'

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
      stakes(*)
    `)
    .eq('id', id)
    .single()

  if (error || !event) {
    console.error('Event fetch error:', { id, error })
    notFound()
  }

  const typedEvent = event as ArcEvent

  const { data: profile } = await supabase
    .from('profiles')
    .select('arc_balance')
    .eq('id', user!.id)
    .single()

  const userStake = typedEvent.stakes?.find((stake: Stake) => stake.user_id === user!.id)

  const sortedMults = [...(typedEvent.multipliers ?? [])].sort(
    (a: EventMultiplier, b: EventMultiplier) => a.position_rank - b.position_rank
  )

  const statusStyles: Record<string, string> = {
    live: 'bg-green-50 text-green-700 border-green-200',
    upcoming: 'bg-blue-50 text-blue-600 border-blue-200',
    judging: 'bg-amber-50 text-amber-700 border-amber-200',
    completed: 'bg-gray-100 text-gray-500 border-gray-200',
    cancelled: 'bg-red-50 text-red-600 border-red-200',
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/markets"
        className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-6 transition-colors"
      >
        {'<-'} All events
      </Link>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider bg-gray-50 border border-gray-100 px-2 py-1 rounded-md">
            {typedEvent.domain}
          </span>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
              statusStyles[typedEvent.status] ?? statusStyles.upcoming
            }`}
          >
            {typedEvent.status === 'live' && (
              <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 mb-0.5" />
            )}
            {typedEvent.status.charAt(0).toUpperCase() + typedEvent.status.slice(1)}
          </span>
        </div>

        <h1 className="font-bold text-2xl text-gray-900 tracking-tight mb-3">
          {typedEvent.title}
        </h1>

        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          {typedEvent.description}
        </p>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total pool', value: `${ARC} ${typedEvent.total_pool.toLocaleString()}`, accent: true },
            { label: 'Prize pool', value: `${ARC} ${typedEvent.prize_pool.toLocaleString()}`, accent: false },
            { label: 'Rake', value: `${typedEvent.rake_percent}%`, accent: false },
            {
              label: 'Competitors',
              value: `${typedEvent.stakes?.length ?? 0} / ${typedEvent.max_competitors}`,
              accent: false,
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-50 rounded-xl p-3">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                {stat.label}
              </div>
              <div
                className={`font-mono text-sm font-medium ${
                  stat.accent ? 'text-arc-gold' : 'text-gray-900'
                }`}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
        <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-4">
          Payout tiers
        </h2>
        <div className="space-y-2">
          {sortedMults.map((multiplier: EventMultiplier) => (
            <div
              key={multiplier.id}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                multiplier.tier_type === 'winner'
                  ? 'bg-amber-50 border-amber-100'
                  : multiplier.tier_type === 'gray'
                    ? 'bg-gray-50 border-gray-100'
                    : 'bg-red-50 border-red-50'
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  multiplier.tier_type === 'winner' ? 'text-amber-800' : 'text-gray-500'
                }`}
              >
                {multiplier.position_label}
              </span>
              <span
                className={`font-mono text-sm font-medium ${
                  multiplier.tier_type === 'winner'
                    ? 'text-amber-700'
                    : multiplier.tier_type === 'gray'
                      ? 'text-gray-500'
                      : 'text-red-400'
                }`}
              >
                {multiplier.multiplier > 0
                  ? `${multiplier.multiplier}x stake`
                  : 'Full loss'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {typedEvent.judging_criteria && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
          <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-3">
            Judging criteria
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {typedEvent.judging_criteria}
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
        <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-4">
          Timeline
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Registration closes', value: typedEvent.registration_end },
            { label: 'Competition starts', value: typedEvent.competition_start },
            { label: 'Competition ends', value: typedEvent.competition_end },
          ].map((timelineItem) => (
            <div key={timelineItem.label} className="bg-gray-50 rounded-xl p-3">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                {timelineItem.label}
              </div>
              <div className="font-mono text-xs text-gray-700">
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

      {userStake ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <div className="text-green-700 font-bold text-lg mb-1">
            {ARC} {userStake.amount.toLocaleString()} Arc staked
          </div>
          <div className="text-green-600 text-sm">
            You are in the competition. Results announced after judging closes.
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
