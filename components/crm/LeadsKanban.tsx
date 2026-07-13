'use client'

import { useState, useEffect } from 'react'
import { GripVertical, Plus, MoreVertical } from 'lucide-react'
import type { Lead, LeadStatus } from '@/types'
import { storage } from '@/lib/storage'
import { Button } from '@/components/ui/button'

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bgColor: string }> = {
  new: { label: 'New', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  qualified: { label: 'Qualified', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  proposal: { label: 'Proposal', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  negotiation: { label: 'Negotiation', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  won: { label: 'Won', color: 'text-green-700', bgColor: 'bg-green-100' },
  lost: { label: 'Lost', color: 'text-red-700', bgColor: 'bg-red-100' },
}

const STATUSES: LeadStatus[] = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

export function LeadsKanban() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setLeads(storage.getLeads())
    setIsLoading(false)
  }, [])

  const leadsByStatus = STATUSES.reduce(
    (acc, status) => {
      acc[status] = leads.filter((lead) => lead.status === status)
      return acc
    },
    {} as Record<LeadStatus, Lead[]>,
  )

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('leadId', lead.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('leadId')
    const lead = leads.find((l) => l.id === leadId)
    if (lead && lead.status !== status) {
      const updated = leads.map((l) => (l.id === leadId ? { ...l, status } : l))
      setLeads(updated)
      storage.setLeads(updated)
    }
  }

  if (isLoading) return <div className="p-4">Loading leads...</div>

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 p-4 min-w-max">
        {STATUSES.map((status) => (
          <div key={status} className="flex flex-col w-80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold text-sm ${STATUS_CONFIG[status].color}`}>
                  {STATUS_CONFIG[status].label}
                </h3>
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                  {leadsByStatus[status].length}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div
              className="flex-1 space-y-3 bg-gray-50 rounded-lg p-3 min-h-96"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              {leadsByStatus[status].map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead)}
                  className="bg-white p-3 rounded-lg border border-gray-200 hover:border-teal-300 hover:shadow-md cursor-move transition-all"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <GripVertical className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">{lead.company_name}</h4>
                      <p className="text-xs text-gray-600 truncate">{lead.contact_name}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Value:</span>
                      <span className="font-semibold text-xs text-teal-700">${lead.estimated_value.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Close Date:</span>
                      <span className="text-xs text-gray-700">{new Date(lead.expected_close_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS_CONFIG[status].bgColor} ${STATUS_CONFIG[status].color}`}>
                        {STATUS_CONFIG[status].label}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">{lead.source}</span>
                    </div>
                  </div>
                </div>
              ))}

              {leadsByStatus[status].length === 0 && (
                <div className="flex items-center justify-center h-32 text-gray-400">
                  <p className="text-sm">No leads</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
