import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params

    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { winning_outcome_id } = await req.json()
    if (!winning_outcome_id) {
      return NextResponse.json({ error: 'winning_outcome_id is required' }, { status: 400 })
    }

    // Verify this outcome belongs to this event
    const { data: outcome } = await supabaseAdmin
      .from('event_outcomes')
      .select('id, label')
      .eq('id', winning_outcome_id)
      .eq('event_id', eventId)
      .single()

    if (!outcome) {
      return NextResponse.json({ error: 'Invalid outcome for this event' }, { status: 400 })
    }

    // Get event info
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('id, rake_percent, status')
      .eq('id', eventId)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.status === 'completed') {
      return NextResponse.json({ error: 'Event already completed' }, { status: 400 })
    }

    // Get all active stakes for this event
    const { data: allStakes } = await supabaseAdmin
      .from('stakes')
      .select('id, user_id, amount, outcome_id')
      .eq('event_id', eventId)
      .eq('status', 'active')

    if (!allStakes || allStakes.length === 0) {
      // No stakes — just mark as completed
      await supabaseAdmin
        .from('events')
        .update({ winning_outcome_id, status: 'completed' })
        .eq('id', eventId)

      return NextResponse.json({ success: true, message: 'No stakes to resolve', winners: 0, losers: 0 })
    }

    // Separate winners and losers
    const winners = allStakes.filter(s => s.outcome_id === winning_outcome_id)
    const losers = allStakes.filter(s => s.outcome_id !== winning_outcome_id)

    // Calculate pools
    const totalPool = allStakes.reduce((sum, s) => sum + s.amount, 0)
    const rakePercent = event.rake_percent ?? 15
    const rake = Math.floor(totalPool * (rakePercent / 100))
    const prizePool = totalPool - rake

    const totalWinnerStakes = winners.reduce((sum, s) => sum + s.amount, 0)

    // Process payouts for winners
    for (const winner of winners) {
      // Proportional share: (winner_stake / total_winner_stakes) * prize_pool
      const payout = totalWinnerStakes > 0
        ? Math.floor((winner.amount / totalWinnerStakes) * prizePool)
        : 0

      if (payout > 0) {
        // Credit user balance
        const { data: currentProfile } = await supabaseAdmin
          .from('profiles')
          .select('arc_balance')
          .eq('id', winner.user_id)
          .single()

        if (currentProfile) {
          await supabaseAdmin
            .from('profiles')
            .update({ arc_balance: currentProfile.arc_balance + payout })
            .eq('id', winner.user_id)
        }

        // Create payout transaction
        await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: winner.user_id,
            type: 'payout',
            arc_amount: payout,
            status: 'completed',
            reference: `resolve-${eventId}`,
            metadata: {
              event_id: eventId,
              stake_id: winner.id,
              outcome_label: outcome.label,
              share: totalWinnerStakes > 0 ? (winner.amount / totalWinnerStakes) : 0
            }
          })
      }

      // Mark stake as won
      await supabaseAdmin
        .from('stakes')
        .update({ status: 'won', payout })
        .eq('id', winner.id)
    }

    // Mark losers
    for (const loser of losers) {
      await supabaseAdmin
        .from('stakes')
        .update({ status: 'lost', payout: 0 })
        .eq('id', loser.id)
    }

    // Update event
    await supabaseAdmin
      .from('events')
      .update({
        winning_outcome_id,
        status: 'completed',
        total_pool: totalPool,
        rake_collected: rake,
        prize_pool: prizePool
      })
      .eq('id', eventId)

    return NextResponse.json({
      success: true,
      winners: winners.length,
      losers: losers.length,
      totalPool,
      rake,
      prizePool,
      winningOutcome: outcome.label
    })

  } catch (err: any) {
    console.error('Resolve error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
