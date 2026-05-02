'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TRANSITIONS: Record<string, { next: string; label: string; color: string }> = {
  upcoming: { next: 'live', label: 'Open registration & go live', color: 'bg-green-600 hover:bg-green-500' },
  live: { next: 'judging', label: 'Close registration — begin judging', color: 'bg-amber-600 hover:bg-amber-500' },
  judging: { next: 'completed', label: 'Process payouts and complete', color: 'bg-blue-600 hover:bg-blue-500' },
  completed: { next: '', label: 'Event completed', color: 'bg-gray-700 cursor-not-allowed' },
}

export default function EventStatusControl({
  eventId,
  currentStatus
}: {
  eventId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const transition = TRANSITIONS[currentStatus]

  async function handleTransition() {
    if (!transition?.next) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/events/${eventId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: transition.next })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to update status')
        setLoading(false)
        return
      }

      router.refresh()

    } catch (err) {
      setError('Network error')
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-4">
        Event status
      </h2>

      <div className="flex items-center gap-3 mb-5">
        {['upcoming', 'live', 'judging', 'completed'].map((s, i, arr) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              currentStatus === s
                ? 'bg-white'
                : arr.indexOf(currentStatus) > i
                  ? 'bg-gray-600'
                  : 'bg-gray-700'
            }`} />
            <span className={`text-xs capitalize ${
              currentStatus === s ? 'text-white font-medium' : 'text-gray-600'
            }`}>
              {s}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="text-red-400 text-xs mb-3">{error}</div>
      )}

      {transition?.next && (
        <button
          onClick={handleTransition}
          disabled={loading || !transition.next}
          className={`w-full ${transition.color} text-white rounded-xl py-2.5 text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {loading ? 'Updating...' : transition.label}
        </button>
      )}

      {currentStatus === 'completed' && (
        <div className="text-center text-gray-600 text-sm py-2">
          This event has been completed and payouts processed
        </div>
      )}
    </div>
  )
}