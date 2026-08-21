'use client'

import { useState } from 'react'
import { Plus, Calendar, MapPin, Pencil, Trash2, ChevronDown, ChevronUp, Sun } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ActivityCard } from './ActivityCard'
import { ActivityForm } from './ActivityForm'
import type { ItineraryDay, ItineraryItem } from '@/types/itinerary'

interface ItineraryTimelineProps {
  days: ItineraryDay[]
  onAddDay: () => void
  onUpdateDay: (id: string, updates: Partial<ItineraryDay>) => void
  onDeleteDay: (id: string) => void
  onAddItem: (data: Partial<ItineraryItem>) => Promise<void>
  onUpdateItem: (id: string, data: Partial<ItineraryItem>) => Promise<void>
  onDeleteItem: (id: string) => void
  onReorderItems: (dayId: string, itemIds: string[]) => void
  readOnly?: boolean
}

export function ItineraryTimeline({
  days, onAddDay, onUpdateDay, onDeleteDay,
  onAddItem, onUpdateItem, onDeleteItem, onReorderItems,
  readOnly = false,
}: ItineraryTimelineProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(days.map(d => d.id)))
  const [editingItem, setEditingItem] = useState<{ item: ItineraryItem | null; dayId: string } | null>(null)
  const [editingDayTitle, setEditingDayTitle] = useState<string | null>(null)

  const toggleDay = (id: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleMoveItem = (dayId: string, itemId: string, direction: 'up' | 'down') => {
    const day = days.find(d => d.id === dayId)
    if (!day?.items) return
    const idx = day.items.findIndex(i => i.id === itemId)
    if (idx === -1) return
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= day.items.length) return
    const ids = day.items.map(i => i.id)
    ;[ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]]
    onReorderItems(dayId, ids)
  }

  return (
    <div className="space-y-0 relative">
      {/* Vertical timeline line */}
      <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-teal-400 via-teal-300 to-slate-200 hidden md:block" />

      {/* Sticky Day Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-thin sticky top-0 z-10 bg-background pt-1">
        {days.map(day => (
          <button
            key={day.id}
            onClick={() => {
              setExpandedDays(prev => new Set(prev).add(day.id))
              document.getElementById(`day-${day.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className="flex-shrink-0 px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-semibold text-slate-700 hover:bg-omnia-gold/10 hover:border-omnia-gold/20 hover:text-omnia-gold-dark transition-all whitespace-nowrap"
          >
            Day {day.day_number}
            {day.city && <span className="text-muted-foreground font-normal ml-1">· {day.city}</span>}
          </button>
        ))}
        {!readOnly && (
          <button
            onClick={onAddDay}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-omnia-gold/10 border border-omnia-gold/20 rounded-lg text-xs font-semibold text-omnia-gold-dark hover:bg-omnia-gold/15 transition-all"
          >
            <Plus className="w-3 h-3" /> Add Day
          </button>
        )}
      </div>

      {/* Days */}
      {days.map((day, dayIndex) => {
        const isExpanded = expandedDays.has(day.id)
        const items = day.items || []

        return (
          <motion.div
            id={`day-${day.id}`}
            key={day.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: dayIndex * 0.05 }}
            className="relative md:pl-12 mb-6"
          >
            {/* Timeline dot */}
            <div className="hidden md:flex absolute left-0 top-4 w-[46px] items-center justify-center">
              <div className={`w-5 h-5 rounded-full border-[3px] ${isExpanded ? 'bg-omnia-gold/100 border-omnia-gold/20' : 'bg-card border-border'} transition-colors shadow-sm`} />
            </div>

            {/* Day Card */}
            <div className="bg-card rounded-xl border border-border/80 overflow-hidden shadow-sm hover:shadow-md transition-all">
              {/* Day Header */}
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
                onClick={() => toggleDay(day.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-omnia-gold/10 text-omnia-gold-dark rounded-lg text-xs font-bold">
                      Day {day.day_number}
                    </span>
                    {editingDayTitle === day.id ? (
                      <input
                        autoFocus
                        value={day.title || ''}
                        onChange={e => onUpdateDay(day.id, { title: e.target.value })}
                        onBlur={() => setEditingDayTitle(null)}
                        onKeyDown={e => e.key === 'Enter' && setEditingDayTitle(null)}
                        onClick={e => e.stopPropagation()}
                        className="text-sm font-semibold text-foreground border-b border-omnia-gold/60 outline-none bg-transparent px-1"
                      />
                    ) : (
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {day.title || `Day ${day.day_number}`}
                      </h3>
                    )}
                    {!readOnly && (
                      <button
                        onClick={e => { e.stopPropagation(); setEditingDayTitle(day.id) }}
                        className="p-1 text-slate-300 hover:text-omnia-gold rounded"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {day.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    {day.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {day.city}{day.country ? `, ${day.country}` : ''}
                      </span>
                    )}
                    {day.weather_note && (
                      <span className="flex items-center gap-1">
                        <Sun className="w-3 h-3" /> {day.weather_note}
                      </span>
                    )}
                    <span className="text-muted-foreground">{items.length} {items.length === 1 ? 'activity' : 'activities'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {!readOnly && (
                    <button
                      onClick={e => { e.stopPropagation(); onDeleteDay(day.id) }}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Day description */}
              {day.description && isExpanded && (
                <div className="px-5 pb-2">
                  <p className="text-xs text-muted-foreground italic">{day.description}</p>
                </div>
              )}

              {/* Items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 space-y-3">
                      {items.length === 0 ? (
                        <div className="text-center py-6 border-2 border-dashed border-border rounded-xl">
                          <p className="text-sm text-muted-foreground">No activities yet</p>
                          {!readOnly && (
                            <button
                              onClick={() => setEditingItem({ item: null, dayId: day.id })}
                              className="mt-2 text-xs text-omnia-gold font-semibold hover:text-omnia-gold-dark"
                            >
                              + Add first activity
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          {items.map((item, itemIndex) => (
                            <div key={item.id} className="relative">
                              <ActivityCard
                                item={item}
                                onEdit={readOnly ? undefined : (it) => setEditingItem({ item: it, dayId: day.id })}
                                onDelete={readOnly ? undefined : onDeleteItem}
                              />
                              {/* Reorder buttons */}
                              {!readOnly && items.length > 1 && (
                                <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                                  {itemIndex > 0 && (
                                    <button onClick={() => handleMoveItem(day.id, item.id, 'up')}
                                      className="p-0.5 bg-card border border-border rounded text-muted-foreground hover:text-omnia-gold shadow-sm">
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                  )}
                                  {itemIndex < items.length - 1 && (
                                    <button onClick={() => handleMoveItem(day.id, item.id, 'down')}
                                      className="p-0.5 bg-card border border-border rounded text-muted-foreground hover:text-omnia-gold shadow-sm">
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </>
                      )}

                      {/* Add Activity Button */}
                      {!readOnly && (
                        <button
                          onClick={() => setEditingItem({ item: null, dayId: day.id })}
                          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-omnia-gold hover:border-omnia-gold/40 hover:bg-omnia-gold/10/50 transition-all"
                        >
                          <Plus className="w-4 h-4" /> Add Activity
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )
      })}

      {/* Add Day button at bottom */}
      {!readOnly && (
        <div className="md:pl-12">
          <button
            onClick={onAddDay}
            className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-border rounded-xl text-sm font-semibold text-muted-foreground hover:text-omnia-gold hover:border-omnia-gold/40 hover:bg-omnia-gold/10/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Day {days.length + 1}
          </button>
        </div>
      )}

      {/* Activity Form Modal */}
      {editingItem && (
        <ActivityForm
          item={editingItem.item}
          dayId={editingItem.dayId}
          sortOrder={
            editingItem.item
              ? editingItem.item.sort_order
              : (days.find(d => d.id === editingItem.dayId)?.items?.length || 0)
          }
          onSave={async (data) => {
            if (editingItem.item) {
              await onUpdateItem(editingItem.item.id, data)
            } else {
              await onAddItem(data)
            }
            setEditingItem(null)
          }}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  )
}
