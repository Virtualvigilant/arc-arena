import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const ARC = '◈'

export const revalidate = 0

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*, stakes(count)')
    .order('created_at', { ascending: false })

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: rakeData } = await supabase
    .from('rake_ledger')
    .select('arc_amount')

  const totalRake = rakeData?.reduce((a, b) => a + b.arc_amount, 0) ?? 0
  const totalPool = events?.reduce((a, b) => a + (b.total_pool ?? 0), 0) ?? 0
  const liveEvents = events?.filter(e => e.status === 'live').length ?? 0
  const totalCompetitors = events?.reduce(
    (a, b) => a + ((b.stakes as any)?.[0]?.count ?? 0), 0
  ) ?? 0

  const pendingWithdrawals = transactions?.filter(
    t => t.type === 'withdrawal' && t.status === 'pending'
  ).length ?? 0

  const stats = [
    { label: 'Total rake collected', value: `${ARC} ${totalRake.toLocaleString()}`, accent: true },
    { label: 'Total pool volume', value: `${ARC} ${totalPool.toLocaleString()}`, accent: false },
    { label: 'Live events', value: liveEvents.toString(), accent: false },
    { label: 'Total competitors', value: totalCompetitors.toString(), accent: false },
    { label: 'Pending withdrawals', value: pendingWithdrawals.toString(), warn: pendingWithdrawals > 0 },
    { label: 'Total events', value: (events?.length ?? 0).toString(), accent: false },
  ]

  const TX_LABELS: Record<string, string> = {
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    stake: 'Stake',
    payout: 'Payout',
    rake_fee: 'Rake'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-pm-text">Collector overview</h1>
          <p className="text-pm-text-secondary text-sm mt-0.5">
            Your arena at a glance
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="bg-pm-blue text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-pm-blue/90 transition-colors shadow-lg shadow-pm-blue/20"
        >
          + Create market
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map(s => (
          <div
            key={s.label}
            className={`rounded-xl p-4 border ${
              (s as any).warn
                ? 'bg-amber-500/5 border-amber-500/20'
                : 'bg-pm-card border-pm-border'
            }`}
          >
            <div className="text-[10px] text-pm-text-muted uppercase tracking-wider mb-2 font-medium">
              {s.label}
            </div>
            <div className={`font-mono text-2xl font-medium ${
              s.accent
                ? 'text-pm-blue'
                : (s as any).warn
                  ? 'text-amber-400'
                  : 'text-pm-text'
            }`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">

        {/* Recent events */}
        <div className="bg-pm-card border border-pm-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs text-pm-text-secondary uppercase tracking-wider font-medium">
              Recent events
            </h2>
            <Link
              href="/admin/events"
              className="text-xs text-pm-text-muted hover:text-pm-text transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {events?.slice(0, 6).map(event => (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-pm-surface hover:bg-pm-card-hover transition-colors group border border-transparent hover:border-pm-border"
              >
                <div>
                  <div className="text-sm font-medium text-pm-text truncate max-w-[180px]">
                    {event.title}
                  </div>
                  <div className="text-[10px] text-pm-text-muted mt-0.5">
                    {(event.stakes as any)?.[0]?.count ?? 0} participants
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs text-pm-blue">
                    {ARC} {event.total_pool.toLocaleString()}
                  </div>
                  <div className={`text-[10px] mt-0.5 ${
                    event.status === 'live'
                      ? 'text-pm-green'
                      : event.status === 'completed'
                        ? 'text-pm-text-muted'
                        : 'text-pm-blue'
                  }`}>
                    {event.status}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-pm-card border border-pm-border rounded-xl p-5">
          <h2 className="text-xs text-pm-text-secondary uppercase tracking-wider mb-4 font-medium">
            Recent transactions
          </h2>
          <div className="space-y-2">
            {transactions?.map(tx => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-lg bg-pm-surface"
              >
                <div>
                  <div className="text-sm font-medium text-pm-text">
                    {TX_LABELS[tx.type] ?? tx.type}
                  </div>
                  <div className="font-mono text-[10px] text-pm-text-muted mt-0.5">
                    {tx.reference?.slice(0, 20)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-mono text-xs font-medium ${
                    ['deposit', 'payout'].includes(tx.type)
                      ? 'text-pm-green'
                      : 'text-pm-red'
                  }`}>
                    {['deposit', 'payout'].includes(tx.type) ? '+' : '-'}
                    {ARC} {tx.arc_amount.toLocaleString()}
                  </div>
                  <div className={`text-[10px] mt-0.5 ${
                    tx.status === 'completed'
                      ? 'text-pm-green/60'
                      : tx.status === 'failed'
                        ? 'text-pm-red/60'
                        : 'text-amber-400/60'
                  }`}>
                    {tx.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}