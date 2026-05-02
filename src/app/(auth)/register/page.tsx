'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          username: form.username.toLowerCase().replace(/\s/g, '_'),
        }
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Update phone after signup
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ phone: form.phone })
        .eq('id', user.id)
    }

    router.push('/markets')
    router.refresh()
  }

  const fields = [
    { name: 'fullName', label: 'Full name', type: 'text', placeholder: 'Ephrem Orodi' },
    { name: 'username', label: 'Username', type: 'text', placeholder: 'ephrem' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { name: 'phone', label: 'M-Pesa number', type: 'tel', placeholder: '0712345678' },
    { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
  ]

  return (
    <div className="bg-stovest-card border border-stovest-border rounded-2xl p-8">
      <h1 className="text-white font-bold text-2xl mb-1 tracking-tight">
        Join the arena
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Create your Arc account — 1 KES = 1 Arc
      </p>

      <form onSubmit={handleRegister} className="space-y-4">
        {fields.map(field => (
          <div key={field.name}>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              {field.label}
            </label>
            <input
              type={field.type}
              name={field.name}
              value={form[field.name as keyof typeof form]}
              onChange={handleChange}
              className="w-full bg-[#181C2A] border border-[#23293D] rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-stovest-blue/50 transition-colors placeholder-gray-600"
              placeholder={field.placeholder}
              required
            />
          </div>
        ))}

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
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-gray-600 text-sm text-center mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-stovest-blue-light hover:text-white transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}