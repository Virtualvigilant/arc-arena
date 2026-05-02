import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ARC = '◈'

// ─── Seed data ────────────────────────────────────────────────

const USERS = [
  { email: 'ephrem@arc.co', password: 'password123', username: 'ephrem', full_name: 'Ephrem Orodi', phone: '0712000001', is_admin: true, arc_balance: 5000 },
  { email: 'brian@arc.co', password: 'password123', username: 'brian_k', full_name: 'Brian Kamau', phone: '0712000002', is_admin: false, arc_balance: 1200 },
  { email: 'amina@arc.co', password: 'password123', username: 'amina_s', full_name: 'Amina Said', phone: '0712000003', is_admin: false, arc_balance: 850 },
  { email: 'korir@arc.co', password: 'password123', username: 'korir_dev', full_name: 'Victor Korir', phone: '0712000004', is_admin: false, arc_balance: 2300 },
  { email: 'wanjiru@arc.co', password: 'password123', username: 'wanjiru_w', full_name: 'Grace Wanjiru', phone: '0712000005', is_admin: false, arc_balance: 400 },
  { email: 'omondi@arc.co', password: 'password123', username: 'omondi_x', full_name: 'Felix Omondi', phone: '0712000006', is_admin: false, arc_balance: 1750 },
  { email: 'aisha@arc.co', password: 'password123', username: 'aisha_m', full_name: 'Aisha Mohamed', phone: '0712000007', is_admin: false, arc_balance: 600 },
  { email: 'mutua@arc.co', password: 'password123', username: 'mutua_b', full_name: 'David Mutua', phone: '0712000008', is_admin: false, arc_balance: 3100 },
]

