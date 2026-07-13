'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Map, LayoutDashboard, List, Loader2, ArrowLeft, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ItineraryDashboard } from '@/components/itineraries/ItineraryDashboard'
import { ItineraryList } from '@/components/itineraries/ItineraryList'
import { ItineraryDetail } from '@/components/itineraries/ItineraryDetail'
import { ItineraryForm } from '@/components/itineraries/ItineraryForm'
import type { Itinerary } from '@/types/itinerary'
import type { Profile } from '@/types'

type View = 'dashboard' | 'list' | 'detail' | 'create'

export default function ItinerariesPage() {
  const [view, setView] = useState<View>('dashboard')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    // Get user profile from localStorage (matching existing auth pattern)
    try {
      const stored = localStorage.getItem('auth_user')
      if (stored) setProfile(JSON.parse(stored))
    } catch {
      // Ignore
    }
  }, [])

  const handleOpenItinerary = (id: string) => {
    setSelectedId(id)
    setView('detail')
  }

  const handleBack = () => {
    setSelectedId(null)
    setView('list')
  }

  const handleCreate = async (data: Partial<Itinerary>) => {
    try {
      const { createItinerary } = await import('@/lib/services/itineraries')
      const newIt = await createItinerary({
        ...data,
        created_by: profile?.id || 'system',
        assigned_to: profile?.id || null,
        assigned_to_name: profile?.full_name || null,
      })
      setShowCreateForm(false)
      setSelectedId(newIt.id)
      setView('detail')
    } catch (err) {
      console.error('Failed to create itinerary:', err)
      alert('Failed to create itinerary. Please check your connection.')
    }
  }

  const handleEdit = (id: string) => {
    setSelectedId(id)
    setView('detail')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this itinerary? This cannot be undone.')) return
    try {
      const { deleteItinerary } = await import('@/lib/services/itineraries')
      await deleteItinerary(id)
      if (selectedId === id) {
        setSelectedId(null)
        setView('list')
      }
    } catch (err) {
      console.error('Failed to delete itinerary:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header — only on dashboard/list views */}
        {view !== 'detail' && (
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-teal-500 to-sky-600 rounded-xl">
                  <Map className="w-6 h-6 text-white" />
                </div>
                Itineraries
              </h1>
              <p className="text-slate-500 mt-1 ml-14">Enterprise travel itinerary management</p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Switcher */}
              <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1">
                <button
                  onClick={() => setView('dashboard')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    view === 'dashboard'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    view === 'list'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <List className="w-4 h-4" /> All Itineraries
                </button>
              </div>

              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-semibold text-sm shadow-sm"
              >
                <Plus className="w-4 h-4" /> New Itinerary
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ItineraryDashboard onViewAll={() => setView('list')} />
            </motion.div>
          )}

          {view === 'list' && (
            <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ItineraryList
                onOpen={handleOpenItinerary}
                onEdit={handleEdit}
                onCreate={() => setShowCreateForm(true)}
                onDelete={handleDelete}
              />
            </motion.div>
          )}

          {view === 'detail' && selectedId && (
            <motion.div key="detail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ItineraryDetail
                itineraryId={selectedId}
                onBack={handleBack}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Form Modal */}
        {showCreateForm && (
          <ItineraryForm
            onSave={handleCreate}
            onClose={() => setShowCreateForm(false)}
          />
        )}
      </div>
    </div>
  )
}
