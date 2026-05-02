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
    { href: '/admin/events/new', label: '+ New event' },
    { href: '/admin/payouts', label: 'Payouts' },
    { href: '/admin/withdrawals', label: 'Withdrawals' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Admin header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-7 h-7 border-2 border-white rounded-md flex items-center justify-center font-mono text-xs font-medium">
                A
              </div>
              <div>
                <div className="font-bold text-sm leading-none">Arc</div>
                <div className="text-gray-500 text-[9px] tracking-widest uppercase leading-none mt-0.5">
                  Admin
                </div>
              </div>
            </Link>

            <nav className="flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs font-mono">
              @{profile.username}
            </span>
            <Link
              href="/"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Platform
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}