const EVENTS = [
  {
    title: '72-hour build challenge #001',
    description: 'Build a functional web or mobile mini-project around a mystery theme revealed at the start of competition. Judged on functionality, design quality, and originality of concept.',
    domain: 'Tech / Coding',
    status: 'completed',
    min_competitors: 6,
    max_competitors: 16,
    rake_percent: 15,
    judging_criteria: 'Functionality (40%) · UI and design quality (35%) · Originality of concept (25%). Panel of three judges scores each submission independently. Average score determines rank.',
    active_bands: ['bronze', 'silver'],
    competition_start: daysAgo(14),
    competition_end: daysAgo(11),
    registration_end: daysAgo(14),
    multipliers: [
      { position_label: '1st place', position_rank: 1, multiplier: 4.0, tier_type: 'winner' },
      { position_label: '2nd place', position_rank: 2, multiplier: 2.5, tier_type: 'winner' },
      { position_label: '3rd place', position_rank: 3, multiplier: 1.5, tier_type: 'winner' },
      { position_label: '4th place', position_rank: 4, multiplier: 0.75, tier_type: 'gray' },
      { position_label: '5th place', position_rank: 5, multiplier: 0.50, tier_type: 'gray' },
    ]
  },
  {
    title: '72-hour build challenge #002',
    description: 'Build a functional web or mobile mini-project around a mystery theme revealed at competition start. Theme announced when registration closes — no prior knowledge.',
    domain: 'Tech / Coding',
    status: 'live',
    min_competitors: 6,
    max_competitors: 16,
    rake_percent: 15,
    judging_criteria: 'Functionality (40%) · UI and design quality (35%) · Originality of concept (25%). Submission requires GitHub repo link and a 2-minute screen-recorded demo. Missing either disqualifies the entry.',
    active_bands: ['bronze', 'silver'],
    competition_start: daysAgo(1),
    competition_end: daysFromNow(2),
    registration_end: daysAgo(1),
    multipliers: [
      { position_label: '1st place', position_rank: 1, multiplier: 4.0, tier_type: 'winner' },
      { position_label: '2nd place', position_rank: 2, multiplier: 2.5, tier_type: 'winner' },
      { position_label: '3rd place', position_rank: 3, multiplier: 1.5, tier_type: 'winner' },
      { position_label: '4th place', position_rank: 4, multiplier: 0.75, tier_type: 'gray' },
      { position_label: '5th place', position_rank: 5, multiplier: 0.50, tier_type: 'gray' },
    ]
  },
  {
    title: 'Algorithm sprint — data structures',
    description: 'Solve 5 progressively harder data structures and algorithms problems. Ranked by total score first, then time taken as a tiebreaker. Problems released simultaneously at competition start.',
    domain: 'Tech / Coding',
    status: 'live',
    min_competitors: 6,
    max_competitors: 12,
    rake_percent: 15,
    judging_criteria: 'Score out of 100 (20 points per problem). Time taken as tiebreaker for equal scores. Solutions submitted as GitHub gist links with language of choice.',
    active_bands: ['bronze', 'silver', 'gold'],
    competition_start: daysAgo(2),
    competition_end: daysFromNow(1),
    registration_end: daysAgo(2),
    multipliers: [
      { position_label: '1st place', position_rank: 1, multiplier: 4.0, tier_type: 'winner' },
      { position_label: '2nd place', position_rank: 2, multiplier: 2.5, tier_type: 'winner' },
      { position_label: '3rd place', position_rank: 3, multiplier: 1.5, tier_type: 'winner' },
      { position_label: '4th place', position_rank: 4, multiplier: 0.75, tier_type: 'gray' },
      { position_label: '5th place', position_rank: 5, multiplier: 0.50, tier_type: 'gray' },
    ]
  },
  {
    title: 'Hustle month — most revenue in 30 days',
    description: 'Generate the most verifiable income from any side hustle over 30 days. M-Pesa statements submitted as proof. Any legal hustle qualifies — freelance, sales, services, anything.',
    domain: 'Hustle',
    status: 'live',
    min_competitors: 6,
    max_competitors: 20,
    rake_percent: 15,
    judging_criteria: 'Total verified revenue via M-Pesa Till or Pochi la Biashara statements. Revenue must be clearly identifiable as hustle income — not peer transfers. Top earner wins.',
    active_bands: ['silver', 'gold'],
    competition_start: daysAgo(5),
    competition_end: daysFromNow(25),
    registration_end: daysAgo(3),
    multipliers: [
      { position_label: '1st place', position_rank: 1, multiplier: 4.0, tier_type: 'winner' },
      { position_label: '2nd place', position_rank: 2, multiplier: 2.5, tier_type: 'winner' },
      { position_label: '3rd place', position_rank: 3, multiplier: 1.5, tier_type: 'winner' },
      { position_label: '4th place', position_rank: 4, multiplier: 0.75, tier_type: 'gray' },
      { position_label: '5th place', position_rank: 5, multiplier: 0.50, tier_type: 'gray' },
    ]
  },
  {
    title: 'UI design challenge — mobile first',
    description: 'Design a complete mobile app UI for a brief that will be revealed at competition start. Figma or any design tool accepted. Submit a shareable prototype link.',
    domain: 'Design',
    status: 'upcoming',
    min_competitors: 6,
    max_competitors: 14,
    rake_percent: 15,
    judging_criteria: 'Visual aesthetics (35%) · Usability and UX logic (35%) · Originality and concept (30%). Three judges score independently. Results averaged for final rank.',
    active_bands: ['bronze', 'silver', 'gold'],
    competition_start: daysFromNow(3),
    competition_end: daysFromNow(6),
    registration_end: daysFromNow(3),
    multipliers: [
      { position_label: '1st place', position_rank: 1, multiplier: 4.0, tier_type: 'winner' },
      { position_label: '2nd place', position_rank: 2, multiplier: 2.5, tier_type: 'winner' },
      { position_label: '3rd place', position_rank: 3, multiplier: 1.5, tier_type: 'winner' },
      { position_label: '4th place', position_rank: 4, multiplier: 0.75, tier_type: 'gray' },
      { position_label: '5th place', position_rank: 5, multiplier: 0.50, tier_type: 'gray' },
    ]
  },
  {
    title: 'Campus pitch competition — best business idea',
    description: 'Pitch your business idea in a 3-minute video. Judges score on market opportunity, feasibility, originality, and delivery. Upload to YouTube (unlisted) and submit link.',
    domain: 'Academic',
    status: 'upcoming',
    min_competitors: 6,
    max_competitors: 16,
    rake_percent: 15,
    judging_criteria: 'Market opportunity (25%) · Feasibility (25%) · Originality (25%) · Pitch delivery and clarity (25%). Panel of three judges including one industry mentor.',
    active_bands: ['bronze', 'silver'],
    competition_start: daysFromNow(7),
    competition_end: daysFromNow(10),
    registration_end: daysFromNow(7),
    multipliers: [
      { position_label: '1st place', position_rank: 1, multiplier: 4.0, tier_type: 'winner' },
      { position_label: '2nd place', position_rank: 2, multiplier: 2.5, tier_type: 'winner' },
      { position_label: '3rd place', position_rank: 3, multiplier: 1.5, tier_type: 'winner' },
      { position_label: '4th place', position_rank: 4, multiplier: 0.75, tier_type: 'gray' },
      { position_label: '5th place', position_rank: 5, multiplier: 0.50, tier_type: 'gray' },
    ]
  },
]

