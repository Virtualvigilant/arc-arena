import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { validateStakeBand } from '@/lib/arc/engine'
import { StakeBand } from '@/types'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { amount, band }: { amount: number; band: StakeBand } = body

    // Validate band and amount
    if (!validateStakeBand(amount, band)) {
      return NextResponse.json(
        { error: `Amount ${amount} is outside ${band} band range` },
        { status: 400 }
      )
    }

    // Check user has enough Arc
    const { data: profile } = await supabase
      .from('profiles')
      .select('arc_balance')
      .eq('id', user.id)
      .single()

    if (!profile || profile.arc_balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient Arc balance' },
        { status: 400 }
      )
    }

    // Place stake atomically via DB function
    const { data: stakeId, error: stakeError } = await supabaseAdmin
      .rpc('place_stake', {
        p_event_id: id,
        p_user_id: user.id,
        p_amount: amount,
        p_band: band
      })

    if (stakeError) {
      return NextResponse.json(
        { error: stakeError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ stakeId, success: true })

  } catch (err: any) {
    console.error('Stake error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
