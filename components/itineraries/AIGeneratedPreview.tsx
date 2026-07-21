'use client'

import { useState } from 'react'
import {
  ChevronDown, ChevronUp, Sparkles, RotateCcw, Clock,
  MapPin, Sun, Sunrise, Moon, Wand2, MoreHorizontal,
  AlertTriangle, CheckCircle2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AICostEstimatePanel } from './AICostEstimatePanel'
import { AIQualityCheckPanel } from './AIQualityCheckPanel'
import type {
  AIGeneratedItinerary, AIGeneratedDay, AIGeneratedItem,
  AIQualityCheckResult, AIRefineMode
} from '@/types/ai-itinerary'
import { ACTIVITY_TYPES } from '@/types/itinerary'

interface AIGeneratedPreviewProps {
  itinerary: AIGeneratedItinerary
  qualityCheck: AIQualityCheckResult | null
  onAccept: () => void
  onReject: () => void
  onRegenerateDay: (dayNumber: number) => void
  onRegenerateSlot: (dayNumber: number, slot: 'morning' | 'afternoon' | 'evening') => void
  onRefineItem: (dayIndex: number, itemIndex: number, mode: AIRefineMode) => void
  onUpdateItem: (dayIndex: number, itemIndex: number, item: AIGeneratedItem) => void
  accepting: boolean
  isRegenerating: boolean
}

