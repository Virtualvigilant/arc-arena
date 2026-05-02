'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArcEvent, EventMultiplier, StakeBand, BAND_RANGES } from '@/types'

const ARC = '◈'

const BANDS: { key: StakeBand; label: string }[] = [
  { key: 'bronze', label: 'Bronze' },
  { key: 'silver', label: 'Silver' },
  { key: 'gold', label: 'Gold' },
  { key: 'elite', label: 'Elite' },
]

export default function StakePanel({
  event,
  arcBalance,
  multipliers
}: {
  event: ArcEvent
  arcBalance: number
  multipliers: EventMultiplier[]
}) {
  const router = useRouter()

  const [band, setBand] = useState<StakeBand | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableBands = BANDS.filter(b =>
    event.active_bands.includes(b.key)
  )

  const amt = parseInt(amount) || 0
  const range = band ? BAND_RANGES[band] : null

  const isValidAmount = band && amt >= (range?.min ?? 0) && amt <= (range?.max ?? 0) && amt <= arcBalance
  const isInsufficient = amt > arcBalance

  const payoutPreview = multipliers.map(m => ({
    ...m,
    payout: Math.floor(amt * m.multiplier)
  }))

  async function handleStake() {
    if (!band || !isValidAmount) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/events/${event.id}/stake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, band })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      router.refresh()

    } catch (err) {
      setError('Network error — try again')
      setLoading(false)
    }
  }

  if (event.status !== 'live') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center text-gray-400 text-sm">
        Registration is not open yet. Check back soon.
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h2 className="font-bold text-gray-900 text-lg mb-1 tracking-tight">
        Place your stake
      </h2>
      <p className="text-gray-400 text-sm mb-6">
        Your balance — {ARC} {arcBalance.toLocaleString()} Arc
      </p>

      {/* Band selection */}
      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-3">
        Select stake band
      </div>
      <div className="grid grid-cols-4 gap-2 mb-6">
        {availableBands.map(b => {
          const r = BAND_RANGES[b.key]
          const isSelected = band === b.key
          return (
            <button
              key={b.key}
              onClick={() => {
                setBand(b.key)
                setAmount(String(r.min))
              }}
              className={`border rounded-xl p-3 text-center transition-all ${
                isSelected
                  ? 'border-arc-gold bg-amber-50'
                  : 'border-gray-100 hover:border-gray-200 bg-gray-50'
              }`}
            >
              <div className={`text-sm font-bold mb-1 ${isSelected ? 'text-amber-800' : 'text-gray-700'}`}>
                {b.label}
              </div>
              <div className={`font-mono text-[10px] ${isSelected ? 'text-amber-600' : 'text-gray-400'}`}>
                {r.min}–{r.max} Arc
              </div>
            </button>
          )
        })}
      </div>

      {/* Amount input */}
      {band && (
        <>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-3">
            Enter amount ({range?.min}–{range?.max} Arc)
          </div>
          <div className="relative mb-6">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-arc-gold font-mono text-sm">
              {ARC}
            </span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min={range?.min}
              max={Math.min(range?.max ?? 0, arcBalance)}
              step={1}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3.5 font-mono text-lg text-gray-900 focus:outline-none focus:border-gray-400 transition-colors"
              placeholder={String(range?.min ?? 0)}
            />
          </div>

          {/* Payout preview */}
          {amt >= (range?.min ?? 0) && amt <= (range?.max ?? 0) && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-3">
                Payout if you finish at
              </div>
              <div className="space-y-2">
                {payoutPreview.map(p => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-500">
                      {p.position_label} ({p.multiplier}×)
                    </span>
                    <span className={`font-mono font-medium ${
                      p.tier_type === 'winner'
                        ? 'text-green-700'
                        : p.tier_type === 'gray'
                          ? 'text-gray-400'
                          : 'text-red-400'
                    }`}>
                      {p.multiplier > 0
                        ? `${ARC} ${p.payout.toLocaleString()} Arc`
                        : '0 — full loss'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm mb-4">
              {error}
            </div>
          )}

          {isInsufficient && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-amber-700 text-sm mb-4">
              Insufficient Arc — <a href="/wallet" className="underline font-medium">deposit more</a>
            </div>
          )}

          {/* Confirm */}
          <button
            onClick={handleStake}
            disabled={!isValidAmount || loading}
            className="w-full bg-gray-900 text-white rounded-xl py-3.5 font-bold text-sm tracking-wide hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Confirming...'
              : isValidAmount
                ? `Confirm — stake ${ARC} ${amt.toLocaleString()} Arc`
                : 'Enter a valid amount'}
          </button>
        </>
      )}
    </div>
  )
}