'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DOMAINS = ['Tech', 'Sports', 'Politics', 'Crypto', 'Gaming', 'Finance', 'Culture', 'Entertainment', 'Academic', 'Other']
const BANDS = ['bronze', 'silver', 'gold', 'elite']

const OUTCOME_PRESETS = [
  { label: 'Yes / No', outcomes: ['Yes', 'No'] },
  { label: 'Win / Draw / Lose', outcomes: ['Win', 'Draw', 'Lose'] },
  { label: 'Up / Down', outcomes: ['Up', 'Down'] },
  { label: 'Over / Under', outcomes: ['Over', 'Under'] },
  { label: 'Custom', outcomes: [] },
]

const DEFAULT_MULTIPLIERS = [
  { position_label: '1st place', position_rank: 1, multiplier: 4.0, tier_type: 'winner' },
  { position_label: '2nd place', position_rank: 2, multiplier: 2.5, tier_type: 'winner' },
  { position_label: '3rd place', position_rank: 3, multiplier: 1.5, tier_type: 'winner' },
  { position_label: '4th place', position_rank: 4, multiplier: 0.75, tier_type: 'gray' },
  { position_label: '5th place', position_rank: 5, multiplier: 0.50, tier_type: 'gray' },
]

interface SubMarketConfig {
  label: string
  outcomes: string[]
}

