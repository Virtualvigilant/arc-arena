'use client'

import { useState } from 'react'
import EventCard from './EventCard'
import { ArcEvent, EVENT_CATEGORIES } from '@/types'

export default function EventGrid({ events }: { events: ArcEvent[] }) {
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = activeCategory === 'All'
    ? events
    : activeCategory === 'Trending'
      ? [...events].sort((a, b) => b.total_pool - a.total_pool)
      : activeCategory === 'New'
        ? [...events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : events.filter(e => e.domain === activeCategory)

  return (
    <div>
      {/* Category filter pills — horizontal scroll */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
        {EVENT_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
              activeCategory === cat
                ? 'bg-pm-blue text-white border-pm-blue shadow-lg shadow-pm-blue/20'
                : 'bg-transparent border-pm-border text-pm-text-secondary hover:border-pm-text-muted hover:text-pm-text'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3 opacity-30">◈</div>
          <div className="text-sm text-pm-text-muted">No markets in this category yet</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((event, i) => (
            <div key={event.id} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
              <EventCard event={event} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}