'use client'

import { useState, useEffect } from 'react'
import { FileText, ChevronRight, Calendar, Users, MapPin } from 'lucide-react'
import type { Quotation, QuotationStatus } from '@/types'
import { storage } from '@/lib/storage'
import { Button } from '@/components/ui/button'

const STATUS_CONFIG: Record<QuotationStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  sent: { label: 'Sent', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  viewed: { label: 'Viewed', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  accepted: { label: 'Accepted', color: 'text-green-700', bgColor: 'bg-green-100' },
  rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
  expired: { label: 'Expired', color: 'text-orange-700', bgColor: 'bg-orange-100' },
}

export function QuotationsList() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setQuotations(storage.getQuotations())
    setIsLoading(false)
  }, [])

  if (isLoading) return <div className="p-4">Loading quotations...</div>

  return (
    <div className="flex gap-6 h-full">
      {/* List */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {quotations.map((quote) => (
          <div
            key={quote.id}
            onClick={() => setSelectedQuotation(quote)}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-teal-300 hover:shadow-md cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <h3 className="font-semibold text-gray-900">{quote.quote_number}</h3>
                </div>
                <p className="text-sm text-gray-600 truncate">{quote.customer_name}</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0 ml-2 ${STATUS_CONFIG[quote.status].bgColor} ${STATUS_CONFIG[quote.status].color}`}
              >
                {STATUS_CONFIG[quote.status].label}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{quote.trip_destination}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{new Date(quote.trip_start_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span>{quote.num_travelers} travelers</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <span className="text-sm font-semibold text-teal-700">
                ${quote.total_amount.toLocaleString()} {quote.currency}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      {selectedQuotation && (
        <div className="w-96 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Quotation Details</h3>
            <Button variant="ghost" size="icon" onClick={() => setSelectedQuotation(null)}>
              ×
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Quote Number</p>
              <p className="font-semibold text-gray-900">{selectedQuotation.quote_number}</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Customer</p>
              <p className="text-gray-900">{selectedQuotation.customer_name}</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Status</p>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_CONFIG[selectedQuotation.status].bgColor} ${STATUS_CONFIG[selectedQuotation.status].color}`}
              >
                {STATUS_CONFIG[selectedQuotation.status].label}
              </span>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Trip Details</p>
              <div className="bg-gray-50 p-2 rounded text-sm space-y-1">
                <p className="font-semibold text-gray-900">{selectedQuotation.trip_destination}</p>
                <p className="text-gray-600">
                  {new Date(selectedQuotation.trip_start_date).toLocaleDateString()} -{' '}
                  {new Date(selectedQuotation.trip_end_date).toLocaleDateString()}
                </p>
                <p className="text-gray-600">{selectedQuotation.num_travelers} travelers</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Amount</p>
              <p className="font-semibold text-teal-700 text-lg">
                ${selectedQuotation.total_amount.toLocaleString()} {selectedQuotation.currency}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Valid Until</p>
              <p className="text-gray-700">{new Date(selectedQuotation.valid_until).toLocaleDateString()}</p>
            </div>

            {selectedQuotation.sent_at && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Sent</p>
                <p className="text-gray-700">{new Date(selectedQuotation.sent_at).toLocaleDateString()}</p>
              </div>
            )}

            {selectedQuotation.accepted_at && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Accepted</p>
                <p className="text-gray-700">{new Date(selectedQuotation.accepted_at).toLocaleDateString()}</p>
              </div>
            )}

            {selectedQuotation.notes && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{selectedQuotation.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
