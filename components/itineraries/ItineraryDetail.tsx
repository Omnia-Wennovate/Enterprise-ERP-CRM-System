'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, Loader2, MapPin, Calendar, Users, Clock,
  Pencil, Share2, FileDown, CheckCircle2, MessageSquare,
  History, Globe, BookOpen, Save, Bookmark
} from 'lucide-react'
import { motion } from 'framer-motion'
import { ItineraryTimeline } from './ItineraryTimeline'
import { TravelIntelligence } from './TravelIntelligence'
import { ItineraryForm } from './ItineraryForm'
import type { ItineraryWithBooking, ItineraryDay, ItineraryItem, ItineraryComment, ItineraryStatus } from '@/types/itinerary'
import { ITINERARY_STATUSES } from '@/types/itinerary'

interface ItineraryDetailProps {
  itineraryId: string
  onBack: () => void
}

type Tab = 'timeline' | 'intelligence' | 'documents' | 'comments' | 'versions'

export function ItineraryDetail({ itineraryId, onBack }: ItineraryDetailProps) {
  const [itinerary, setItinerary] = useState<ItineraryWithBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('timeline')
  const [showEditForm, setShowEditForm] = useState(false)
  const [comments, setComments] = useState<ItineraryComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [savingComment, setSavingComment] = useState(false)

  const loadItinerary = useCallback(async () => {
    try {
      const { getItineraryById } = await import('@/lib/services/itineraries')
      const data = await getItineraryById(itineraryId)
      setItinerary(data)
    } catch (err) {
      console.error('Failed to load itinerary:', err)
    } finally {
      setLoading(false)
    }
  }, [itineraryId])

  const loadComments = useCallback(async () => {
    try {
      const { getComments } = await import('@/lib/services/itineraries')
      const data = await getComments(itineraryId)
      setComments(data)
    } catch (err) {
      console.error('Failed to load comments:', err)
    }
  }, [itineraryId])

  useEffect(() => {
    loadItinerary()
    loadComments()
  }, [loadItinerary, loadComments])

  // ── Day Operations ──

  const handleAddDay = async () => {
    if (!itinerary) return
    const dayNumber = (itinerary.days?.length || 0) + 1
    const lastDay = itinerary.days?.[itinerary.days.length - 1]
    let newDate: string | undefined
    if (lastDay?.date) {
      const d = new Date(lastDay.date)
      d.setDate(d.getDate() + 1)
      newDate = d.toISOString().split('T')[0]
    } else if (itinerary.booking?.trip_start_date) {
      const d = new Date(itinerary.booking.trip_start_date)
      d.setDate(d.getDate() + dayNumber - 1)
      newDate = d.toISOString().split('T')[0]
    }
    try {
      const { addDay } = await import('@/lib/services/itineraries')
      await addDay(itineraryId, dayNumber, newDate)
      loadItinerary()
    } catch (err) {
      console.error('Failed to add day:', err)
    }
  }

  const handleUpdateDay = async (id: string, updates: Partial<ItineraryDay>) => {
    try {
      const { updateDay } = await import('@/lib/services/itineraries')
      await updateDay(id, updates)
      setItinerary(prev => {
        if (!prev) return prev
        return {
          ...prev,
          days: prev.days?.map(d => d.id === id ? { ...d, ...updates } : d),
        }
      })
    } catch (err) {
      console.error('Failed to update day:', err)
    }
  }

  const handleDeleteDay = async (id: string) => {
    if (!confirm('Delete this day and all its activities?')) return
    try {
      const { deleteDay } = await import('@/lib/services/itineraries')
      await deleteDay(id)
      loadItinerary()
    } catch (err) {
      console.error('Failed to delete day:', err)
    }
  }

  // ── Item Operations ──

  const handleAddItem = async (data: Partial<ItineraryItem>) => {
    try {
      const { addItem } = await import('@/lib/services/itineraries')
      await addItem(data)
      loadItinerary()
    } catch (err) {
      console.error('Failed to add item:', err)
    }
  }

  const handleUpdateItem = async (id: string, data: Partial<ItineraryItem>) => {
    try {
      const { updateItem } = await import('@/lib/services/itineraries')
      await updateItem(id, data)
      loadItinerary()
    } catch (err) {
      console.error('Failed to update item:', err)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this activity?')) return
    try {
      const { deleteItem } = await import('@/lib/services/itineraries')
      await deleteItem(id)
      loadItinerary()
    } catch (err) {
      console.error('Failed to delete item:', err)
    }
  }

  const handleReorderItems = async (dayId: string, itemIds: string[]) => {
    // Optimistic update
    setItinerary(prev => {
      if (!prev) return prev
      return {
        ...prev,
        days: prev.days?.map(d => {
          if (d.id !== dayId) return d
          const reordered = itemIds.map((id, i) => {
            const item = d.items?.find(it => it.id === id)
            return item ? { ...item, sort_order: i } : null
          }).filter(Boolean) as ItineraryItem[]
          return { ...d, items: reordered }
        }),
      }
    })
    try {
      const { reorderItems } = await import('@/lib/services/itineraries')
      await reorderItems(dayId, itemIds)
    } catch (err) {
      console.error('Failed to reorder:', err)
      loadItinerary()
    }
  }

  // ── Status Update ──

  const handleStatusChange = async (newStatus: ItineraryStatus) => {
    try {
      const { updateItinerary } = await import('@/lib/services/itineraries')
      await updateItinerary(itineraryId, { status: newStatus })
      setItinerary(prev => prev ? { ...prev, status: newStatus } : prev)
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  // ── Save as Template ──

  const handleSaveAsTemplate = async () => {
    const name = prompt('Template name:', itinerary?.title || '')
    if (!name) return
    try {
      const { saveAsTemplate } = await import('@/lib/services/itineraries')
      await saveAsTemplate(itineraryId, name)
      alert('Template saved successfully!')
    } catch (err) {
      console.error('Failed to save template:', err)
    }
  }

  // ── Comment ──

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    setSavingComment(true)
    try {
      const { addComment } = await import('@/lib/services/itineraries')
      await addComment({
        itinerary_id: itineraryId,
        author_id: 'current_user',
        author_name: 'Current User',
        content: newComment,
        department: 'operations',
        is_internal: true,
      })
      setNewComment('')
      loadComments()
    } catch (err) {
      console.error('Failed to add comment:', err)
    } finally {
      setSavingComment(false)
    }
  }

  // ── Edit Save ──

  const handleEditSave = async (data: Partial<ItineraryWithBooking>) => {
    try {
      const { updateItinerary } = await import('@/lib/services/itineraries')
      await updateItinerary(itineraryId, data)
      setShowEditForm(false)
      loadItinerary()
    } catch (err) {
      console.error('Failed to update itinerary:', err)
    }
  }

  // ── Print/PDF ──

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!itinerary) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-600">Itinerary not found</p>
        <button onClick={onBack} className="mt-4 text-teal-600 font-semibold">← Back to list</button>
      </div>
    )
  }

  const booking = itinerary.booking
  const statusConfig = ITINERARY_STATUSES.find(s => s.value === itinerary.status)
  const destination = itinerary.destination_city || itinerary.destination_country || booking?.destination || 'Unknown'

  const startDate = booking?.trip_start_date ? new Date(booking.trip_start_date) : null
  const endDate = booking?.trip_end_date ? new Date(booking.trip_end_date) : null
  const duration = startDate && endDate
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : null

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'intelligence', label: 'Travel Intel', icon: Globe },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'versions', label: 'History', icon: History },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Back Button */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-700 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Itineraries
      </button>

      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-teal-600 via-sky-600 to-blue-700">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />

        <div className="relative px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              {itinerary.destination_country && (
                <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">
                  {itinerary.destination_country}
                </p>
              )}
              <h1 className="text-3xl font-bold text-white">{itinerary.title}</h1>
              <p className="text-white/80 text-lg mt-1">{destination}</p>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-white/70 text-sm">
                {booking && (
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                    <BookOpen className="w-3.5 h-3.5" /> {booking.booking_reference}
                  </span>
                )}
                {startDate && endDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {duration} Days
                  </span>
                )}
                {booking && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> {booking.num_travelers} Travelers
                  </span>
                )}
                {booking?.customer_name && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> {booking.customer_name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {statusConfig && (
                <select
                  value={itinerary.status}
                  onChange={e => handleStatusChange(e.target.value as ItineraryStatus)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${statusConfig.color}`}
                >
                  {ITINERARY_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowEditForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={handleSaveAsTemplate}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Bookmark className="w-3.5 h-3.5" /> Save Template
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <FileDown className="w-3.5 h-3.5" /> Print / PDF
          </button>
          {itinerary.share_token && (
            <button
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/itinerary/${itinerary.share_token}`); alert('Share link copied!') }}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          )}
        </div>
      </div>

      {/* Traveler Info Banner */}
      {itinerary.travelers && itinerary.travelers.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Travelers</h3>
          <div className="flex flex-wrap gap-3">
            {itinerary.travelers.map(t => (
              <div key={t.id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center text-xs font-bold text-teal-700">
                  {t.first_name[0]}{t.last_name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.first_name} {t.last_name}</p>
                  <p className="text-xs text-slate-500">{t.nationality || 'No nationality'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'timeline' && (
        <ItineraryTimeline
          days={itinerary.days || []}
          onAddDay={handleAddDay}
          onUpdateDay={handleUpdateDay}
          onDeleteDay={handleDeleteDay}
          onAddItem={handleAddItem}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onReorderItems={handleReorderItems}
        />
      )}

      {activeTab === 'intelligence' && (
        <TravelIntelligence itinerary={itinerary} />
      )}

      {activeTab === 'comments' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-teal-600" />
            Discussion ({comments.length})
          </h3>

          <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No comments yet. Start the discussion!</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-xs font-bold text-teal-700 flex-shrink-0">
                    {(c.author_name || 'U')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">{c.author_name || 'User'}</span>
                      {c.department && (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded">{c.department}</span>
                      )}
                      <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddComment()}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            />
            <button onClick={handleAddComment} disabled={savingComment || !newComment.trim()}
              className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors">
              {savingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'versions' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-teal-600" />
              Version History
            </h3>
            <span className="text-xs text-slate-500">Current: v{itinerary.version}</span>
          </div>
          <p className="text-sm text-slate-400 text-center py-8">
            Version snapshots are created when the itinerary status changes.
          </p>
        </div>
      )}

      {/* Edit Form */}
      {showEditForm && (
        <ItineraryForm
          itinerary={itinerary}
          onSave={handleEditSave}
          onClose={() => setShowEditForm(false)}
        />
      )}
    </motion.div>
  )
}
