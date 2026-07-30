'use client'

import { useState } from 'react'
import { Plus, FileText } from 'lucide-react'
import { QuotationsList } from '@/components/crm/QuotationsList'
import { NewQuotationModal } from '@/components/crm/NewQuotationModal'
import { Button } from '@/components/ui/button'

export default function QuotationsPage() {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [refreshKey, setRefreshKey]         = useState(0)

  const handleNewQuoteSuccess = () => {
    setIsNewModalOpen(false)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="flex flex-col h-full bg-[#F0F7FA]">
      {/* ── HEADER ── */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-50">
              <FileText className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Quotations</h1>
              <p className="text-xs text-gray-500">Create and track professional travel quotations</p>
            </div>
          </div>
          <Button
            onClick={() => setIsNewModalOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            New Quote
          </Button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-hidden">
        <QuotationsList refreshKey={refreshKey} />
      </div>

      {/* ── NEW QUOTATION MODAL ── */}
      <NewQuotationModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={handleNewQuoteSuccess}
      />
    </div>
  )
}
