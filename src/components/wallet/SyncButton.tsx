'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SyncButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSync() {
    setLoading(true)
    try {
      const res = await fetch('/api/mpesa/query', { method: 'POST' })
      if (res.ok) {
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="text-[10px] text-pm-text-muted hover:text-pm-blue border border-pm-border rounded px-2 py-1 transition-colors disabled:opacity-50 hover:border-pm-blue/50"
    >
      {loading ? 'Syncing...' : '↻ Sync Pending'}
    </button>
  )
}