export default function NewEventPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    title: '',
    description: '',
    domain: 'Tech',
    judging_criteria: '',
    min_competitors: 6,
    max_competitors: 16,
    rake_percent: 15,
    competition_start: '',
    competition_end: '',
    registration_end: '',
    active_bands: ['bronze', 'silver'] as string[],
  })

  const [multipliers, setMultipliers] = useState(DEFAULT_MULTIPLIERS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Outcome configuration
  const [eventMode, setEventMode] = useState<'competition' | 'prediction'>('prediction')
  const [selectedPreset, setSelectedPreset] = useState<string>('Yes / No')
  const [outcomes, setOutcomes] = useState<string[]>(['Yes', 'No'])
  const [hasSubMarkets, setHasSubMarkets] = useState(false)
  const [subMarkets, setSubMarkets] = useState<SubMarketConfig[]>([
    { label: '', outcomes: ['Yes', 'No'] }
  ])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function toggleBand(band: string) {
    setForm(prev => ({
      ...prev,
      active_bands: prev.active_bands.includes(band)
        ? prev.active_bands.filter(b => b !== band)
        : [...prev.active_bands, band]
    }))
  }

  function updateMultiplier(index: number, field: string, value: string) {
    setMultipliers(prev =>
      prev.map((m, i) =>
        i === index ? { ...m, [field]: field === 'multiplier' ? parseFloat(value) : value } : m
      )
    )
  }

  function selectPreset(presetLabel: string) {
    setSelectedPreset(presetLabel)
    const preset = OUTCOME_PRESETS.find(p => p.label === presetLabel)
    if (preset && preset.outcomes.length > 0) {
      setOutcomes([...preset.outcomes])
    }
  }

  function addOutcome() {
    setOutcomes(prev => [...prev, ''])
  }

  function removeOutcome(index: number) {
    setOutcomes(prev => prev.filter((_, i) => i !== index))
  }

  function updateOutcome(index: number, value: string) {
    setOutcomes(prev => prev.map((o, i) => i === index ? value : o))
  }

  function addSubMarket() {
    setSubMarkets(prev => [...prev, { label: '', outcomes: ['Yes', 'No'] }])
  }

  function removeSubMarket(index: number) {
    setSubMarkets(prev => prev.filter((_, i) => i !== index))
  }

  function updateSubMarketLabel(index: number, label: string) {
    setSubMarkets(prev => prev.map((sm, i) => i === index ? { ...sm, label } : sm))
  }

  function updateSubMarketOutcome(smIndex: number, oIndex: number, value: string) {
    setSubMarkets(prev => prev.map((sm, i) =>
      i === smIndex ? { ...sm, outcomes: sm.outcomes.map((o, j) => j === oIndex ? value : o) } : sm
    ))
  }

  function addSubMarketOutcome(smIndex: number) {
    setSubMarkets(prev => prev.map((sm, i) =>
      i === smIndex ? { ...sm, outcomes: [...sm.outcomes, ''] } : sm
    ))
  }

  function removeSubMarketOutcome(smIndex: number, oIndex: number) {
    setSubMarkets(prev => prev.map((sm, i) =>
      i === smIndex ? { ...sm, outcomes: sm.outcomes.filter((_, j) => j !== oIndex) } : sm
    ))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload: any = {
        ...form,
        multipliers: eventMode === 'competition' ? multipliers : [],
      }

      // Add outcomes for prediction mode
      if (eventMode === 'prediction') {
        if (hasSubMarkets) {
          payload.sub_markets = subMarkets
            .filter(sm => sm.label.trim())
            .map((sm, i) => ({
              label: sm.label.trim(),
              sort_order: i,
              outcomes: sm.outcomes
                .filter(o => o.trim())
                .map((o, j) => ({ label: o.trim(), sort_order: j }))
            }))
        } else {
          payload.outcomes = outcomes
            .filter(o => o.trim())
            .map((o, i) => ({ label: o.trim(), sort_order: i }))
        }
      }

      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create event')
        setLoading(false)
        return
      }

      router.push(`/admin/events/${data.eventId}`)

    } catch (err) {
      setError('Network error — try again')
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-pm-surface border border-pm-border rounded-lg px-4 py-3 text-pm-text text-sm focus:outline-none focus:border-pm-blue/50 focus:ring-1 focus:ring-pm-blue/20 transition-all placeholder:text-pm-text-muted"
  const labelClass = "block text-[11px] text-pm-text-secondary uppercase tracking-wider mb-2 font-medium"

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-pm-text tracking-tight">Create market</h1>
        <p className="text-pm-text-secondary text-sm mt-1">
          Design a new prediction market or competition
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Event Mode Toggle */}
        <div className="bg-pm-card border border-pm-border rounded-xl p-5">
          <h2 className="text-xs text-pm-text-secondary uppercase tracking-wider mb-4 font-medium">
            Market type
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setEventMode('prediction')}
              className={`border rounded-xl p-4 text-left transition-all ${
                eventMode === 'prediction'
                  ? 'border-pm-blue bg-pm-blue-soft'
                  : 'border-pm-border bg-pm-surface hover:border-pm-text-muted'
              }`}
            >
              <div className={`text-sm font-semibold mb-1 ${eventMode === 'prediction' ? 'text-pm-blue' : 'text-pm-text'}`}>
                📊 Prediction Market
              </div>
              <div className="text-xs text-pm-text-muted">
                Users bet on outcomes (Yes/No, Win/Draw/Lose, etc.)
              </div>
            </button>
            <button
              type="button"
              onClick={() => setEventMode('competition')}
              className={`border rounded-xl p-4 text-left transition-all ${
                eventMode === 'competition'
                  ? 'border-pm-blue bg-pm-blue-soft'
                  : 'border-pm-border bg-pm-surface hover:border-pm-text-muted'
              }`}
            >
              <div className={`text-sm font-semibold mb-1 ${eventMode === 'competition' ? 'text-pm-blue' : 'text-pm-text'}`}>
                🏆 Competition
              </div>
              <div className="text-xs text-pm-text-muted">
                Users compete, ranked by position with multiplier payouts
              </div>
            </button>
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-pm-card border border-pm-border rounded-xl p-5 space-y-4">
          <h2 className="text-xs text-pm-text-secondary uppercase tracking-wider font-medium">
            Basic info
          </h2>

          <div>
            <label className={labelClass}>Market title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className={inputClass}
              placeholder={eventMode === 'prediction' ? 'Will Bitcoin reach $100k by December?' : '72-hour build challenge #002'}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className={`${inputClass} resize-none h-24`}
              placeholder="Describe the market rules and resolution criteria"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <select
                name="domain"
                value={form.domain}
                onChange={handleChange}
                className={inputClass}
              >
                {DOMAINS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Rake percent</label>
              <input
                name="rake_percent"
                type="number"
                value={form.rake_percent}
                onChange={handleChange}
                className={inputClass}
                min={5}
                max={30}
                step={0.5}
              />
            </div>
          </div>
        </div>

        {/* Outcome Keys (Prediction mode) */}
        {eventMode === 'prediction' && (
          <div className="bg-pm-card border border-pm-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs text-pm-text-secondary uppercase tracking-wider font-medium">
                Outcome keys
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-pm-text-muted">Sub-markets</span>
                <button
                  type="button"
                  onClick={() => setHasSubMarkets(!hasSubMarkets)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${
                    hasSubMarkets ? 'bg-pm-blue' : 'bg-pm-border'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    hasSubMarkets ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
            </div>

            {!hasSubMarkets ? (
              <>
                {/* Preset selector */}
                <div className="flex gap-2 flex-wrap">
                  {OUTCOME_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => selectPreset(preset.label)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selectedPreset === preset.label
                          ? 'border-pm-blue bg-pm-blue-soft text-pm-blue'
                          : 'border-pm-border text-pm-text-secondary hover:border-pm-text-muted'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Outcome inputs */}
                <div className="space-y-2">
                  {outcomes.map((outcome, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-xs text-pm-text-muted font-mono w-6 text-center">{i + 1}</span>
                      <input
                        value={outcome}
                        onChange={e => updateOutcome(i, e.target.value)}
                        className={`${inputClass} flex-1`}
                        placeholder={`Outcome ${i + 1}`}
                      />
                      {outcomes.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOutcome(i)}
                          className="p-2 text-pm-text-muted hover:text-pm-red transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addOutcome}
                    className="text-xs text-pm-blue hover:text-pm-blue/80 transition-colors mt-2 font-medium"
                  >
                    + Add outcome
                  </button>
                </div>

                {/* Preview */}
                {outcomes.filter(o => o.trim()).length >= 2 && (
                  <div className="bg-pm-surface border border-pm-border rounded-lg p-4">
                    <div className="text-[10px] text-pm-text-muted uppercase tracking-wider mb-3 font-medium">Card preview</div>
                    <div className="bg-pm-card border border-pm-border rounded-lg p-3">
                      <div className="text-sm font-semibold text-pm-text mb-3 leading-snug">
                        {form.title || 'Your market title'}
                      </div>
                      <div className={`grid gap-2 ${
                        outcomes.filter(o => o.trim()).length === 2 ? 'grid-cols-2' :
                        outcomes.filter(o => o.trim()).length === 3 ? 'grid-cols-3' :
                        'grid-cols-2'
                      }`}>
                        {outcomes.filter(o => o.trim()).map((outcome, i) => {
                          const lower = outcome.toLowerCase()
                          const btnClass = (lower === 'yes' || lower === 'up' || lower === 'win' || lower === 'over')
                            ? 'outcome-btn outcome-btn-yes'
                            : (lower === 'no' || lower === 'down' || lower === 'lose' || lower === 'under')
                              ? 'outcome-btn outcome-btn-no'
                              : 'outcome-btn outcome-btn-neutral'
                          return (
                            <div key={i} className={`${btnClass} text-center text-xs`}>
                              {outcome}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Sub-market configuration */
              <div className="space-y-4">
                <p className="text-xs text-pm-text-muted">
                  Sub-markets allow multiple related questions within one card (e.g., "Will it happen by December?" and "Will it happen by June?")
                </p>

                {subMarkets.map((sm, smIdx) => (
                  <div key={smIdx} className="bg-pm-surface border border-pm-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-pm-text-secondary font-medium">Sub-market {smIdx + 1}</span>
                      {subMarkets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubMarket(smIdx)}
                          className="text-xs text-pm-text-muted hover:text-pm-red transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      value={sm.label}
                      onChange={e => updateSubMarketLabel(smIdx, e.target.value)}
                      className={inputClass}
                      placeholder="e.g., December 31, Team A, Player Name"
                    />

                    <div className="space-y-2">
                      <div className="text-[10px] text-pm-text-muted uppercase tracking-wider font-medium">Outcome buttons</div>
                      {sm.outcomes.map((o, oIdx) => (
                        <div key={oIdx} className="flex gap-2 items-center">
                          <input
                            value={o}
                            onChange={e => updateSubMarketOutcome(smIdx, oIdx, e.target.value)}
                            className={`${inputClass} flex-1`}
                            placeholder={`Outcome ${oIdx + 1}`}
                          />
                          {sm.outcomes.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeSubMarketOutcome(smIdx, oIdx)}
                              className="p-1 text-pm-text-muted hover:text-pm-red transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addSubMarketOutcome(smIdx)}
                        className="text-[11px] text-pm-blue hover:text-pm-blue/80 transition-colors font-medium"
                      >
                        + Add outcome
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addSubMarket}
                  className="text-xs text-pm-blue hover:text-pm-blue/80 transition-colors font-medium"
                >
                  + Add sub-market
                </button>
              </div>
            )}
          </div>
        )}

        {/* Competitors + timeline */}
        <div className="bg-pm-card border border-pm-border rounded-xl p-5 space-y-4">
          <h2 className="text-xs text-pm-text-secondary uppercase tracking-wider font-medium">
            {eventMode === 'competition' ? 'Competitors and timeline' : 'Capacity and timeline'}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{eventMode === 'competition' ? 'Min competitors' : 'Min participants'}</label>
              <input
                name="min_competitors"
                type="number"
                value={form.min_competitors}
                onChange={handleChange}
                className={inputClass}
                min={2}
              />
            </div>
            <div>
              <label className={labelClass}>{eventMode === 'competition' ? 'Max competitors' : 'Max participants'}</label>
              <input
                name="max_competitors"
                type="number"
                value={form.max_competitors}
                onChange={handleChange}
                className={inputClass}
                min={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { name: 'registration_end', label: 'Registration closes' },
              { name: 'competition_start', label: 'Market opens' },
              { name: 'competition_end', label: 'Market closes' },
            ].map(field => (
              <div key={field.name}>
                <label className={labelClass}>{field.label}</label>
                <input
                  name={field.name}
                  type="datetime-local"
                  value={form[field.name as keyof typeof form] as string}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Stake bands */}
        <div className="bg-pm-card border border-pm-border rounded-xl p-5">
          <h2 className="text-xs text-pm-text-secondary uppercase tracking-wider mb-4 font-medium">
            Active stake bands
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {BANDS.map(band => {
              const ranges: Record<string, string> = {
                bronze: '10–99 Arc',
                silver: '100–199 Arc',
                gold: '200–499 Arc',
                elite: '500+ Arc'
              }
              const active = form.active_bands.includes(band)
              return (
                <button
                  key={band}
                  type="button"
                  onClick={() => toggleBand(band)}
                  className={`border rounded-xl p-3 text-center transition-all ${
                    active
                      ? 'border-pm-blue bg-pm-blue-soft'
                      : 'border-pm-border bg-pm-surface opacity-50'
                  }`}
                >
                  <div className={`text-sm font-semibold capitalize mb-1 ${active ? 'text-pm-blue' : 'text-pm-text-muted'}`}>
                    {band}
                  </div>
                  <div className={`font-mono text-[10px] ${active ? 'text-pm-blue/70' : 'text-pm-text-muted'}`}>
                    {ranges[band]}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Multipliers (Competition mode only) */}
        {eventMode === 'competition' && (
          <div className="bg-pm-card border border-pm-border rounded-xl p-5">
            <h2 className="text-xs text-pm-text-secondary uppercase tracking-wider mb-4 font-medium">
              Payout multipliers
            </h2>
            <div className="space-y-2">
              {multipliers.map((m, i) => (
                <div key={i} className="grid grid-cols-4 gap-3 items-center">
                  <input
                    value={m.position_label}
                    onChange={e => updateMultiplier(i, 'position_label', e.target.value)}
                    className={`${inputClass} col-span-2`}
                    placeholder="Position label"
                  />
                  <input
                    type="number"
                    value={m.multiplier}
                    onChange={e => updateMultiplier(i, 'multiplier', e.target.value)}
                    className={inputClass}
                    step={0.25}
                    min={0}
                    placeholder="Multiplier"
                  />
                  <select
                    value={m.tier_type}
                    onChange={e => updateMultiplier(i, 'tier_type', e.target.value)}
                    className={inputClass}
                  >
                    <option value="winner">Winner</option>
                    <option value="gray">Gray line</option>
                    <option value="loss">Loss</option>
                  </select>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setMultipliers(prev => [
                  ...prev,
                  {
                    position_label: `${prev.length + 1}th place`,
                    position_rank: prev.length + 1,
                    multiplier: 0,
                    tier_type: 'loss'
                  }
                ])}
                className="text-xs text-pm-blue hover:text-pm-blue/80 transition-colors mt-2 font-medium"
              >
                + Add tier
              </button>
            </div>
          </div>
        )}

        {/* Judging criteria */}
        <div className="bg-pm-card border border-pm-border rounded-xl p-5">
          <h2 className="text-xs text-pm-text-secondary uppercase tracking-wider mb-3 font-medium">
            {eventMode === 'competition' ? 'Judging criteria' : 'Resolution criteria'}
          </h2>
          <textarea
            name="judging_criteria"
            value={form.judging_criteria}
            onChange={handleChange}
            className={`${inputClass} resize-none h-20`}
            placeholder={eventMode === 'competition'
              ? 'Functionality · Design · Originality — each weighted equally'
              : 'Describe how this market will be resolved (e.g., official announcement, verified source, etc.)'
            }
          />
        </div>

        {error && (
          <div className="bg-pm-red-soft border border-pm-red/30 rounded-xl px-4 py-3 text-pm-red text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pm-blue text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-pm-blue/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-pm-blue/20"
        >
          {loading ? 'Creating market...' : 'Create market'}
        </button>

      </form>
    </div>
  )
}