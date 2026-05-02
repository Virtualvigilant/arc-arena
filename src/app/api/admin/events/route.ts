import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { multipliers, ...eventData } = body

    // Create event
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .insert({
        ...eventData,
        status: 'upcoming',
        type: 'collector',
        created_by: user.id,
        total_pool: 0,
        rake_collected: 0,
        prize_pool: 0,
      })
      .select()
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: eventError?.message ?? 'Failed to create event' },
        { status: 500 }
      )
    }

    // Insert multipliers
    const multipliersWithEventId = multipliers.map((m: any, i: number) => ({
      ...m,
      event_id: event.id,
      position_rank: i + 1,
    }))

    const { error: multError } = await supabaseAdmin
      .from('event_multipliers')
      .insert(multipliersWithEventId)

    if (multError) {
      // Rollback event
      await supabaseAdmin.from('events').delete().eq('id', event.id)
      return NextResponse.json(
        { error: 'Failed to insert multipliers' },
        { status: 500 }
      )
    }

    return NextResponse.json({ eventId: event.id, success: true })

  } catch (err: any) {
    console.error('Create event error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}