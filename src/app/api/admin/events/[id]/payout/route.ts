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
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Verify all stakes have positions
  const { data: unranked } = await supabaseAdmin
    .from('stakes')
    .select('id')
    .eq('event_id', id)
    .is('finishing_position', null)
    .eq('status', 'active')

  if (unranked && unranked.length > 0) {
    return NextResponse.json(
      { error: `${unranked.length} competitors have no finishing position set` },
      { status: 400 }
    )
  }

  // Run payout function
  const { error } = await supabaseAdmin.rpc('process_event_payouts', {
    p_event_id: id
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
