'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/markets')
    router.refresh()
  }

  return (
    <div className="bg-stovest-card border border-stovest-border rounded-2xl p-8">
      <h1 className="text-white font-bold text-2xl mb-1 tracking-tight">
        Enter the arena
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Sign in to your Arc account
      </p>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-[#181C2A] border border-[#23293D] rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-stovest-blue/50 transition-colors placeholder-gray-600"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-[#181C2A] border border-[#23293D] rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-stovest-blue/50 transition-colors placeholder-gray-600"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="bg-red-950 border border-red-900 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-stovest-blue text-white rounded-xl py-3 text-sm font-bold tracking-wide hover:bg-stovest-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-[0_4px_20px_-4px_rgba(29,78,216,0.5)]"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="text-gray-600 text-sm text-center mt-6">
        No account?{' '}
        <Link href="/register" className="text-stovest-blue-light hover:text-white transition-colors">
          Join the arena
        </Link>
      </p>
    </div>
  )
}