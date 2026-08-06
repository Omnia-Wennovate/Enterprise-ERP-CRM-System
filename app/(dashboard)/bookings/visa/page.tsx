'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, LayoutDashboard, List, BarChart3, Plus } from 'lucide-react'
import { VisaDashboard } from '@/components/bookings/visa/VisaDashboard'
import { VisaList } from '@/components/bookings/visa/VisaList'
import { VisaSearch } from '@/components/bookings/visa/VisaSearch'
import { VisaDetail } from '@/components/bookings/visa/VisaDetail'
import { VisaForm } from '@/components/bookings/visa/VisaForm'
import { VisaReports } from '@/components/bookings/visa/VisaReports'
import type { VisaApplication, VisaDashboardKPIs, VisaChartData, VisaSearchParams } from '@/types/visa'

type ViewMode = 'dashboard' | 'list' | 'detail' | 'reports'

export default function VisaPage() {
  const [view, setView] = useState<ViewMode>('dashboard')
  const [applications, setApplications] = useState<VisaApplication[]>([])
  const [kpis, setKpis] = useState<VisaDashboardKPIs | null>(null)
  const [chartData, setChartData] = useState<VisaChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { getVisaApplications, getVisaDashboardKPIs, getVisaChartData } = await import('@/lib/services/visa')
      const [apps, k, c] = await Promise.all([
        getVisaApplications(),
        getVisaDashboardKPIs(),
        getVisaChartData()
      ])
      setApplications(apps)
      setKpis(k)
      setChartData(c)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (params: Partial<VisaSearchParams>) => {
    try {
      const { searchVisaApplications } = await import('@/lib/services/visa')
      const apps = await searchVisaApplications(params)
      setApplications(apps)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSave = async (data: Partial<VisaApplication>) => {
    const { createVisaApplication, updateVisaApplication } = await import('@/lib/services/visa')
    if (editId) {
      await updateVisaApplication(editId, data)
    } else {
      await createVisaApplication(data)
    }
    setShowForm(false)
    setEditId(null)
    loadData()
  }

  const handleBulkCreate = async (bookingId: string, shared: any) => {
    const { bulkCreateVisaApplications } = await import('@/lib/services/visa')
    await bulkCreateVisaApplications(bookingId, shared)
    setShowForm(false)
    loadData()
    setView('list')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return
    try {
      const { deleteVisaApplication } = await import('@/lib/services/visa')
      await deleteVisaApplication(id)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const openForm = (id?: string) => {
    setEditId(id || null)
    setShowForm(true)
  }

  const editingVisa = editId ? applications.find(a => a.id === editId) : null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header (hidden in detail view) */}
        {view !== 'detail' && (
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl">
                  <FileText className="w-6 h-6 text-primary-foreground" />
                </div>
                Visa Management
              </h1>
              <p className="text-muted-foreground mt-1 ml-14">Enterprise visa processing & intelligence</p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Switcher */}
              <div className="flex items-center bg-card rounded-xl border border-border p-1">
                <button
                  onClick={() => setView('dashboard')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    view === 'dashboard' ? 'bg-teal-600 text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    view === 'list' ? 'bg-teal-600 text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <List className="w-4 h-4" /> Applications
                </button>
                <button
                  onClick={() => setView('reports')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    view === 'reports' ? 'bg-teal-600 text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" /> Reports
                </button>
              </div>

              <button
                onClick={() => openForm()}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-primary-foreground rounded-xl hover:bg-teal-700 transition-colors font-semibold text-sm shadow-sm"
              >
                <Plus className="w-4 h-4" /> New Visa
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          {view === 'dashboard' && kpis && chartData && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <VisaDashboard kpis={kpis} chartData={chartData} />
            </motion.div>
          )}

          {view === 'list' && (
            <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <VisaSearch onSearch={handleSearch} />
              <VisaList
                applications={applications}
                isLoading={loading}
                onView={(id) => { setSelectedId(id); setView('detail') }}
                onEdit={openForm}
                onDelete={handleDelete}
              />
            </motion.div>
          )}

          {view === 'reports' && (
            <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <VisaReports />
            </motion.div>
          )}

          {view === 'detail' && selectedId && (
            <motion.div key="detail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <VisaDetail
                visaId={selectedId}
                onBack={() => { setSelectedId(null); setView('list') }}
                onEdit={openForm}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Modal */}
        {showForm && (
          <VisaForm
            visa={editingVisa}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditId(null) }}
            onBulkCreate={handleBulkCreate}
          />
        )}
      </div>
    </div>
  )
}
