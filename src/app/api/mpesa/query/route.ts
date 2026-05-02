import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { querySTKStatus } from '@/lib/mpesa/client'

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Optionally accept a specific checkoutRequestId to query
    let checkoutRequestId: string | null = null
    try {
      const body = await req.json()
      checkoutRequestId = body.checkoutRequestId || null
    } catch {
      // No body — query all pending
    }

    // Get pending deposit transactions for this user
    let query = supabaseAdmin
      .from('transactions')
      .select('id, payment_tracking_id, reference, arc_amount, user_id')
      .eq('user_id', user.id)
      .eq('type', 'deposit')
      .eq('status', 'pending')

    if (checkoutRequestId) {
      query = query.eq('payment_tracking_id', checkoutRequestId)
    }

    const { data: pendingTxs } = await query

    if (!pendingTxs || pendingTxs.length === 0) {
      return NextResponse.json({ message: 'No pending transactions', count: 0, completed: false })
    }

    let syncedCount = 0
    let anyCompleted = false

    for (const tx of pendingTxs) {
      if (!tx.payment_tracking_id) continue

      try {
        const status = await querySTKStatus(tx.payment_tracking_id)

        // ResultCode "0" = success
        if (status.ResultCode === '0') {
          // Credit Arc balance
          const { error: creditError } = await supabaseAdmin.rpc(
            'credit_arc_balance',
            {
              p_user_id: tx.user_id,
              p_amount: tx.arc_amount,
            }
          )

          if (!creditError) {
            await supabaseAdmin
              .from('transactions')
              .update({
                status: 'completed',
                metadata: {
                  confirmed_at: new Date().toISOString(),
                  confirmed_via: 'stk_query',
                  result_desc: status.ResultDesc,
                },
              })
              .eq('id', tx.id)

            syncedCount++
            anyCompleted = true
            console.log(`✅ STK query confirmed: ${tx.arc_amount} Arc → user ${tx.user_id}`)
          }
        } else if (
          status.ResultCode &&
          status.ResultCode !== '0' &&
          status.ResultDesc !== 'The service request is processed successfully'
        ) {
          // Definitive failure — mark as failed
          await supabaseAdmin
            .from('transactions')
            .update({
              status: 'failed',
              metadata: {
                failed_at: new Date().toISOString(),
                failure_reason: status.ResultDesc,
              },
            })
            .eq('id', tx.id)
        }
        // Otherwise still pending — do nothing
      } catch (err) {
        console.error(`Failed to query STK status for tx ${tx.reference}:`, err)
      }
    }

    return NextResponse.json({
      message: 'Sync complete',
      count: syncedCount,
      completed: anyCompleted,
    })

  } catch (err: any) {
    console.error('STK query error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
