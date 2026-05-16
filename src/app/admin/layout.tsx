import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, username')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  const navLinks = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/events', label: 'Events' },
    { href: '/admin/events/new', label: '+ New market' },
    { href: '/admin/payouts', label: 'Payouts' },
    { href: '/admin/withdrawals', label: 'Withdrawals' },
  ]

  return (
    <div className="min-h-screen bg-pm-bg text-pm-text">

      {/* Admin header */}
      <header className="border-b border-pm-border bg-pm-surface sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pm-purple to-pm-blue flex items-center justify-center">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <div>
                <div className="font-bold text-sm leading-none text-pm-text">Arc</div>
                <div className="text-pm-text-muted text-[9px] tracking-widest uppercase leading-none mt-0.5">
                  Admin
                </div>
              </div>
            </Link>

            <nav className="flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-pm-text-secondary hover:text-pm-text hover:bg-pm-card transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-pm-text-secondary text-xs font-mono">
              @{profile.username}
            </span>
            <Link
              href="/"
              className="text-xs text-pm-text-muted hover:text-pm-text transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Platform
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  )
}