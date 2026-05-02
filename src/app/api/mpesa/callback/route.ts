import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractCallbackMeta, type STKCallbackData } from '@/lib/mpesa/client'

// Service role — no user session in webhook context
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body: STKCallbackData = await req.json()
    const callback = body.Body.stkCallback

    console.log('M-Pesa STK callback received:', {
      CheckoutRequestID: callback.CheckoutRequestID,
      ResultCode: callback.ResultCode,
      ResultDesc: callback.ResultDesc,
    })

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = callback

    // Find the pending transaction by CheckoutRequestID
    const { data: transaction, error: txFindError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('payment_tracking_id', CheckoutRequestID)
      .eq('status', 'pending')
      .single()

    if (txFindError || !transaction) {
      console.error('Transaction not found for CheckoutRequestID:', CheckoutRequestID)
      // Return 200 anyway — Daraja retries on non-200
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    // ResultCode 0 = Success
    if (ResultCode === 0 && CallbackMetadata) {
      const meta = extractCallbackMeta(CallbackMetadata.Item)
      // meta contains: Amount, MpesaReceiptNumber, Balance, TransactionDate, PhoneNumber

      // Credit Arc to user wallet — atomic operation
      const { error: creditError } = await supabaseAdmin.rpc(
        'credit_arc_balance',
        {
          p_user_id: transaction.user_id,
          p_amount: transaction.arc_amount,
        }
      )

      if (creditError) {
        console.error('Arc credit failed:', creditError)
        return NextResponse.json({ ResultCode: 1, ResultDesc: 'Credit failed' })
      }

      // Mark transaction complete
      await supabaseAdmin
        .from('transactions')
        .update({
          status: 'completed',
          metadata: {
            ...transaction.metadata,
            confirmed_at: new Date().toISOString(),
            mpesa_receipt: meta.MpesaReceiptNumber,
            mpesa_phone: meta.PhoneNumber,
            mpesa_amount: meta.Amount,
            mpesa_date: meta.TransactionDate,
          },
        })
        .eq('id', transaction.id)

      console.log(`✅ Arc credited: ${transaction.arc_amount} Arc → user ${transaction.user_id} (Receipt: ${meta.MpesaReceiptNumber})`)

    } else {
      // Payment failed or was cancelled
      await supabaseAdmin
        .from('transactions')
        .update({
          status: 'failed',
          metadata: {
            ...transaction.metadata,
            failed_at: new Date().toISOString(),
            failure_reason: callback.ResultDesc,
          },
        })
        .eq('id', transaction.id)

      console.log(`❌ M-Pesa payment failed: ${callback.ResultDesc} (tx: ${transaction.id})`)
    }

    // Always return 200 with ResultCode 0 to acknowledge receipt
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })

  } catch (err: any) {
    console.error('M-Pesa callback error:', err)
    // Still return 200 — we don't want Daraja to retry infinitely
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
}
