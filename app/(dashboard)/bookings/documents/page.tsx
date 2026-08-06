'use client'

import React, { useState, useEffect } from 'react'
import { 
  FileText, Plus, Search, Filter, RefreshCw, LayoutGrid, List as ListIcon, PieChart
} from 'lucide-react'
import { DocumentsDashboard } from '@/components/bookings/documents/DocumentsDashboard'
import { DocumentsList } from '@/components/bookings/documents/DocumentsList'
import { DocumentUploadModal } from '@/components/bookings/documents/DocumentUploadModal'
import { DocumentDetail } from '@/components/bookings/documents/DocumentDetail'
import type { Document, DocumentDashboardKPIs, DocumentChartData, DocumentSearchParams } from '@/types/documents'

type ViewMode = 'dashboard' | 'list'

export default function DocumentsPage() {
  const [view, setView] = useState<ViewMode>('dashboard')
  const [documents, setDocuments] = useState<Document[]>([])
  const [kpis, setKpis] = useState<DocumentDashboardKPIs | null>(null)
  const [chartData, setChartData] = useState<DocumentChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const { getDocuments, getDocumentDashboardKPIs, getDocumentChartData } = await import('@/lib/services/documents')
      const [docs, k, c] = await Promise.all([
        getDocuments(),
        getDocumentDashboardKPIs(),
        getDocumentChartData()
      ])
      setDocuments(docs)
      setKpis(k)
      setChartData(c)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Enterprise Document Center</h1>
            <p className="text-muted-foreground mt-1">Manage, verify, and track all travel documents</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-card rounded-lg p-1 border border-border shadow-sm">
              <button 
                onClick={() => setView('dashboard')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                  view === 'dashboard' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <PieChart className="w-4 h-4" /> Dashboard
              </button>
              <button 
                onClick={() => setView('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                  view === 'list' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="w-4 h-4" /> Documents
              </button>
            </div>
            
            <button 
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-primary-foreground rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Upload Document
            </button>
          </div>
        </div>

        {/* Content area */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <>
            {view === 'dashboard' && kpis && chartData && (
              <DocumentsDashboard kpis={kpis} chartData={chartData} />
            )}
            
            {view === 'list' && (
              <div className="space-y-6">
                {/* Search stub - expandable */}
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Search documents by name, booking, traveler..." 
                      className="w-full pl-10 pr-4 py-2 bg-muted/50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button className="p-2 text-muted-foreground hover:text-indigo-600 bg-muted/50 rounded-lg hover:bg-indigo-50 transition-colors">
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
                
                <DocumentsList documents={documents} onSelect={setSelectedDoc} />
              </div>
            )}
          </>
        )}

      </div>
      
      <DocumentUploadModal 
        isOpen={showUpload} 
        onClose={() => setShowUpload(false)} 
        onUploadComplete={loadData}
      />
      
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
