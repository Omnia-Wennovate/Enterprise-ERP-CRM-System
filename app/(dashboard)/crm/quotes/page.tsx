'use client'

import { useState } from 'react'
import { Plus, FileText } from 'lucide-react'
import { QuotationsList } from '@/components/crm/QuotationsList'
import { NewQuotationModal } from '@/components/crm/NewQuotationModal'
import { Button } from '@/components/ui/button'

import { PageHeader } from '@/components/ui/PageHeader'

export default function QuotationsPage() {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [refreshKey, setRefreshKey]         = useState(0)

  const handleNewQuoteSuccess = () => {
    setIsNewModalOpen(false)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── HEADER ── */}
      <div className="border-b border-border bg-card px-6 py-4 flex-shrink-0">
        <PageHeader
          kicker="CRM"
          title="Quotations"
          subtitle="Create and track professional travel quotations"
          actions={
            <Button
              onClick={() => setIsNewModalOpen(true)}
              variant="gold"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Quote
            </Button>
          }
        />
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
