'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArcEvent, EventMultiplier, EventOutcome, StakeBand, BAND_RANGES } from '@/types'

const ARC = '◈'

const BANDS: { key: StakeBand; label: string }[] = [
  { key: 'bronze', label: 'Bronze' },
  { key: 'silver', label: 'Silver' },
  { key: 'gold', label: 'Gold' },
  { key: 'elite', label: 'Elite' },
]

function getOutcomeButtonClass(label: string): string {
  const lower = label.toLowerCase()
  if (lower === 'yes' || lower === 'up' || lower === 'win' || lower === 'over') {
    return 'outcome-btn outcome-btn-yes'
  }
  if (lower === 'no' || lower === 'down' || lower === 'lose' || lower === 'under') {
    return 'outcome-btn outcome-btn-no'
  }
  return 'outcome-btn outcome-btn-neutral'
}

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
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | null>(null)

  const availableBands = BANDS.filter(b =>
    event.active_bands.includes(b.key)
  )

  const directOutcomes = (event.outcomes ?? []).filter((o: EventOutcome) => !o.sub_market_id)
  const hasOutcomes = directOutcomes.length > 0

  const amt = parseInt(amount) || 0
  const range = band ? BAND_RANGES[band] : null

  const isValidAmount = band && amt >= (range?.min ?? 0) && amt <= (range?.max ?? 0) && amt <= arcBalance
  const isInsufficient = amt > arcBalance
  const needsOutcome = hasOutcomes && !selectedOutcomeId

  const payoutPreview = multipliers.map(m => ({
    ...m,
    payout: Math.floor(amt * m.multiplier)
  }))

  async function handleStake() {
    if (!band || !isValidAmount) return
    if (hasOutcomes && !selectedOutcomeId) return
    
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/events/${event.id}/stake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: amt, 
          band,
          outcome_id: selectedOutcomeId 
        })
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
      <div className="bg-pm-card border border-pm-border rounded-xl p-6 text-center text-pm-text-muted text-sm">
        This market is not open for staking yet. Check back soon.
      </div>
    )
  }

  return (
    <div className="bg-pm-card border border-pm-border rounded-xl p-6">
      <h2 className="font-bold text-pm-text text-lg mb-1 tracking-tight">
        {hasOutcomes ? 'Place your bet' : 'Place your stake'}
      </h2>
      <p className="text-pm-text-secondary text-sm mb-6">
        Your balance — {ARC} {arcBalance.toLocaleString()} Arc
      </p>

      {/* Outcome selection (for prediction markets) */}
      {hasOutcomes && (
        <>
          <div className="text-[10px] text-pm-text-muted uppercase tracking-wider mb-3 font-medium">
            Select outcome
          </div>
          <div className={`grid gap-2 mb-6 ${
            directOutcomes.length === 2 ? 'grid-cols-2' :
            directOutcomes.length === 3 ? 'grid-cols-3' :
            'grid-cols-2'
          }`}>
            {directOutcomes.map((outcome: EventOutcome) => {
              const isSelected = selectedOutcomeId === outcome.id
              return (
                <button
                  key={outcome.id}
                  onClick={() => setSelectedOutcomeId(outcome.id)}
                  className={`relative border rounded-xl p-4 text-center transition-all ${
                    isSelected
                      ? 'border-pm-blue bg-pm-blue-soft ring-1 ring-pm-blue/30'
                      : 'border-pm-border bg-pm-surface hover:border-pm-text-muted'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${isSelected ? 'text-pm-blue' : 'text-pm-text'}`}>
                    {outcome.label}
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-4 h-4 text-pm-blue" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Band selection */}
      <div className="text-[10px] text-pm-text-muted uppercase tracking-wider mb-3 font-medium">
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
                  ? 'border-pm-blue bg-pm-blue-soft'
                  : 'border-pm-border hover:border-pm-text-muted bg-pm-surface'
              }`}
            >
              <div className={`text-sm font-semibold mb-1 ${isSelected ? 'text-pm-blue' : 'text-pm-text'}`}>
                {b.label}
              </div>
              <div className={`font-mono text-[10px] ${isSelected ? 'text-pm-blue/70' : 'text-pm-text-muted'}`}>
                {r.min}–{r.max} Arc
              </div>
            </button>
          )
        })}
      </div>

      {/* Amount input */}
      {band && (
        <>
          <div className="text-[10px] text-pm-text-muted uppercase tracking-wider mb-3 font-medium">
            Enter amount ({range?.min}–{range?.max} Arc)
          </div>
          <div className="relative mb-6">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pm-blue font-mono text-sm">
              {ARC}
            </span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min={range?.min}
              max={Math.min(range?.max ?? 0, arcBalance)}
              step={1}
              className="w-full bg-pm-surface border border-pm-border rounded-xl pl-10 pr-4 py-3.5 font-mono text-lg text-pm-text focus:outline-none focus:border-pm-blue/50 focus:ring-1 focus:ring-pm-blue/20 transition-all"
              placeholder={String(range?.min ?? 0)}
            />
          </div>

          {/* Payout preview (competition mode) */}
          {!hasOutcomes && amt >= (range?.min ?? 0) && amt <= (range?.max ?? 0) && (
            <div className="bg-pm-surface border border-pm-border rounded-xl p-4 mb-6">
              <div className="text-[10px] text-pm-text-muted uppercase tracking-wider mb-3 font-medium">
                Payout if you finish at
              </div>
              <div className="space-y-2">
                {payoutPreview.map(p => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-pm-text-secondary">
                      {p.position_label} ({p.multiplier}×)
                    </span>
                    <span className={`font-mono font-medium ${
                      p.tier_type === 'winner'
                        ? 'text-pm-green'
                        : p.tier_type === 'gray'
                          ? 'text-pm-text-muted'
                          : 'text-pm-red'
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
            <div className="bg-pm-red-soft border border-pm-red/30 rounded-xl px-4 py-3 text-pm-red text-sm mb-4">
              {error}
            </div>
          )}

          {isInsufficient && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-400 text-sm mb-4">
              Insufficient Arc — <a href="/wallet" className="underline font-medium">deposit more</a>
            </div>
          )}

          {/* Confirm */}
          <button
            onClick={handleStake}
            disabled={!isValidAmount || loading || needsOutcome}
            className="w-full bg-pm-blue text-white rounded-xl py-3.5 font-semibold text-sm tracking-wide hover:bg-pm-blue/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-pm-blue/20"
          >
            {loading
              ? 'Confirming...'
              : needsOutcome
                ? 'Select an outcome first'
                : isValidAmount
                  ? `Confirm — stake ${ARC} ${amt.toLocaleString()} Arc`
                  : 'Enter a valid amount'}
          </button>
        </>
      )}
    </div>
  )
}