// Stakes config per event
// [username, band, amount, finishing_position | null]
type StakeConfig = [string, string, number, number | null]

const STAKES: Record<string, StakeConfig[]> = {
  '72-hour build challenge #001': [
    ['brian_k',    'silver', 150, 1],
    ['amina_s',    'silver', 100, 2],
    ['korir_dev',  'silver', 180, 3],
    ['wanjiru_w',  'bronze', 75,  4],
    ['omondi_x',   'silver', 120, 5],
    ['aisha_m',    'bronze', 60,  6],
    ['mutua_b',    'silver', 200, 7],
  ],
  '72-hour build challenge #002': [
    ['brian_k',   'silver', 150, null],
    ['korir_dev', 'silver', 180, null],
    ['omondi_x',  'silver', 120, null],
    ['mutua_b',   'silver', 200, null],
    ['wanjiru_w', 'bronze', 75,  null],
    ['aisha_m',   'bronze', 50,  null],
  ],
  'Algorithm sprint — data structures': [
    ['korir_dev', 'gold',   250, null],
    ['brian_k',   'silver', 150, null],
    ['mutua_b',   'gold',   300, null],
    ['omondi_x',  'silver', 100, null],
    ['amina_s',   'silver', 120, null],
  ],
  'Hustle month — most revenue in 30 days': [
    ['omondi_x',  'silver', 150, null],
    ['mutua_b',   'gold',   250, null],
    ['brian_k',   'silver', 100, null],
    ['korir_dev', 'gold',   200, null],
  ],
}

// ─── Helpers ───────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

