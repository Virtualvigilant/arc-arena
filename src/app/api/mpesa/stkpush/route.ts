import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { stkPush } from '@/lib/mpesa/client'
import { v4 as uuid } from 'uuid'

// Admin client to bypass RLS on transactions
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

    const body = await req.json()
    const { amount, phone } = body

    // Validate amount
    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: 'Minimum deposit is KES 1' },
        { status: 400 }
      )
    }

    // Validate phone
    if (!phone) {
      return NextResponse.json(
        { error: 'M-Pesa phone number is required' },
        { status: 400 }
      )
    }

    // Create pending transaction record
    const reference = `ARC-DEP-${uuid().replace(/-/g, '').toUpperCase().slice(0, 16)}`

    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'deposit',
        arc_amount: amount,
        kes_amount: amount,
        reference,
        status: 'pending',
        metadata: { initiated_at: new Date().toISOString(), phone }
      })

    if (txError) {
      console.error('Transaction insert error:', txError)
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      )
    }

    // Trigger M-Pesa STK Push
    const stkResponse = await stkPush({
      phone,
      amount,
      accountReference: reference,
      description: `Arc deposit — ${amount} Arc credits`,
    })

    if (stkResponse.ResponseCode !== '0') {
      // STK push request failed — mark transaction as failed
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'failed' })
        .eq('reference', reference)

      return NextResponse.json(
        { error: stkResponse.ResponseDescription || 'STK Push failed' },
        { status: 500 }
      )
    }

    // Store the CheckoutRequestID so we can match the callback
    await supabaseAdmin
      .from('transactions')
      .update({
        pesapal_tracking_id: stkResponse.CheckoutRequestID,
        metadata: {
          initiated_at: new Date().toISOString(),
          phone,
          merchant_request_id: stkResponse.MerchantRequestID,
          checkout_request_id: stkResponse.CheckoutRequestID,
        }
      })
      .eq('reference', reference)

    return NextResponse.json({
      success: true,
      reference,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      message: stkResponse.CustomerMessage || 'Check your phone for the M-Pesa prompt',
    })

  } catch (err: any) {
    console.error('STK Push error:', err?.response?.data || err)
    return NextResponse.json(
      { error: 'Failed to initiate M-Pesa payment' },
      { status: 500 }
    )
  }
}
