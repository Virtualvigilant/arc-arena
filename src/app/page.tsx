import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/ui/Header'
import EventGrid from '@/components/events/EventGrid'
import { ArcEvent } from '@/types'

import Sidebar from '@/components/ui/Sidebar'

// ... existing imports stay the same but I'll replace everything down from import Header

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
      stakes(count)
    `)
    .in('status', ['upcoming', 'live', 'judging'])
    .order('created_at', { ascending: false })

  const { data: stats } = await supabase
    .from('events')
    .select('total_pool, rake_collected, status')
    .in('status', ['live', 'completed'])

  const totalPool = stats?.reduce((a, b) => a + (b.total_pool || 0), 0) ?? 0
  const totalRake = stats?.reduce((a, b) => a + (b.rake_collected || 0), 0) ?? 0
  const liveCount = stats?.filter(e => e.status === 'live').length ?? 0

  return (
    <div className="flex h-screen overflow-hidden bg-stovest-bg">
      <Sidebar profile={profile} />
      
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative text-white">
        <Header profile={profile} />
        
        <main className="max-w-6xl mx-auto w-full px-8 py-2">
          
          <div className="grid grid-cols-4 gap-4 mb-6">
  
            {/* Total Pool Main Card */}
            <div className="col-span-1 bg-stovest-card border border-stovest-border rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-stovest-blue-dim to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-8 pr-2 relative z-10">
                <div className="text-gray-400 text-sm">Total Pool</div>
                <div className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-xs">◈</div>
              </div>
              <div className="relative z-10">
                <div className="font-syne text-3xl font-bold tracking-tight text-white mb-2">
                  <span className="text-stovest-blue">◈</span> {totalPool.toLocaleString()}
                </div>
                <div className="text-xs">
                  <span className="text-stovest-blue font-medium">+12.5% </span>
                  <span className="text-gray-500">this week</span>
                </div>
              </div>
            </div>

            {/* Smaller Sub-cards */}
            <div className="col-span-3 bg-stovest-card border border-stovest-border rounded-2xl p-6 flex items-center justify-between">
              
              <div className="flex-1 px-4 border-r border-stovest-border/50">
                <div className="text-gray-400 text-xs mb-3">Rake Collected</div>
                <div className="text-xl font-bold font-syne tracking-tight mb-1">
                  ◈ {totalRake.toLocaleString()}
                </div>
                <div className="text-stovest-blue text-[10px]">+ ◈488.0</div>
              </div>

              <div className="flex-1 px-8 border-r border-stovest-border/50">
                <div className="text-gray-400 text-xs mb-3">Live Events</div>
                <div className="text-xl font-bold font-syne tracking-tight mb-1">
                  {liveCount} Active
                </div>
                <div className="text-green-500 text-[10px]">Open for staking</div>
              </div>

              <div className="flex-1 px-8">
                <div className="text-gray-400 text-xs mb-3">Arc Rate</div>
                <div className="text-xl font-bold font-syne tracking-tight mb-1">
                  KES 1.00
                </div>
                <div className="text-gray-600 text-[10px] uppercase">Stable peg</div>
              </div>

            </div>

          </div>

          <div className="bg-stovest-card rounded-2xl border border-stovest-border p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-gray-300">Arena Markets Overview</h2>
              <button className="text-xs bg-[#1E2232] text-gray-300 px-4 py-1.5 rounded-full hover:bg-gray-700 transition">
                View all
              </button>
            </div>
            <EventGrid events={(events as ArcEvent[]) ?? []} />
          </div>

        </main>
      </div>
    </div>
  )
}