// ─── Main ──────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 Starting Arc seed...\n')

  // ── 1. Create users ──────────────────────────────────────────
  console.log('👤 Creating users...')

  const userMap: Record<string, string> = {} // username → user id

  for (const u of USERS) {
    // Check if user already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', u.username)
      .single()

    if (existing) {
      console.log(`   ↳ @${u.username} already exists — skipping`)
      userMap[u.username] = existing.id
      continue
    }

    const { data: authUser, error: signUpError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: {
        full_name: u.full_name,
        username: u.username,
      }
    })

    if (signUpError || !authUser.user) {
      console.error(`   ✗ Failed to create ${u.username}:`, signUpError?.message)
      continue
    }

    await sleep(300) // let trigger fire

    // Update profile with phone, is_admin, arc_balance
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        phone: u.phone,
        is_admin: u.is_admin,
        arc_balance: u.arc_balance,
      })
      .eq('id', authUser.user.id)

    if (profileError) {
      console.error(`   ✗ Profile update failed for ${u.username}:`, profileError.message)
      continue
    }

    userMap[u.username] = authUser.user.id

    // Log deposit transaction for initial balance
    if (u.arc_balance > 0) {
      await supabase.from('transactions').insert({
        user_id: authUser.user.id,
        type: 'deposit',
        arc_amount: u.arc_balance,
        kes_amount: u.arc_balance,
        reference: `SEED-DEP-${u.username.toUpperCase()}`,
        status: 'completed',
        metadata: { note: 'Seed deposit' }
      })
    }

    console.log(`   ✓ @${u.username} created — ${ARC} ${u.arc_balance} Arc`)
  }

  console.log(`\n   ${Object.keys(userMap).length} users ready\n`)

  // ── 2. Create events ─────────────────────────────────────────
  console.log('🏟️  Creating events...')

  const eventMap: Record<string, string> = {} // title → event id

  for (const ev of EVENTS) {
    const { multipliers, ...eventData } = ev

    // Check if already exists
    const { data: existing } = await supabase
      .from('events')
      .select('id, title')
      .eq('title', eventData.title)
      .single()

    if (existing) {
      console.log(`   ↳ "${eventData.title}" already exists — skipping`)
      eventMap[eventData.title] = existing.id
      continue
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        ...eventData,
        created_by: userMap['ephrem'],
        total_pool: 0,
        rake_collected: 0,
        prize_pool: 0,
        type: 'collector',
      })
      .select()
      .single()

    if (eventError || !event) {
      console.error(`   ✗ Failed to create event "${eventData.title}":`, eventError?.message)
      continue
    }

    eventMap[eventData.title] = event.id

    // Insert multipliers
    const { error: multError } = await supabase
      .from('event_multipliers')
      .insert(multipliers.map(m => ({ ...m, event_id: event.id })))

    if (multError) {
      console.error(`   ✗ Multipliers failed for "${eventData.title}":`, multError.message)
      continue
    }

    console.log(`   ✓ "${eventData.title}" — ${eventData.status}`)
  }

  console.log(`\n   ${Object.keys(eventMap).length} events ready\n`)

  // ── 3. Place stakes ──────────────────────────────────────────
  console.log('💰 Placing stakes...')

  for (const [eventTitle, stakeConfigs] of Object.entries(STAKES)) {
    const eventId = eventMap[eventTitle]
    if (!eventId) {
      console.log(`   ↳ Event not found: "${eventTitle}" — skipping stakes`)
      continue
    }

    console.log(`\n   Event: "${eventTitle}"`)

    for (const [username, band, amount, finishingPosition] of stakeConfigs) {
      const userId = userMap[username]
      if (!userId) {
        console.log(`     ↳ User @${username} not found — skipping`)
        continue
      }

      // Check if stake already exists
      const { data: existingStake } = await supabase
        .from('stakes')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single()

      if (existingStake) {
        console.log(`     ↳ @${username} already staked — skipping`)
        continue
      }

      // Insert stake directly (bypassing Arc balance check for seed)
      const { data: stake, error: stakeError } = await supabase
        .from('stakes')
        .insert({
          event_id: eventId,
          user_id: userId,
          amount,
          band,
          status: 'active',
          finishing_position: finishingPosition,
        })
        .select()
        .single()

      if (stakeError || !stake) {
        console.error(`     ✗ Stake failed for @${username}:`, stakeError?.message)
        continue
      }

      // Log stake transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'stake',
        arc_amount: amount,
        reference: `SEED-STAKE-${stake.id.slice(0, 8).toUpperCase()}`,
        status: 'completed',
        metadata: { event_id: eventId, note: 'Seed stake' }
      })

      // Update event pool
      const rake = Math.floor(amount * 0.15)
      await supabase.rpc('increment_event_pool', {
        p_event_id: eventId,
        p_amount: amount,
        p_rake: rake
      })

      console.log(`     ✓ @${username} — ${ARC} ${amount} Arc (${band})${finishingPosition ? ` — position #${finishingPosition}` : ''}`)
    }
  }

  // ── 4. Process payouts for completed events ──────────────────
  console.log('\n\n🏆 Processing payouts for completed events...')

  const completedEvents = EVENTS.filter(e => e.status === 'completed')

  for (const ev of completedEvents) {
    const eventId = eventMap[ev.title]
    if (!eventId) continue

    const { error } = await supabase.rpc('process_event_payouts', {
      p_event_id: eventId
    })

    if (error) {
      console.error(`   ✗ Payout failed for "${ev.title}":`, error.message)
    } else {
      console.log(`   ✓ Payouts processed — "${ev.title}"`)
    }
  }

  // ── 5. Summary ───────────────────────────────────────────────
  console.log('\n\n📊 Seed summary...\n')

  const { data: finalEvents } = await supabase
    .from('events')
    .select('title, status, total_pool, rake_collected, prize_pool')

  const { data: finalStakes } = await supabase
    .from('stakes')
    .select('id')

  const { data: finalUsers } = await supabase
    .from('profiles')
    .select('username, arc_balance, is_admin')

  const totalPool = finalEvents?.reduce((a, b) => a + b.total_pool, 0) ?? 0
  const totalRake = finalEvents?.reduce((a, b) => a + b.rake_collected, 0) ?? 0

  console.log(`   Users:        ${finalUsers?.length ?? 0}`)
  console.log(`   Events:       ${finalEvents?.length ?? 0}`)
  console.log(`   Stakes:       ${finalStakes?.length ?? 0}`)
  console.log(`   Total pool:   ${ARC} ${totalPool.toLocaleString()} Arc`)
  console.log(`   Total rake:   ${ARC} ${totalRake.toLocaleString()} Arc`)

  console.log('\n   Accounts:\n')
  finalUsers?.forEach(u => {
    console.log(`   ${u.is_admin ? '👑' : '   '} @${u.username.padEnd(15)} — ${ARC} ${u.arc_balance.toLocaleString()} Arc`)
  })

  console.log('\n✅ Seed complete\n')
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})