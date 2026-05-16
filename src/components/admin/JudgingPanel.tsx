'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EventOutcome } from '@/types'

const ARC = '◈'

export default function JudgingPanel({
  eventId,
  stakes,
  multipliers,
  eventStatus,
  outcomes
}: {
  eventId: string
  stakes: any[]
  multipliers: any[]
  eventStatus: string
  outcomes?: EventOutcome[]
}) {
  const router = useRouter()

  // Determine mode
  const hasOutcomes = (outcomes ?? []).length > 0
  const isPredictionMode = hasOutcomes

  // ─── Competition mode state ──────────────────────────────
  const [positions, setPositions] = useState<Record<string, number>>(
    Object.fromEntries(
      stakes.map(s => [s.id, s.finishing_position ?? 0])
    )
  )
  const [saving, setSaving] = useState(false)

  // ─── Prediction mode state ───────────────────────────────
  const [selectedWinnerOutcome, setSelectedWinnerOutcome] = useState<string | null>(null)

  // ─── Shared state ────────────────────────────────────────
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // ─── Competition mode helpers ────────────────────────────
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

  // ─── Prediction mode helpers ─────────────────────────────
  function getOutcomeStats(outcomeId: string) {
    const outcomeStakes = stakes.filter(s => s.outcome_id === outcomeId)
    const totalAmount = outcomeStakes.reduce((sum: number, s: any) => sum + s.amount, 0)
    return { count: outcomeStakes.length, totalAmount }
  }

  const totalPool = stakes.reduce((sum: number, s: any) => sum + s.amount, 0)
  const rakePercent = 15 // default
  const rake = Math.floor(totalPool * (rakePercent / 100))
  const prizePool = totalPool - rake

  function getWinnerPreview(outcomeId: string) {
    const winners = stakes.filter(s => s.outcome_id === outcomeId)
    const totalWinnerStakes = winners.reduce((sum: number, s: any) => sum + s.amount, 0)

    return winners.map(w => ({
      ...w,
      share: totalWinnerStakes > 0 ? w.amount / totalWinnerStakes : 0,
      payout: totalWinnerStakes > 0 ? Math.floor((w.amount / totalWinnerStakes) * prizePool) : 0
    }))
  }

  async function resolveEvent() {
    if (!selectedWinnerOutcome) return
    const winnerLabel = (outcomes ?? []).find(o => o.id === selectedWinnerOutcome)?.label ?? 'Unknown'
    if (!confirm(`Declare "${winnerLabel}" as the winner? This will pay out winners and close the event. Cannot be undone.`)) return

    setPaying(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/events/${eventId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winning_outcome_id: selectedWinnerOutcome })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Resolution failed')
        setPaying(false)
        return
      }

      setSuccess(`Resolved! "${winnerLabel}" wins. ${data.winners} winner(s) paid, ${data.losers} loser(s).`)
      router.refresh()

    } catch (err) {
      setError('Network error')
      setPaying(false)
    }
  }

  // ─── Competition mode state checks ──────────────────────
  const allPositionsSet = stakes.every(s => positions[s.id] > 0)

  // ═══════════════════════════════════════════════════════════
  // PREDICTION MODE UI
  // ═══════════════════════════════════════════════════════════
  if (isPredictionMode) {
    const selectedPreview = selectedWinnerOutcome ? getWinnerPreview(selectedWinnerOutcome) : []

    return (
      <div className="bg-gray-900 border border-amber-800 rounded-xl p-5 mb-4">
        <h2 className="text-xs text-amber-400 uppercase tracking-wider mb-1">
          Resolve prediction
        </h2>
        <p className="text-gray-500 text-xs mb-5">
          Select the winning outcome to resolve this event and pay out winners
        </p>

        {/* Pool summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total pool</div>
            <div className="font-mono text-sm text-amber-400 font-medium">{ARC} {totalPool.toLocaleString()}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Rake ({rakePercent}%)</div>
            <div className="font-mono text-sm text-gray-400 font-medium">{ARC} {rake.toLocaleString()}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Prize pool</div>
            <div className="font-mono text-sm text-green-400 font-medium">{ARC} {prizePool.toLocaleString()}</div>
          </div>
        </div>

        {/* Outcome selection */}
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-3 font-medium">
          Select winning outcome
        </div>
        <div className={`grid gap-3 mb-5 ${
          (outcomes ?? []).length === 2 ? 'grid-cols-2' :
          (outcomes ?? []).length === 3 ? 'grid-cols-3' :
          'grid-cols-2'
        }`}>
          {(outcomes ?? []).map(outcome => {
            const stats = getOutcomeStats(outcome.id)
            const isSelected = selectedWinnerOutcome === outcome.id
            const sharePercent = totalPool > 0 ? Math.round((stats.totalAmount / totalPool) * 100) : 0

            return (
              <button
                key={outcome.id}
                onClick={() => setSelectedWinnerOutcome(outcome.id)}
                className={`relative border rounded-xl p-4 text-left transition-all ${
                  isSelected
                    ? 'border-green-500 bg-green-950/50 ring-1 ring-green-500/30'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                <div className={`text-sm font-semibold mb-2 ${isSelected ? 'text-green-400' : 'text-white'}`}>
                  {outcome.label}
                </div>

                {/* Stats bar */}
                <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                  <div
                    className={`h-1.5 rounded-full transition-all ${isSelected ? 'bg-green-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.max(sharePercent, 2)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400">
                    {stats.count} stake{stats.count !== 1 ? 's' : ''}
                  </span>
                  <span className="font-mono text-xs text-amber-400">
                    {ARC} {stats.totalAmount.toLocaleString()} ({sharePercent}%)
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Winner preview table */}
        {selectedWinnerOutcome && selectedPreview.length > 0 && (
          <div className="bg-gray-800 rounded-xl overflow-hidden mb-5">
            <div className="px-4 py-3 border-b border-gray-700">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                Payout preview — {selectedPreview.length} winner{selectedPreview.length !== 1 ? 's' : ''}
              </span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  {['User', 'Staked', 'Share', 'Payout'].map(h => (
                    <th key={h} className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-4 py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedPreview.map((w: any) => (
                  <tr key={w.id} className="border-b border-gray-700 last:border-0">
                    <td className="px-4 py-2.5 text-sm text-white">
                      @{w.profiles?.username ?? 'unknown'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-amber-400">
                      {ARC} {w.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-400">
                      {(w.share * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-green-400 font-medium">
                      {ARC} {w.payout.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedWinnerOutcome && selectedPreview.length === 0 && (
          <div className="bg-gray-800 rounded-xl p-4 text-center text-gray-500 text-sm mb-5">
            No one picked this outcome — all stakes become rake
          </div>
        )}

        {/* Error / Success */}
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

        {/* Resolve button */}
        <button
          onClick={resolveEvent}
          disabled={!selectedWinnerOutcome || paying || eventStatus === 'completed'}
          className="w-full bg-green-700 hover:bg-green-600 text-white rounded-xl py-3 text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {paying ? 'Resolving...' : selectedWinnerOutcome ? 'Resolve & pay winners' : 'Select a winning outcome'}
        </button>

        {stakes.length === 0 && (
          <p className="text-gray-600 text-xs text-center mt-2">
            No stakes have been placed on this event
          </p>
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // COMPETITION MODE UI (existing)
  // ═══════════════════════════════════════════════════════════
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