export function AIGeneratedPreview({
  itinerary, qualityCheck, onAccept, onReject,
  onRegenerateDay, onRegenerateSlot, onRefineItem, onUpdateItem,
  accepting, isRegenerating,
}: AIGeneratedPreviewProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(
    new Set(itinerary.days.map(d => d.dayNumber))
  )
  const [showRefineMenu, setShowRefineMenu] = useState<string | null>(null)

  const toggleDay = (n: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n); else next.add(n)
      return next
    })
  }

  const REFINE_MODES: { mode: AIRefineMode; label: string; icon: string }[] = [
    { mode: 'regenerate', label: 'Regenerate', icon: '🔄' },
    { mode: 'improve', label: 'Improve', icon: '✨' },
    { mode: 'shorten', label: 'Shorten', icon: '⏱️' },
    { mode: 'expand', label: 'Expand', icon: '📖' },
    { mode: 'luxury', label: 'Luxury Version', icon: '💎' },
    { mode: 'budget', label: 'Budget Version', icon: '💰' },
    { mode: 'family_friendly', label: 'Family Friendly', icon: '👨‍👩‍👧‍👦' },
    { mode: 'business_friendly', label: 'Business', icon: '💼' },
    { mode: 'adventure', label: 'Adventure', icon: '🏔️' },
    { mode: 'religious', label: 'Religious', icon: '🕌' },
    { mode: 'senior_friendly', label: 'Senior Friendly', icon: '🧓' },
    { mode: 'kid_friendly', label: 'Kid Friendly', icon: '🧒' },
  ]

  const timeSlotIcon = (slot: string) => {
    if (slot === 'morning') return <Sunrise className="w-3 h-3 text-amber-500" />
    if (slot === 'afternoon') return <Sun className="w-3 h-3 text-orange-500" />
    if (slot === 'evening') return <Moon className="w-3 h-3 text-indigo-500" />
    return <Clock className="w-3 h-3 text-slate-400" />
  }

  const getActivityColor = (type: string) => {
    return ACTIVITY_TYPES.find(t => t.value === type)?.color || '#64748B'
  }

  return (
    <div className="space-y-4">
      {/* Trip Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-teal-50 via-white to-sky-50 rounded-xl border border-teal-200/60 p-5"
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 bg-gradient-to-br from-teal-500 to-sky-600 rounded-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{itinerary.suggestedTitle}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {itinerary.destinationCity}, {itinerary.destinationCountry} · {itinerary.days.length} Days · {itinerary.travelType}
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">{itinerary.tripSummary}</p>

        {/* Travel Info Chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          {itinerary.timezone && (
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-full text-[10px] text-slate-600">
              🕐 {itinerary.timezone}
            </span>
          )}
          {itinerary.localCurrency && (
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-full text-[10px] text-slate-600">
              💱 {itinerary.localCurrency}
            </span>
          )}
          {itinerary.visaNotes && (
            <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full text-[10px] text-amber-700">
              📋 Visa info available
            </span>
          )}
        </div>
      </motion.div>

      {/* Main Content: Days + Cost Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Days Column */}
        <div className="lg:col-span-2 space-y-3">
          {itinerary.days.map((day, dayIndex) => (
            <DayCard
              key={day.dayNumber}
              day={day}
              dayIndex={dayIndex}
              isExpanded={expandedDays.has(day.dayNumber)}
              onToggle={() => toggleDay(day.dayNumber)}
              onRegenerateDay={() => onRegenerateDay(day.dayNumber)}
              onRegenerateSlot={(slot) => onRegenerateSlot(day.dayNumber, slot)}
              onRefineItem={(itemIndex, mode) => onRefineItem(dayIndex, itemIndex, mode)}
              timeSlotIcon={timeSlotIcon}
              getActivityColor={getActivityColor}
              refineModes={REFINE_MODES}
              showRefineMenu={showRefineMenu}
              setShowRefineMenu={setShowRefineMenu}
              isRegenerating={isRegenerating}
            />
          ))}
        </div>

        {/* Cost Sidebar */}
        <div className="space-y-4">
          <AICostEstimatePanel costEstimate={itinerary.costEstimate} />

          {/* Travel Notes */}
          {(itinerary.visaNotes || itinerary.packingTips?.length || itinerary.localCustoms?.length) && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              {itinerary.visaNotes && (
                <div>
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Visa Notes</h5>
                  <p className="text-xs text-slate-600">{itinerary.visaNotes}</p>
                </div>
              )}
              {itinerary.packingTips && itinerary.packingTips.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Packing Tips</h5>
                  <ul className="text-xs text-slate-600 space-y-0.5">
                    {itinerary.packingTips.slice(0, 5).map((tip, i) => (
                      <li key={i}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
              {itinerary.localCustoms && itinerary.localCustoms.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Local Customs</h5>
                  <ul className="text-xs text-slate-600 space-y-0.5">
                    {itinerary.localCustoms.slice(0, 5).map((custom, i) => (
                      <li key={i}>• {custom}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quality Check */}
      {qualityCheck && (
        <AIQualityCheckPanel qualityCheck={qualityCheck} />
      )}

      {/* Accept / Reject Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onReject}
          className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-red-600 transition-colors"
        >
          Discard AI Plan
        </button>
        <div className="flex items-center gap-3">
          {qualityCheck && !qualityCheck.passed && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              Quality issues found — review before accepting
            </span>
          )}
          <button
            onClick={onAccept}
            disabled={accepting}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {accepting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Accept AI Plan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Day Card ─────────────────────────────────────────────────────────────────

function DayCard({
  day, dayIndex, isExpanded, onToggle, onRegenerateDay, onRegenerateSlot,
  onRefineItem, timeSlotIcon, getActivityColor, refineModes,
  showRefineMenu, setShowRefineMenu, isRegenerating,
}: {
  day: AIGeneratedDay
  dayIndex: number
  isExpanded: boolean
  onToggle: () => void
  onRegenerateDay: () => void
  onRegenerateSlot: (slot: 'morning' | 'afternoon' | 'evening') => void
  onRefineItem: (itemIndex: number, mode: AIRefineMode) => void
  timeSlotIcon: (slot: string) => React.ReactNode
  getActivityColor: (type: string) => string
  refineModes: { mode: AIRefineMode; label: string; icon: string }[]
  showRefineMenu: string | null
  setShowRefineMenu: (id: string | null) => void
  isRegenerating: boolean
}) {
  const morningItems = day.items.filter(i => i.timeSlot === 'morning')
  const afternoonItems = day.items.filter(i => i.timeSlot === 'afternoon')
  const eveningItems = day.items.filter(i => i.timeSlot === 'evening')
  const allDayItems = day.items.filter(i => i.timeSlot === 'all_day')

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: dayIndex * 0.05 }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Day Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
        onClick={onToggle}
      >
        <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 rounded-lg text-xs font-bold flex-shrink-0">
          Day {day.dayNumber}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-800 truncate">{day.title}</h4>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
            {day.city && (
              <span className="flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" /> {day.city}
              </span>
            )}
            {day.weatherNote && (
              <span className="flex items-center gap-0.5">
                <Sun className="w-2.5 h-2.5" /> {day.weatherNote}
              </span>
            )}
            <span>{day.items.length} activities</span>
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onRegenerateDay() }}
          disabled={isRegenerating}
          className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-50"
          title="Regenerate this day"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </div>

      {/* Day Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {day.description && (
                <p className="text-xs text-slate-500 italic px-1">{day.description}</p>
              )}

              {/* All Day Items */}
              {allDayItems.length > 0 && (
                <TimeSlotSection
                  label="All Day" items={allDayItems}
                  dayIndex={dayIndex} startIndex={day.items.indexOf(allDayItems[0])}
                  icon={<Clock className="w-3 h-3 text-slate-400" />}
                  onRefineItem={onRefineItem} getActivityColor={getActivityColor}
                  refineModes={refineModes} showRefineMenu={showRefineMenu}
                  setShowRefineMenu={setShowRefineMenu}
                />
              )}

              {/* Morning */}
              {morningItems.length > 0 && (
                <TimeSlotSection
                  label="Morning" items={morningItems}
                  dayIndex={dayIndex} startIndex={day.items.indexOf(morningItems[0])}
                  icon={<Sunrise className="w-3 h-3 text-amber-500" />}
                  onRegenerateSlot={() => onRegenerateSlot('morning')}
                  onRefineItem={onRefineItem} getActivityColor={getActivityColor}
                  refineModes={refineModes} showRefineMenu={showRefineMenu}
                  setShowRefineMenu={setShowRefineMenu}
                />
              )}

              {/* Afternoon */}
              {afternoonItems.length > 0 && (
                <TimeSlotSection
                  label="Afternoon" items={afternoonItems}
                  dayIndex={dayIndex} startIndex={day.items.indexOf(afternoonItems[0])}
                  icon={<Sun className="w-3 h-3 text-orange-500" />}
                  onRegenerateSlot={() => onRegenerateSlot('afternoon')}
                  onRefineItem={onRefineItem} getActivityColor={getActivityColor}
                  refineModes={refineModes} showRefineMenu={showRefineMenu}
                  setShowRefineMenu={setShowRefineMenu}
                />
              )}

              {/* Evening */}
              {eveningItems.length > 0 && (
                <TimeSlotSection
                  label="Evening" items={eveningItems}
                  dayIndex={dayIndex} startIndex={day.items.indexOf(eveningItems[0])}
                  icon={<Moon className="w-3 h-3 text-indigo-500" />}
                  onRegenerateSlot={() => onRegenerateSlot('evening')}
                  onRefineItem={onRefineItem} getActivityColor={getActivityColor}
                  refineModes={refineModes} showRefineMenu={showRefineMenu}
                  setShowRefineMenu={setShowRefineMenu}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Time Slot Section ────────────────────────────────────────────────────────

function TimeSlotSection({
  label, items, dayIndex, startIndex, icon,
  onRegenerateSlot, onRefineItem, getActivityColor,
  refineModes, showRefineMenu, setShowRefineMenu,
}: {
  label: string
  items: AIGeneratedItem[]
  dayIndex: number
  startIndex: number
  icon: React.ReactNode
  onRegenerateSlot?: () => void
  onRefineItem: (itemIndex: number, mode: AIRefineMode) => void
  getActivityColor: (type: string) => string
  refineModes: { mode: AIRefineMode; label: string; icon: string }[]
  showRefineMenu: string | null
  setShowRefineMenu: (id: string | null) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          {icon} {label}
        </span>
        {onRegenerateSlot && (
          <button
            onClick={onRegenerateSlot}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-teal-600 transition-colors"
          >
            <RotateCcw className="w-2.5 h-2.5" /> Regenerate
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => {
          const globalIndex = startIndex + i
          const menuId = `${dayIndex}-${globalIndex}`
          const color = getActivityColor(item.type)

          return (
            <div
              key={menuId}
              className="group flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors relative"
            >
              {/* Type indicator */}
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                style={{ backgroundColor: color }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-800">{item.title}</span>
                  {item.isAiSuggested && (
                    <Sparkles className="w-2.5 h-2.5 text-teal-500 flex-shrink-0" />
                  )}
                  {!item.isSupplierConfirmed && item.supplierName && (
                    <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[8px] font-medium flex-shrink-0">
                      Needs confirmation
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                  {item.startTime && <span>🕐 {item.startTime}{item.endTime ? ` – ${item.endTime}` : ''}</span>}
                  {item.durationMinutes && <span>⏱ {item.durationMinutes}min</span>}
                  {item.location && <span>📍 {item.location}</span>}
                  {item.costEstimate ? (
                    <span className="text-emerald-600 font-medium">
                      ~{item.costCurrency || 'USD'} {item.costEstimate.toLocaleString()}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* AI Assist Button */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowRefineMenu(showRefineMenu === menuId ? null : menuId)}
                  className="p-1 text-slate-300 hover:text-teal-600 rounded opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                </button>

                {/* Refine Dropdown */}
                {showRefineMenu === menuId && (
                  <div className="absolute right-0 top-7 z-30 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 max-h-[280px] overflow-y-auto">
                    {refineModes.map(rm => (
                      <button
                        key={rm.mode}
                        onClick={() => {
                          onRefineItem(globalIndex, rm.mode)
                          setShowRefineMenu(null)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors text-left"
                      >
                        <span>{rm.icon}</span> {rm.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
