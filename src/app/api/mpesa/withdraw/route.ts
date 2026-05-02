import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { v4 as uuid } from 'uuid'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const WITHDRAWAL_FEE_PERCENT = 2.5

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { arcAmount, phone } = body

    if (!arcAmount || arcAmount < 100) {
      return NextResponse.json(
        { error: 'Minimum withdrawal is 100 Arc' },
        { status: 400 }
      )
    }

    if (!phone) {
      return NextResponse.json(
        { error: 'M-Pesa phone number required' },
        { status: 400 }
      )
    }

    // Check balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('arc_balance')
      .eq('id', user.id)
      .single()

    if (!profile || profile.arc_balance < arcAmount) {
      return NextResponse.json(
        { error: 'Insufficient Arc balance' },
        { status: 400 }
      )
    }

    const fee = Math.ceil(arcAmount * (WITHDRAWAL_FEE_PERCENT / 100))
    const kesAmount = arcAmount - fee

    const reference = `ARC-WIT-${uuid().replace(/-/g, '').toUpperCase().slice(0, 16)}`

    // Debit Arc atomically
    const { error: debitError } = await supabaseAdmin
      .rpc('debit_arc_balance', {
        p_user_id: user.id,
        p_amount: arcAmount
      })

    if (debitError) {
      return NextResponse.json(
        { error: 'Failed to debit Arc balance' },
        { status: 400 }
      )
    }

    // Log pending withdrawal
    await supabaseAdmin.from('transactions').insert({
      user_id: user.id,
      type: 'withdrawal',
      arc_amount: arcAmount,
      kes_amount: kesAmount,
      reference,
      status: 'pending',
      metadata: {
        phone,
        fee_arc: fee,
        fee_percent: WITHDRAWAL_FEE_PERCENT,
        initiated_at: new Date().toISOString()
      }
    })

    // TODO: Implement Daraja B2C disbursement here
    // For now — manual M-Pesa transfer, transaction marked pending
    // Admin confirms and marks as completed

    return NextResponse.json({
      success: true,
      reference,
      arcDebited: arcAmount,
      feeTaken: fee,
      kesPayable: kesAmount,
      message: `Withdrawal initiated. KES ${kesAmount} will be sent to ${phone} within 24 hours.`
    })

  } catch (err: any) {
    console.error('Withdrawal error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
