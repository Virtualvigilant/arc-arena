'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'

export default function Header({ profile }: { profile: Profile | null }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-20 flex items-center justify-between px-8 bg-transparent sticky top-0 z-30">
      <div className="flex-1" />

      <div className="flex items-center gap-4">

        {/* Profile */}
        {profile && (
          <div className="flex items-center gap-3 pl-2 group relative cursor-pointer ml-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-stovest-blue to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-[0_0_15px_rgba(29,78,216,0.5)]">
              {profile.username?.charAt(0).toUpperCase() ?? 'A'}
            </div>
            <div className="hidden md:block">
              <div className="text-white text-sm font-medium leading-none mb-1">
                {profile.username}
              </div>
              <div className="text-gray-500 text-[10px] uppercase tracking-wider font-mono leading-none">
                ◈ {profile.arc_balance.toLocaleString()} ARC
              </div>
            </div>

            {/* Dropdown placeholder */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-stovest-card border border-stovest-border rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-stovest-border rounded-lg transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}