'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateLeadStage } from '@/lib/services/leads'
import { logStageChanged } from '@/lib/services/lead-activities'
import type { LeadWithAgent, LeadPipelineStage } from '@/types/leads'
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, PIPELINE_STAGE_COLORS } from '@/types/leads'

interface Props {
  isOpen: boolean
  lead: LeadWithAgent
  onClose: () => void
  onMoved: (updatedLead: LeadWithAgent) => void
}

export function MoveStageModal({ isOpen, lead, onClose, onMoved }: Props) {
  const [selectedStage, setSelectedStage] = useState<LeadPipelineStage>(lead.pipeline_stage)
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleMove = async () => {
    if (selectedStage === lead.pipeline_stage) { onClose(); return }
    setIsSaving(true)
    try {
      const updated = await updateLeadStage(lead.id, selectedStage)
      await logStageChanged(lead.id, lead.pipeline_stage, selectedStage, undefined).catch(() => {})
      onMoved({ ...lead, ...updated, assigned_agent: lead.assigned_agent })
      onClose()
    } catch (err) {
      console.error('Failed to move stage:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] w-[440px] bg-white rounded-2xl shadow-2xl border border-gray-200"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">Move Pipeline Stage</h2>
                <p className="text-xs text-gray-500 mt-0.5">{lead.lead_name}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Current → Target indicator */}
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className={`px-2.5 py-1 rounded-lg font-medium text-xs ${PIPELINE_STAGE_COLORS[lead.pipeline_stage].bg} ${PIPELINE_STAGE_COLORS[lead.pipeline_stage].text}`}>
                  {PIPELINE_STAGE_LABELS[lead.pipeline_stage]}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                {selectedStage !== lead.pipeline_stage ? (
                  <span className={`px-2.5 py-1 rounded-lg font-medium text-xs ${PIPELINE_STAGE_COLORS[selectedStage].bg} ${PIPELINE_STAGE_COLORS[selectedStage].text}`}>
                    {PIPELINE_STAGE_LABELS[selectedStage]}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs italic">select a stage</span>
                )}
              </div>

              {/* Stage selection grid */}
              <div className="grid grid-cols-2 gap-2">
                {PIPELINE_STAGES.map((stage) => {
                  const config = PIPELINE_STAGE_COLORS[stage]
                  const isCurrent = stage === lead.pipeline_stage
                  const isSelected = stage === selectedStage
                  return (
                    <button
                      key={stage}
                      disabled={isCurrent}
                      onClick={() => setSelectedStage(stage)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        isCurrent
                          ? 'opacity-40 cursor-not-allowed border-transparent bg-gray-50'
                          : isSelected
                          ? `border-teal-400 ${config.bg}`
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-sm font-semibold ${isSelected ? config.text : 'text-gray-700'}`}>
                        {PIPELINE_STAGE_LABELS[stage]}
                      </span>
                      {isCurrent && <p className="text-[10px] text-gray-400 mt-0.5">Current</p>}
                    </button>
                  )
                })}
              </div>

              {/* Optional note */}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note about this move (optional)"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none resize-none"
              />
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
              <Button
                onClick={handleMove}
                disabled={isSaving || selectedStage === lead.pipeline_stage}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Move to {PIPELINE_STAGE_LABELS[selectedStage]}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
