'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Sparkles, Send, X, Loader2, ChevronDown, Bot,
  CheckCircle2, AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AIChatMessage, AIChatAction } from '@/types/ai-itinerary'
import type { ItineraryWithBooking, ItineraryDay, ItineraryItem } from '@/types/itinerary'

interface AITravelAssistantProps {
  itinerary: ItineraryWithBooking
  onAddItem: (data: Partial<ItineraryItem>) => Promise<void>
  onUpdateItem: (id: string, data: Partial<ItineraryItem>) => Promise<void>
  onDeleteItem: (id: string) => void | Promise<void>
  onAddDay: () => void
  onReload: () => void
}

export function AITravelAssistant({
  itinerary, onAddItem, onUpdateItem, onDeleteItem, onAddDay, onReload,
}: AITravelAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<AIChatMessage[]>([])
  const [pendingActions, setPendingActions] = useState<AIChatAction[]>([])
  const [applyingActions, setApplyingActions] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  // Build context for the AI
  const buildContext = useCallback(() => ({
    itineraryId: itinerary.id,
    destination: itinerary.destination_city || itinerary.destination_country || '',
    travelType: itinerary.travel_type || 'leisure',
    days: (itinerary.days || []).map(day => ({
      dayNumber: day.day_number,
      title: day.title || `Day ${day.day_number}`,
      items: (day.items || []).map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        time: item.start_time || item.time || undefined,
      })),
    })),
  }), [itinerary])

  const handleSend = async () => {
    if (!message.trim() || sending) return

    const userMsg: AIChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }

    setHistory(h => [...h, userMsg])
    setMessage('')
    setSending(true)
    setPendingActions([])

    try {
      const res = await fetch('/api/ai-itinerary/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          itineraryContext: buildContext(),
          conversationHistory: [...history, userMsg],
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Chat failed')
      }

      const data = await res.json()

      const assistantMsg: AIChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
      }

      setHistory(h => [...h, assistantMsg])

      if (data.actions && data.actions.length > 0) {
        setPendingActions(data.actions)
      }
    } catch (err) {
      const errorMsg: AIChatMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date().toISOString(),
      }
      setHistory(h => [...h, errorMsg])
    } finally {
      setSending(false)
    }
  }

  const handleApplyActions = async () => {
    setApplyingActions(true)
    try {
      // Keep track of dynamically created days during this loop
      const dynamicallyCreatedDays: any[] = []

      for (const action of pendingActions) {
        switch (action.type) {
          case 'add_item': {
            if (!action.newItem) break
            
            // Look in props first, then in our local cache of newly created days
            let targetDay = itinerary.days?.find(d => d.day_number === action.dayNumber) || 
                            dynamicallyCreatedDays.find(d => d.day_number === action.dayNumber)
            
            // Auto-create missing day if it's the sequential next day
            if (!targetDay && itinerary.id) {
              const currentTotalDays = (itinerary.days?.length || 0) + dynamicallyCreatedDays.length
              const nextDayNum = currentTotalDays + 1
              
              if (action.dayNumber === nextDayNum) {
                const { addDay } = await import('@/lib/services/itineraries')
                targetDay = await addDay(itinerary.id, nextDayNum)
                dynamicallyCreatedDays.push(targetDay)
              }
            }
            if (!targetDay) break
            
            const timeSlotToTime = (slot?: string) => {
              if (slot === 'morning') return '09:00'
              if (slot === 'afternoon') return '14:00'
              if (slot === 'evening') return '19:00'
              return null
            }

            const validTypes = ['flight', 'hotel', 'transfer', 'train', 'cruise', 'restaurant', 'tour', 'visa_appointment', 'documents', 'meeting', 'medical', 'religious', 'event', 'shopping', 'free_time', 'custom']
            const rawType = action.newItem.type as string
            const safeType = validTypes.includes(rawType) ? rawType : 'custom'

            await onAddItem({
              day_id: targetDay.id,
              type: safeType as ItineraryItem['type'],
              title: action.newItem.title || 'New Activity',
              description: action.newItem.description || null,
              start_time: action.newItem.startTime || timeSlotToTime(action.newItem.timeSlot) || null,
              duration_minutes: action.newItem.durationMinutes ? Number(action.newItem.durationMinutes) : null,
              location: action.newItem.location || null,
              cost: action.newItem.costEstimate ? Number(String(action.newItem.costEstimate).replace(/[^0-9.]/g, '')) : 0,
              currency: action.newItem.costCurrency || 'USD',
              status: 'pending',
              sort_order: (targetDay.items?.length || 0),
              notes: action.newItem.notes || null,
              metadata: {
                is_ai_suggested: true,
                is_supplier_confirmed: false,
              },
            })
            break
          }

          case 'remove_item': {
            if (action.itemId) {
              onDeleteItem(action.itemId)
            }
            break
          }

          case 'move_item': {
            if (!action.itemId || !action.targetDayNumber) break
            const newDay = itinerary.days?.find(d => d.day_number === action.targetDayNumber)
            if (!newDay) break
            const { moveItemToDay } = await import('@/lib/services/itineraries')
            await moveItemToDay(action.itemId, newDay.id, newDay.items?.length || 0)
            break
          }

          case 'update_item': {
            if (!action.itemId || !action.newItem) break
            await onUpdateItem(action.itemId, {
              title: action.newItem.title,
              description: action.newItem.description || undefined,
            })
            break
          }

          case 'replace_item': {
            if (!action.itemId) break
            // Delete old, add new
            onDeleteItem(action.itemId)
            if (action.newItem) {
              const targetDay = itinerary.days?.find(d => d.day_number === action.dayNumber)
              if (targetDay) {
                await onAddItem({
                  day_id: targetDay.id,
                  type: (action.newItem.type as ItineraryItem['type']) || 'custom',
                  title: action.newItem.title || 'New Activity',
                  description: action.newItem.description || null,
                  start_time: action.newItem.startTime || null,
                  duration_minutes: action.newItem.durationMinutes || null,
                  location: action.newItem.location || null,
                  cost: action.newItem.costEstimate || 0,
                  status: 'pending',
                  sort_order: 0,
                  metadata: { is_ai_suggested: true, is_supplier_confirmed: false },
                })
              }
            }
            break
          }
        }
      }

      setPendingActions([])
      onReload()

      const confirmMsg: AIChatMessage = {
        role: 'assistant',
        content: '✅ Changes applied successfully! The itinerary has been updated.',
        timestamp: new Date().toISOString(),
      }
      setHistory(h => [...h, confirmMsg])
    } catch (err) {
      console.error('Failed to apply actions:', err)
      const errorMsg: AIChatMessage = {
        role: 'assistant',
        content: '❌ Failed to apply some changes. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setHistory(h => [...h, errorMsg])
    } finally {
      setApplyingActions(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-2xl shadow-lg hover:shadow-xl hover:from-teal-700 hover:to-emerald-700 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-sm font-semibold">AI Assistant</span>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] max-h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-white" />
                <div>
                  <h3 className="text-sm font-bold text-white">AI Travel Assistant</h3>
                  <p className="text-[10px] text-teal-100">
                    {itinerary.destination_city || 'Travel'} itinerary editor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px]">
              {history.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="w-10 h-10 text-teal-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-medium">Hi! I can help edit your itinerary.</p>
                  <div className="mt-3 space-y-1.5">
                    {[
                      'Add a desert safari on Day 3',
                      'Replace lunch with a vegan restaurant',
                      'Add 2 hours free time on Day 2',
                      'Upgrade hotel to luxury',
                    ].map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => setMessage(ex)}
                        className="block w-full text-left px-3 py-1.5 text-xs text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                      >
                        &ldquo;{ex}&rdquo;
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {history.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-teal-600 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-xl rounded-bl-sm px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Pending Actions */}
              {pendingActions.length > 0 && (
                <div className="bg-teal-50 rounded-xl border border-teal-200 p-3 space-y-2">
                  <p className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                    Proposed Changes
                  </p>
                  {pendingActions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-teal-800">
                      <AlertCircle className="w-3 h-3 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span>{action.description}</span>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleApplyActions}
                      disabled={applyingActions}
                      className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-[10px] font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors"
                    >
                      {applyingActions ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      Apply Changes
                    </button>
                    <button
                      onClick={() => setPendingActions([])}
                      className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-[10px] font-medium transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me to modify the itinerary..."
                  disabled={sending}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:opacity-60"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !message.trim()}
                  className="p-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
