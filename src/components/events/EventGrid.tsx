'use client'

import { useState } from 'react'
import EventCard from './EventCard'
import { ArcEvent } from '@/types'

const DOMAINS = ['All', 'Tech / Coding', 'Hustle', 'Design', 'Gaming', 'Academic']

export default function EventGrid({ events }: { events: ArcEvent[] }) {
  const [domain, setDomain] = useState('All')

  const filtered = domain === 'All'
    ? events
    : events.filter(e => e.domain === domain)

  return (
    <div>
      {/* Domain filter */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {DOMAINS.map(d => (
          <button
            key={d}
            onClick={() => setDomain(d)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              domain === d
                ? 'bg-stovest-blue text-white shadow-[0_0_15px_rgba(29,78,216,0.3)]'
                : 'bg-transparent border border-stovest-border text-gray-400 hover:border-gray-600 hover:text-white'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-4xl mb-3 font-mono text-stovest-blue opacity-50">◈</div>
          <div className="text-sm">No events in this category yet</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}