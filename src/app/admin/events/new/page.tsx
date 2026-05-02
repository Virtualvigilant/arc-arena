'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DOMAINS = ['Tech / Coding', 'Hustle', 'Design', 'Gaming', 'Academic', 'Other']
const BANDS = ['bronze', 'silver', 'gold', 'elite']

const DEFAULT_MULTIPLIERS = [
  { position_label: '1st place', position_rank: 1, multiplier: 4.0, tier_type: 'winner' },
  { position_label: '2nd place', position_rank: 2, multiplier: 2.5, tier_type: 'winner' },
  { position_label: '3rd place', position_rank: 3, multiplier: 1.5, tier_type: 'winner' },
  { position_label: '4th place', position_rank: 4, multiplier: 0.75, tier_type: 'gray' },
  { position_label: '5th place', position_rank: 5, multiplier: 0.50, tier_type: 'gray' },
]

export default function NewEventPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    title: '',
    description: '',
    domain: 'Tech / Coding',
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, multipliers })
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

  const inputClass = "w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-gray-500 transition-colors"
  const labelClass = "block text-[10px] text-gray-400 uppercase tracking-wider mb-2"

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Create event</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Design a new competition arena
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Basic info */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs text-gray-400 uppercase tracking-wider">
            Basic info
          </h2>

          <div>
            <label className={labelClass}>Event title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className={inputClass}
              placeholder="72-hour build challenge #002"
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
              placeholder="What are competitors building or doing?"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Domain</label>
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

          <div>
            <label className={labelClass}>Judging criteria</label>
            <textarea
              name="judging_criteria"
              value={form.judging_criteria}
              onChange={handleChange}
              className={`${inputClass} resize-none h-20`}
              placeholder="Functionality · Design · Originality — each weighted equally"
            />
          </div>
        </div>

        {/* Competitors + timeline */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs text-gray-400 uppercase tracking-wider">
            Competitors and timeline
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Min competitors</label>
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
              <label className={labelClass}>Max competitors</label>
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
              { name: 'competition_start', label: 'Competition starts' },
              { name: 'competition_end', label: 'Competition ends' },
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
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-4">
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
                      ? 'border-amber-600 bg-amber-950'
                      : 'border-gray-700 bg-gray-800 opacity-50'
                  }`}
                >
                  <div className={`text-sm font-bold capitalize mb-1 ${active ? 'text-amber-300' : 'text-gray-400'}`}>
                    {band}
                  </div>
                  <div className={`font-mono text-[10px] ${active ? 'text-amber-600' : 'text-gray-600'}`}>
                    {ranges[band]}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Multipliers */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-4">
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
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors mt-2"
            >
              + Add tier
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-gray-900 rounded-xl py-3.5 font-bold text-sm hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating event...' : 'Create event and open registration'}
        </button>

      </form>
    </div>
  )
}