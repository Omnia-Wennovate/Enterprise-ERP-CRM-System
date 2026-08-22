'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  FileText, Plus, Search, Filter, RefreshCw, LayoutGrid, PieChart, Shield,
} from 'lucide-react'
import { DocumentsDashboard } from '@/components/bookings/documents/DocumentsDashboard'
import { DocumentsList } from '@/components/bookings/documents/DocumentsList'
import { DocumentUploadModal } from '@/components/bookings/documents/DocumentUploadModal'
import { DocumentDetail } from '@/components/bookings/documents/DocumentDetail'
import { PassportSummaryPanel } from '@/components/bookings/documents/PassportSummaryPanel'
import { PassportAttentionPanel } from '@/components/bookings/documents/PassportAttentionPanel'
import type {
  Document,
  DocumentDashboardKPIs,
  DocumentChartData,
  PassportKPIs,
} from '@/types/documents'

type ViewMode = 'dashboard' | 'list'

export default function DocumentsPage() {
  const [view, setView] = useState<ViewMode>('dashboard')
  const [documents, setDocuments] = useState<Document[]>([])
  const [passports, setPassports] = useState<Document[]>([])
  const [kpis, setKpis] = useState<DocumentDashboardKPIs | null>(null)
  const [passportKpis, setPassportKpis] = useState<PassportKPIs | null>(null)
  const [chartData, setChartData] = useState<DocumentChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [passportFilter, setPassportFilter] = useState<'all' | 'valid' | 'expiring_soon' | 'expired'>('all')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [
        { getDocuments, getDocumentDashboardKPIs, getDocumentChartData, getPassportDocuments, getPassportKPIs },
        { checkAndCreatePassportExpiryNotifications },
      ] = await Promise.all([
        import('@/lib/services/documents'),
        import('@/lib/services/passport-notifications'),
      ])

      const [docs, k, c, pDocs, pKpis] = await Promise.all([
        getDocuments(),
        getDocumentDashboardKPIs(),
        getDocumentChartData(),
        getPassportDocuments(),
        getPassportKPIs(),
      ])

      setDocuments(docs)
      setPassports(pDocs)
      setKpis({
        ...k,
        passportValid: pKpis.valid,
        passportExpiringSoon: pKpis.expiringSoon,
        passportExpired: pKpis.expired,
      })
      setPassportKpis(pKpis)
      setChartData(c)

      // Trigger passport expiry notifications (server-side, non-blocking)
      checkAndCreatePassportExpiryNotifications().catch(() => {})
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filter documents list by passport filter from summary panel
  const filteredDocuments =
    passportFilter === 'all'
      ? documents
      : passportFilter === 'valid' || passportFilter === 'expiring_soon' || passportFilter === 'expired'
      ? documents.filter(d => {
          if (d.document_type !== 'passport' || !d.expiry_date) return false
          const { getPassportStatus } = require('@/lib/services/document-validation')
          return getPassportStatus(d.expiry_date) === passportFilter
        })
      : documents

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Enterprise Document Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage, verify, and track all travel documents &amp; passports
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex bg-card rounded-lg p-1 border border-border shadow-sm">
              <button
                onClick={() => setView('dashboard')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                  view === 'dashboard'
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <PieChart className="w-4 h-4" /> Dashboard
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                  view === 'list'
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="w-4 h-4" /> Documents
              </button>
            </div>

            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0A1221] text-white rounded-lg hover:bg-[#1a2744] transition-colors font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Upload Document
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">

            {/* Passport Summary Panel — always visible */}
            {passportKpis && (
              <PassportSummaryPanel
                kpis={passportKpis}
                onFilterChange={f => {
                  setPassportFilter(f)
                  setView('list')
                }}
                activeFilter={passportFilter}
              />
            )}

            {/* Passport Attention Panel — always visible */}
            <PassportAttentionPanel
              passports={passports}
              onViewPassport={doc => setSelectedDoc(doc)}
            />

            {/* Dashboard View */}
            {view === 'dashboard' && kpis && chartData && (
              <DocumentsDashboard kpis={kpis} chartData={chartData} />
            )}

            {/* List View */}
            {view === 'list' && (
              <DocumentsList
                documents={
                  passportFilter !== 'all'
                    ? passports.filter(d => {
                        if (!d.expiry_date) return false
                        // dynamic import already resolved; do inline filter
                        const today = new Date(); today.setHours(0,0,0,0)
                        const expiry = new Date(d.expiry_date); expiry.setHours(0,0,0,0)
                        const threshold = new Date(today); threshold.setMonth(threshold.getMonth() + 8)
                        if (passportFilter === 'expired') return expiry < today
                        if (passportFilter === 'expiring_soon') return expiry >= today && expiry <= threshold
                        if (passportFilter === 'valid') return expiry > threshold
                        return true
                      })
                    : documents
                }
                onSelect={setSelectedDoc}
              />
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUploadComplete={loadData}
      />

      {/* Document Detail Drawer */}
      {selectedDoc && (
        <DocumentDetail
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  )
}
