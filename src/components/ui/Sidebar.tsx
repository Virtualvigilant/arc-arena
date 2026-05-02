'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Profile } from '@/types'

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()

  const navLinks = [
    { href: '/', label: 'Overview', icon: '◈' },
    { href: '/markets', label: 'Markets', icon: '◱' },
    { href: '/wallet', label: 'Wallet', icon: '◓' },
  ]

  if (profile?.is_admin) {
    navLinks.push({ href: '/admin', label: 'Admin Panel', icon: '◬' })
  }

  const supportLinks = [
    { href: '/community', label: 'Community', icon: '◭' },
    { href: '/support', label: 'Help & Support', icon: '◎' },
  ]

  return (
    <aside className="w-64 flex-shrink-0 bg-stovest-bg border-r border-stovest-border flex flex-col h-full z-40 relative">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2.5 mb-10">
          <div className="text-white text-xl font-bold font-syne tracking-tight">
            Arc<span className="text-gray-400 font-normal">Arena</span>
          </div>
        </Link>

        {profile && (
          <div className="mb-10">
            <h2 className="text-white text-lg mb-1 leading-tight select-none">
              Welcome, <span className="font-bold">{profile.username}</span>
            </h2>
            <p className="text-gray-500 text-[10px] uppercase tracking-wider select-none">
              Here's your arena overview
            </p>
          </div>
        )}

        {/* Main Menu */}
        <div className="mb-8">
          <h3 className="text-gray-500 text-[10px] uppercase tracking-wider mb-4 px-3 select-none">
            Main Menu
          </h3>
          <nav className="space-y-1">
            {navLinks.map(link => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-stovest-blue text-white shadow-[0_4px_20px_-4px_rgba(29,78,216,0.5)]'
                      : 'text-gray-400 hover:text-white hover:bg-stovest-border'
                  }`}
                >
                  <span className={`text-base w-5 text-center ${isActive ? 'text-white' : 'text-gray-500'}`}>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-gray-500 text-[10px] uppercase tracking-wider mb-4 px-3 select-none">
            Support
          </h3>
          <nav className="space-y-1">
            {supportLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-stovest-border transition-all"
              >
                <span className="text-gray-500 text-base w-5 text-center">
                  {link.icon}
                </span>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

    </aside>
  )
}
