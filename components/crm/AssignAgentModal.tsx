'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSalesAgents, updateLeadAssignment } from '@/lib/services/leads'
import { logAssigned } from '@/lib/services/lead-activities'
import type { LeadWithAgent, SalesAgent } from '@/types/leads'

interface Props {
  isOpen: boolean
  lead: LeadWithAgent
  onClose: () => void
  onAssigned: (updatedLead: LeadWithAgent) => void
}

export function AssignAgentModal({ isOpen, lead, onClose, onAssigned }: Props) {
  const [agents, setAgents] = useState<SalesAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>(lead.assigned_to || '')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setSelectedId(lead.assigned_to || '')
    setIsLoading(true)
    getSalesAgents()
      .then(setAgents)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [isOpen, lead.assigned_to])

  const handleAssign = async () => {
    setIsSaving(true)
    try {
      await updateLeadAssignment(lead.id, selectedId || null)
      const agent = agents.find((a) => a.id === selectedId)
      await logAssigned(lead.id, lead.lead_name, agent?.full_name || 'Unknown').catch(() => {})
      onAssigned({
        ...lead,
        assigned_to: selectedId || null,
        assigned_agent: agent ? { id: agent.id, full_name: agent.full_name, avatar_url: agent.avatar_url } : null,
      })
      onClose()
    } catch (err) {
      console.error('Failed to assign agent:', err)
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] w-[420px] bg-white rounded-2xl shadow-2xl border border-gray-200"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">Assign Sales Agent</h2>
                <p className="text-xs text-gray-500 mt-0.5">{lead.lead_name}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {/* Unassign option */}
                  <button
                    onClick={() => setSelectedId('')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      selectedId === '' ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-500 italic">Unassigned</span>
                    {selectedId === '' && <Check className="w-4 h-4 text-teal-600 ml-auto" />}
                  </button>

                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedId(agent.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        selectedId === agent.id ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 font-bold text-teal-700 text-sm">
                        {agent.full_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{agent.full_name}</p>
                        <p className="text-xs text-gray-500 capitalize">{agent.role?.replace('_', ' ')}</p>
                      </div>
                      {selectedId === agent.id && <Check className="w-4 h-4 text-teal-600 ml-auto flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
              <Button
                onClick={handleAssign}
                disabled={isSaving}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Assign
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
