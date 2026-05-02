import Link from 'next/link'
import { ArcEvent } from '@/types'

const ARC = '◈'

const STATUS_STYLES = {
  live: 'bg-green-500/10 text-green-400 border-green-500/20',
  upcoming: 'bg-stovest-blue-dim text-stovest-blue-light border-stovest-blue/20',
  judging: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  completed: 'bg-[#1E2232] text-gray-500 border-gray-700',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export default function EventCard({ event }: { event: ArcEvent }) {
  const fillPercent = event.max_competitors > 0
    ? Math.round(((event as any).stakes?.[0]?.count ?? 0) / event.max_competitors * 100)
    : 0

  const topMults = (event.multipliers ?? [])
    .sort((a, b) => a.position_rank - b.position_rank)
    .slice(0, 3)

  return (
    <Link href={`/events/${event.id}`}>
      <div className="bg-[#0A0D14] border border-stovest-border rounded-2xl p-5 hover:border-stovest-blue/50 hover:bg-[#0D101A] transition-all cursor-pointer group h-full flex flex-col relative overflow-hidden">

        {/* Top row */}
        <div className="flex items-start justify-between mb-3 relative z-10">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider bg-[#1E2232] border border-gray-700 px-2 py-1 rounded-md">
            {event.domain}
          </span>
          <span className={`text-[10px] font-medium px-2 py-1 rounded bg-[#10131C] border ${STATUS_STYLES[event.status] ?? STATUS_STYLES.upcoming}`}>
            {event.status === 'live' && <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 mb-0.5 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />}
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-100 text-base leading-snug mb-2 tracking-tight group-hover:text-white transition-colors relative z-10">
          {event.title}
        </h3>

        {/* Description */}
        <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2 flex-1 relative z-10">
          {event.description}
        </p>

        {/* Pool */}
        <div className="flex items-baseline gap-2 mb-4 relative z-10">
          <span className="font-syne text-2xl font-bold text-white tracking-tight">
            <span className="text-stovest-blue">◈</span> {event.total_pool.toLocaleString()}
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Total Pool</span>
        </div>

        {/* Fill bar */}
        <div className="mb-4 relative z-10">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1.5 font-mono">
            <span>{(event as any).stakes?.[0]?.count ?? 0} / {event.max_competitors} seats</span>
            <span className={fillPercent === 100 ? 'text-green-500 font-bold' : ''}>{fillPercent}%</span>
          </div>
          <div className="h-1.5 bg-[#1E2232] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                fillPercent === 100 ? 'bg-green-500' : 'bg-stovest-blue shadow-[0_0_10px_rgba(29,78,216,0.8)]'
              }`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-stovest-border mb-4 relative z-10">
          <div className="text-center">
            <div className="font-syne text-xs font-bold text-gray-300">
              ◈ {event.prize_pool.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide">Prize pool</div>
          </div>
          <div className="text-center border-l border-stovest-border">
            <div className="font-mono text-xs font-medium text-gray-300">
              {event.rake_percent}%
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide">Rake</div>
          </div>
          <div className="text-center border-l border-stovest-border">
            <div className="font-mono text-xs font-medium text-gray-300">
              {event.competition_end
                ? new Date(event.competition_end).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })
                : 'TBD'}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide">Ends</div>
          </div>
        </div>

        {/* Multiplier badges */}
        <div className="flex gap-1.5 mb-4 relative z-10">
          {topMults.map((m, i) => (
            <span
              key={m.id}
              className={`font-mono text-[10px] px-2 py-1 rounded border ${
                i === 0
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : i === 1
                    ? 'bg-gray-800 text-gray-300 border-gray-700'
                    : 'bg-transparent text-gray-500 border-[#1E2232]'
              }`}
            >
              {m.position_label.split(' ')[0]} — {m.multiplier}×
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className={`w-full text-center py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors relative z-10 ${
          event.status === 'live'
            ? 'bg-stovest-blue text-white group-hover:bg-stovest-blue-light shadow-[0_4px_15px_-3px_rgba(29,78,216,0.4)]'
            : 'bg-[#1E2232] text-gray-500 cursor-not-allowed group-hover:bg-gray-800'
        }`}>
          {event.status === 'live' ? 'Stake Arc' : 'View Arena'}
        </div>

      </div>
    </Link>
  )
}