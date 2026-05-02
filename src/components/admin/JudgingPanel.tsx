'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ARC = '◈'

export default function JudgingPanel({
  eventId,
  stakes,
  multipliers,
  eventStatus
}: {
  eventId: string
  stakes: any[]
  multipliers: any[]
  eventStatus: string
}) {
  const router = useRouter()

  const [positions, setPositions] = useState<Record<string, number>>(
    Object.fromEntries(
      stakes.map(s => [s.id, s.finishing_position ?? 0])
    )
  )
  const [saving, setSaving] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function setPosition(stakeId: string, position: number) {
    setPositions(prev => ({ ...prev, [stakeId]: position }))
  }

  function getPreviewPayout(stakeAmount: number, position: number) {
    const mult = multipliers.find(m => m.position_rank === position)
    if (!mult || mult.multiplier === 0) return 0
    return Math.floor(stakeAmount * mult.multiplier)
  }

  async function savePositions() {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/events/${eventId}/positions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to save positions')
        setSaving(false)
        return
      }

      setSuccess('Positions saved')
      router.refresh()

    } catch (err) {
      setError('Network error')
    }

    setSaving(false)
  }

  async function processPayouts() {
    if (!confirm('This will credit Arc to all winners immediately. Cannot be undone. Continue?')) return
    setPaying(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/events/${eventId}/payout`, {
        method: 'POST'
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Payout failed')
        setPaying(false)
        return
      }

      setSuccess('Payouts processed — Arc credited to all winners')
      router.refresh()

    } catch (err) {
      setError('Network error')
      setPaying(false)
    }
  }

  const allPositionsSet = stakes.every(s => positions[s.id] > 0)

  return (
    <div className="bg-gray-900 border border-amber-800 rounded-xl p-5 mb-4">
      <h2 className="text-xs text-amber-400 uppercase tracking-wider mb-1">
        Judging panel
      </h2>
      <p className="text-gray-500 text-xs mb-5">
        Assign a finishing position to each competitor then process payouts
      </p>

      <div className="space-y-2 mb-5">
        {stakes.map(stake => {
          const pos = positions[stake.id] ?? 0
          const preview = pos > 0 ? getPreviewPayout(stake.amount, pos) : 0
          const mult = multipliers.find(m => m.position_rank === pos)

          return (
            <div
              key={stake.id}
              className="flex items-center gap-3 bg-gray-800 rounded-xl p-3"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-white">
                  @{stake.profiles?.username ?? 'unknown'}
                </div>
                <div className="font-mono text-xs text-amber-400">
                  {ARC} {stake.amount.toLocaleString()} staked
                </div>
              </div>

              {/* Position input */}
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs">Position</span>
                <input
                  type="number"
                  min={1}
                  max={stakes.length}
                  value={pos || ''}
                  onChange={e => setPosition(stake.id, parseInt(e.target.value) || 0)}
                  className="w-16 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-sm font-mono text-center focus:outline-none focus:border-gray-400"
                  placeholder="—"
                />
              </div>

              {/* Payout preview */}
              <div className="text-right min-w-[100px]">
                {pos > 0 ? (
                  <>
                    <div className={`font-mono text-sm font-medium ${
                      mult?.tier_type === 'winner'
                        ? 'text-green-400'
                        : mult?.tier_type === 'gray'
                          ? 'text-amber-400'
                          : 'text-red-400'
                    }`}>
                      {preview > 0 ? `${ARC} ${preview.toLocaleString()}` : 'Full loss'}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {mult ? `${mult.multiplier}×` : 'no tier'}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-600 text-xs">Unranked</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-950 border border-green-800 rounded-xl px-4 py-3 text-green-400 text-sm mb-4">
          {success}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={savePositions}
          disabled={saving}
          className="bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-2.5 text-sm font-bold transition-colors disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save positions'}
        </button>

        <button
          onClick={processPayouts}
          disabled={paying || !allPositionsSet || eventStatus === 'completed'}
          className="bg-green-700 hover:bg-green-600 text-white rounded-xl py-2.5 text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {paying ? 'Processing...' : 'Process payouts'}
        </button>
      </div>

      {!allPositionsSet && (
        <p className="text-gray-600 text-xs text-center mt-2">
          Assign a position to every competitor before processing payouts
        </p>
      )}
    </div>
  )
}