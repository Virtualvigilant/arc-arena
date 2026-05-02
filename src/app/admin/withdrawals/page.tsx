import { createClient } from '@/lib/supabase/server'
import WithdrawalActions from '@/components/admin/WithdrawalActions'

const ARC = '◈'

export const revalidate = 0

export default async function AdminWithdrawalsPage() {
  const supabase = await createClient()

  const { data: withdrawals } = await supabase
    .from('transactions')
    .select('*, profiles(username, phone)')
    .eq('type', 'withdrawal')
    .order('created_at', { ascending: false })

  const pending = withdrawals?.filter(w => w.status === 'pending') ?? []
  const completed = withdrawals?.filter(w => w.status === 'completed') ?? []

  const totalPending = pending.reduce((a, b) => a + (b.kes_amount ?? 0), 0)

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Withdrawals</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {pending.length} pending · KES {totalPending.toLocaleString()} to send
        </p>
      </div>

      {pending.length > 0 && (
        <div className="bg-amber-950 border border-amber-800 rounded-xl overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-amber-800">
            <h2 className="text-xs text-amber-400 uppercase tracking-wider">
              Pending — {pending.length} withdrawal{pending.length !== 1 ? 's' : ''}
            </h2>
          </div>
          <div className="divide-y divide-amber-900">
            {pending.map(w => (
              <div key={w.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-white font-medium text-sm">
                    @{(w as any).profiles?.username}
                  </div>
                  <div className="font-mono text-amber-400 text-xs mt-0.5">
                    {(w as any).profiles?.phone ?? w.metadata?.phone}
                  </div>
                  <div className="text-gray-500 text-[10px] font-mono mt-0.5">
                    {w.reference}
                  </div>
                </div>
                <div className="text-right mr-4">
                  <div className="font-mono text-white text-sm">
                    {ARC} {w.arc_amount.toLocaleString()} Arc
                  </div>
                  <div className="font-mono text-amber-300 text-sm font-medium">
                    KES {w.kes_amount?.toLocaleString()}
                  </div>
                  <div className="text-gray-500 text-[10px] mt-0.5">
                    Fee: {w.metadata?.fee_arc} Arc
                  </div>
                </div>
                <WithdrawalActions transactionId={w.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-xs text-gray-400 uppercase tracking-wider">
            Completed — {completed.length} withdrawal{completed.length !== 1 ? 's' : ''}
          </h2>
        </div>
        <div className="divide-y divide-gray-800">
          {completed.map(w => (
            <div key={w.id} className="px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-gray-300 font-medium text-sm">
                  @{(w as any).profiles?.username}
                </div>
                <div className="font-mono text-gray-500 text-[10px] mt-0.5">
                  {new Date(w.created_at).toLocaleDateString('en-KE', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-gray-400 text-sm">
                  KES {w.kes_amount?.toLocaleString()}
                </div>
                <div className="text-green-600 text-[10px] mt-0.5">completed</div>
              </div>
            </div>
          ))}
          {completed.length === 0 && (
            <div className="text-center py-8 text-gray-600 text-sm">
              No completed withdrawals yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}