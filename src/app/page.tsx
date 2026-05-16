import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/ui/Header'
import EventGrid from '@/components/events/EventGrid'
import { ArcEvent } from '@/types'

export const revalidate = 0

export default async function RootPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      multipliers:event_multipliers(*),
      stakes(count),
      outcomes:event_outcomes!event_outcomes_event_id_fkey(*),
      sub_markets:event_sub_markets(*, outcomes:event_outcomes!event_outcomes_event_id_fkey(*))
    `)
    .in('status', ['upcoming', 'live', 'judging'])
    .order('created_at', { ascending: false })

  // Flatten sub_market outcomes into the event.outcomes array for easy access
  const processedEvents = (events ?? []).map(event => {
    const subMarketOutcomes = (event.sub_markets ?? []).flatMap((sm: any) => sm.outcomes ?? [])
    return {
      ...event,
      outcomes: [...(event.outcomes ?? []), ...subMarketOutcomes]
    }
  })

  return (
    <div className="min-h-screen bg-pm-bg">
      <Header profile={profile} />

      <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-6">
        {/* Page title */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-pm-text tracking-tight">All markets</h1>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg border border-pm-border text-pm-text-secondary hover:text-pm-text hover:bg-pm-surface transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="p-2 rounded-lg border border-pm-border text-pm-text-secondary hover:text-pm-text hover:bg-pm-surface transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </button>
            <button className="p-2 rounded-lg border border-pm-border text-pm-text-secondary hover:text-pm-text hover:bg-pm-surface transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Events grid */}
        <EventGrid events={(processedEvents as ArcEvent[]) ?? []} />
      </main>
    </div>
  )
}