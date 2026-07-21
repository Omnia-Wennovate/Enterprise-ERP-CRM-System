'use client'

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { GripVertical, Plus, MoreVertical, DollarSign, Calendar, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getLeads, updateLeadStage } from '@/lib/services/leads'
import { logStageChanged } from '@/lib/services/lead-activities'
import { notifyStageChanged } from '@/lib/services/lead-notifications'
import type { LeadWithAgent } from '@/types/leads'
import {
  PIPELINE_STAGES,
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_COLORS,
  LEAD_SOURCE_LABELS,
  type LeadPipelineStage,
  type LeadSource,
} from '@/types/leads'

export interface LeadsKanbanRef {
  refreshLeads: () => Promise<void>
}

export const LeadsKanban = forwardRef<LeadsKanbanRef>(function LeadsKanban(_props, ref) {
  const [leads, setLeads] = useState<LeadWithAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchLeads = useCallback(async () => {
    try {
      const data = await getLeads()
      setLeads(data)
    } catch (err) {
      console.error('Failed to load leads:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Expose refresh method via ref so parent can trigger it
  useImperativeHandle(ref, () => ({
    refreshLeads: fetchLeads,
  }))

  const leadsByStage = PIPELINE_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = leads.filter((lead) => lead.pipeline_stage === stage)
      return acc
    },
    {} as Record<LeadPipelineStage, LeadWithAgent[]>,
  )

  // Calculate pipeline value per stage
  const stageValues = PIPELINE_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = leadsByStage[stage].reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0)
      return acc
    },
    {} as Record<LeadPipelineStage, number>,
  )

  const handleDragStart = (e: React.DragEvent, lead: LeadWithAgent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('leadId', lead.id)
    e.dataTransfer.setData('fromStage', lead.pipeline_stage)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, stage: LeadPipelineStage) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('leadId')
    const fromStage = e.dataTransfer.getData('fromStage')
    const lead = leads.find((l) => l.id === leadId)

    if (lead && lead.pipeline_stage !== stage) {
      // Optimistic update
      const updated = leads.map((l) =>
        l.id === leadId ? { ...l, pipeline_stage: stage } : l
      )
      setLeads(updated)

      try {
        // Persist to Supabase
        await updateLeadStage(leadId, stage)

        // Log activity
        await logStageChanged(leadId, fromStage, stage).catch(() => {})

        // Send notification
        await notifyStageChanged(
          lead.lead_name,
          leadId,
          PIPELINE_STAGE_LABELS[stage],
          lead.assigned_to || undefined
        ).catch(() => {})
      } catch {
        // Revert on failure
        setLeads(leads)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          <p className="text-sm text-gray-500">Loading pipeline...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 p-4 min-w-max">
        {PIPELINE_STAGES.map((stage) => {
          const config = PIPELINE_STAGE_COLORS[stage]
          return (
            <div key={stage} className="flex flex-col w-80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold text-sm ${config.text}`}>
                    {PIPELINE_STAGE_LABELS[stage]}
                  </h3>
                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                    {leadsByStage[stage].length}
                  </span>
                  {stageValues[stage] > 0 && (
                    <span className="text-xs text-gray-400 font-medium">
                      ${stageValues[stage].toLocaleString()}
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div
                className="flex-1 space-y-3 bg-gray-50 rounded-lg p-3 min-h-96"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
              >
                {leadsByStage[stage].map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    className="bg-white p-3 rounded-lg border border-gray-200 hover:border-teal-300 hover:shadow-md cursor-move transition-all"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <GripVertical className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">
                          {lead.lead_name}
                        </h4>
                        <p className="text-xs text-gray-600 truncate">
                          {lead.company || lead.contact_person || lead.email}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Value:
                        </span>
                        <span className="font-semibold text-xs text-teal-700">
                          {lead.currency} {Number(lead.estimated_value).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Close Date:
                        </span>
                        <span className="text-xs text-gray-700">
                          {new Date(lead.expected_close_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded ${config.bg} ${config.text}`}>
                          {PIPELINE_STAGE_LABELS[stage]}
                        </span>
                        {lead.lead_source && (
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                            {LEAD_SOURCE_LABELS[lead.lead_source as LeadSource] || lead.lead_source}
                          </span>
                        )}
                      </div>
                      {lead.assigned_agent && (
                        <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100">
                          <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-teal-700">
                              {lead.assigned_agent.full_name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 truncate">
                            {lead.assigned_agent.full_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {leadsByStage[stage].length === 0 && (
                  <div className="flex items-center justify-center h-32 text-gray-400">
                    <p className="text-sm">No leads</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
