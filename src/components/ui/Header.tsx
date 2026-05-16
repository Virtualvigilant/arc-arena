'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'

export default function Header({ profile }: { profile: Profile | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navLinks = [
    { href: '/', label: 'Markets' },
    { href: '/wallet', label: 'Wallet' },
  ]

  if (profile?.is_admin) {
    navLinks.push({ href: '/admin', label: 'Admin' })
  }

  return (
    <header className="sticky top-0 z-50 bg-pm-bg/95 backdrop-blur-md border-b border-pm-border">
      {/* Main header bar */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pm-blue to-pm-purple flex items-center justify-center">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <span className="text-pm-text text-lg font-bold tracking-tight hidden sm:block">
                ArcArena
              </span>
            </Link>

            {/* Search */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search markets..."
                  className="w-64 lg:w-80 bg-pm-surface border border-pm-border rounded-lg pl-10 pr-4 py-2 text-sm text-pm-text placeholder:text-pm-text-muted focus:outline-none focus:border-pm-blue/50 focus:ring-1 focus:ring-pm-blue/20 transition-all"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-pm-text-muted bg-pm-bg border border-pm-border rounded px-1.5 py-0.5 font-mono hidden lg:inline-block">/</kbd>
              </div>
            </div>
          </div>

          {/* Center: Nav links */}
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map(link => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-pm-text bg-pm-surface'
                      : 'text-pm-text-secondary hover:text-pm-text hover:bg-pm-surface/50'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right: Profile */}
          <div className="flex items-center gap-3">
            {profile && (
              <div className="flex items-center gap-3 group relative">
                {/* Balance pill */}
                <Link
                  href="/wallet"
                  className="hidden sm:flex items-center gap-1.5 bg-pm-surface border border-pm-border rounded-lg px-3 py-1.5 hover:border-pm-blue/30 transition-colors"
                >
                  <span className="text-pm-blue text-xs font-bold">◈</span>
                  <span className="text-pm-text text-sm font-semibold font-mono">
                    {profile.arc_balance.toLocaleString()}
                  </span>
                </Link>

                {/* Avatar */}
                <button className="w-8 h-8 rounded-full bg-gradient-to-br from-pm-blue to-pm-purple flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:ring-2 hover:ring-pm-blue/30 transition-all">
                  {profile.username?.charAt(0).toUpperCase() ?? 'A'}
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-52 bg-pm-card border border-pm-border rounded-xl p-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl shadow-black/20 z-50">
                  <div className="px-3 py-2 border-b border-pm-border mb-1">
                    <div className="text-sm font-medium text-pm-text">{profile.username}</div>
                    <div className="text-xs text-pm-text-secondary font-mono mt-0.5">
                      ◈ {profile.arc_balance.toLocaleString()} ARC
                    </div>
                  </div>
                  <Link href="/wallet" className="flex items-center gap-2 w-full px-3 py-2 text-sm text-pm-text-secondary hover:text-pm-text hover:bg-pm-surface rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>
                    Wallet
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-pm-red hover:bg-pm-red-soft rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}