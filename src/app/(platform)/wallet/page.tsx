import { createClient } from '@/lib/supabase/server'
import DepositFlow from '@/components/wallet/DepositFlow'
import WithdrawFlow from '@/components/wallet/WithdrawFlow'
import SyncButton from '@/components/wallet/SyncButton'
import { Transaction } from '@/types'

const ARC = '◈'

const TX_LABELS: Record<string, string> = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  stake: 'Stake placed',
  payout: 'Winnings',
  rake_fee: 'Rake fee'
}

const TX_COLORS: Record<string, string> = {
  deposit: 'text-green-500',
  payout: 'text-green-500',
  withdrawal: 'text-red-500',
  stake: 'text-stovest-blue-light',
  rake_fee: 'text-gray-500'
}

export default async function WalletPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const totalDeposited = transactions
    ?.filter(t => t.type === 'deposit' && t.status === 'completed')
    .reduce((a, b) => a + b.arc_amount, 0) ?? 0

  const totalWon = transactions
    ?.filter(t => t.type === 'payout' && t.status === 'completed')
    .reduce((a, b) => a + b.arc_amount, 0) ?? 0

  const totalStaked = transactions
    ?.filter(t => t.type === 'stake' && t.status === 'completed')
    .reduce((a, b) => a + b.arc_amount, 0) ?? 0

  return (
    <div className="max-w-4xl mx-auto py-4">

      {/* Balance card */}
      <div className="bg-gradient-to-br from-[#121520] to-[#0D1018] border border-stovest-border rounded-2xl p-8 mb-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-stovest-blue-dim rounded-full blur-[100px] pointer-events-none" />
        
        <div className="text-gray-400 text-xs text-center uppercase tracking-widest mb-3 relative z-10">
          Arc balance
        </div>
        <div className="font-syne text-center text-5xl font-bold text-white mb-2 tracking-tight relative z-10 flex items-center justify-center gap-2">
          <span className="text-stovest-blue">{ARC}</span> 
          {profile?.arc_balance.toLocaleString() ?? 0}
        </div>
        <div className="text-gray-500 text-center text-xs relative z-10">
          1 Arc = 1 KES · 2.5% withdrawal fee
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8 relative z-10">
          {[
            { label: 'Total deposited', value: totalDeposited },
            { label: 'Total staked', value: totalStaked },
            { label: 'Total won', value: totalWon },
          ].map(s => (
            <div key={s.label} className="bg-[#181C2A] border border-[#23293D] rounded-xl p-4 flex flex-col items-center justify-center">
              <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">
                {s.label}
              </div>
              <div className="font-syne text-lg font-bold text-white">
                <span className="text-stovest-blue">◈</span> {s.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deposit + Withdraw */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <DepositFlow />
        <WithdrawFlow balance={profile?.arc_balance ?? 0} phone={profile?.phone ?? ''} />
      </div>

      {/* Transaction history */}
      <div className="bg-stovest-card border border-stovest-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs text-gray-400 uppercase tracking-wider">
            Transaction history
          </h2>
          <SyncButton />
        </div>

        <div className="space-y-1">
          {transactions?.map((tx: Transaction) => {
            const isPositive = ['deposit', 'payout'].includes(tx.type)
            const sign = isPositive ? '+' : '-'

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-[#181C2A] transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-gray-200">
                    {TX_LABELS[tx.type] ?? tx.type}
                  </div>
                  <div className="font-mono text-[10px] text-gray-500 mt-1">
                    {new Date(tx.created_at).toLocaleDateString('en-KE', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                    {' · '}
                    {tx.reference?.slice(0, 8)}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-syne text-sm font-bold ${TX_COLORS[tx.type]}`}>
                    {sign} {ARC} {tx.arc_amount.toLocaleString()}
                  </div>
                  <div className={`text-[10px] mt-1 ${
                    tx.status === 'completed'
                      ? 'text-gray-500'
                      : tx.status === 'failed'
                        ? 'text-red-500'
                        : 'text-amber-500 font-medium'
                  }`}>
                    {tx.status}
                  </div>
                </div>
              </div>
            )
          })}

          {(!transactions || transactions.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-3xl mb-3 font-mono opacity-50 text-stovest-blue">◈</div>
              <div className="text-sm">No transactions yet</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}