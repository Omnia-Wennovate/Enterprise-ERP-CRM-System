'use client'

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import {
  GripVertical,
  Plus,
  MoreVertical,
  DollarSign,
  Calendar,
  Loader2,
  Eye,
  Pencil,
  UserCheck,
  ArrowRight,
  Copy,
  Archive,
  Trash2,
  UserCheck2,
  BookOpen,
  FileText,
  Clock,
  MessageSquare,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getLeads, updateLeadStage, archiveLead, deleteLead, duplicateLead } from '@/lib/services/leads'
import { logStageChanged, logArchived } from '@/lib/services/lead-activities'
import { notifyStageChanged } from '@/lib/services/lead-notifications'
import { createClient } from '@/lib/supabase/client'
import type { LeadWithAgent } from '@/types/leads'
import {
  PIPELINE_STAGES,
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_COLORS,
  LEAD_SOURCE_LABELS,
  type LeadPipelineStage,
  type LeadSource,
} from '@/types/leads'
import { LeadDetailPanel } from './LeadDetailPanel'
import { LeadEditModal } from './LeadEditModal'
import { MoveStageModal } from './MoveStageModal'
import { AssignAgentModal } from './AssignAgentModal'
import { ConvertLeadModal } from './ConvertLeadModal'

export interface LeadsKanbanRef {
  refreshLeads: () => Promise<void>
}

type MenuAction =
  | 'view'
  | 'edit'
  | 'assign'
  | 'move'
  | 'duplicate'
  | 'archive'
  | 'delete'
  | 'convert'
  | 'booking'
  | 'quotation'
  | 'followup'
  | 'note'

interface ContextMenuState {
  lead: LeadWithAgent
  x: number
  y: number
}

export const LeadsKanban = forwardRef<LeadsKanbanRef>(function LeadsKanban(_props, ref) {
  const [leads, setLeads] = useState<LeadWithAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)

  // Sub-modal states driven from the context menu
  const [menuLead, setMenuLead] = useState<LeadWithAgent | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [showMoveStage, setShowMoveStage] = useState(false)
  const [showConvert, setShowConvert] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)

  // ── FETCH ─────────────────────────────────────────────────────────────────
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

  useEffect(() => { fetchLeads() }, [fetchLeads])

  useImperativeHandle(ref, () => ({ refreshLeads: fetchLeads }))

  // ── SUPABASE REALTIME ──────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('kanban-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchLeads()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchLeads])

  // ── CLOSE CONTEXT MENU ON OUTSIDE CLICK ───────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── BOARD STATE ───────────────────────────────────────────────────────────
  const activeStages = PIPELINE_STAGES.filter((s) => s !== 'archived')

  const leadsByStage = activeStages.reduce(
    (acc, stage) => {
      acc[stage] = leads.filter((lead) => lead.pipeline_stage === stage)
      return acc
    },
    {} as Record<LeadPipelineStage, LeadWithAgent[]>,
  )

  const stageValues = activeStages.reduce(
    (acc, stage) => {
      acc[stage] = (leadsByStage[stage] || []).reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0)
      return acc
    },
    {} as Record<LeadPipelineStage, number>,
  )

  // ── DRAG & DROP ───────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, lead: LeadWithAgent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('leadId', lead.id)
    e.dataTransfer.setData('fromStage', lead.pipeline_stage)
    setDraggedLeadId(lead.id)
  }

  const handleDragEnd = () => setDraggedLeadId(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, stage: LeadPipelineStage) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('leadId')
    const fromStage = e.dataTransfer.getData('fromStage') as LeadPipelineStage
    const lead = leads.find((l) => l.id === leadId)

    if (lead && lead.pipeline_stage !== stage) {
      // Optimistic update
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, pipeline_stage: stage } : l))
      try {
        await updateLeadStage(leadId, stage)
        await logStageChanged(leadId, fromStage, stage).catch(() => {})
        await notifyStageChanged(
          lead.lead_name,
          leadId,
          PIPELINE_STAGE_LABELS[stage],
          lead.assigned_to || undefined
        ).catch(() => {})
      } catch {
        setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, pipeline_stage: fromStage } : l))
      }
    }
    setDraggedLeadId(null)
  }

  // ── CONTEXT MENU ──────────────────────────────────────────────────────────
  const openMenu = (e: React.MouseEvent, lead: LeadWithAgent) => {
    e.stopPropagation()
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setContextMenu({ lead, x: rect.right, y: rect.top })
  }

  const handleMenuAction = async (action: MenuAction, lead: LeadWithAgent) => {
    setContextMenu(null)
    switch (action) {
      case 'view':
        setSelectedLeadId(lead.id)
        break
      case 'edit':
        setMenuLead(lead)
        setShowEdit(true)
        break
      case 'assign':
        setMenuLead(lead)
        setShowAssign(true)
        break
      case 'move':
        setMenuLead(lead)
        setShowMoveStage(true)
        break
      case 'convert':
      case 'booking':
      case 'quotation':
        setMenuLead(lead)
        setShowConvert(true)
        break
      case 'followup':
        setSelectedLeadId(lead.id)
        break
      case 'note':
        setSelectedLeadId(lead.id)
        break
      case 'duplicate':
        try {
          await duplicateLead(lead.id)
          await fetchLeads()
        } catch (err) {
          console.error('Duplicate failed:', err)
        }
        break
      case 'archive':
        if (confirm(`Archive "${lead.lead_name}"? It will be hidden from the board.`)) {
          try {
            await archiveLead(lead.id)
            await logArchived(lead.id, lead.lead_name).catch(() => {})
            setLeads((prev) => prev.filter((l) => l.id !== lead.id))
          } catch (err) {
            console.error('Archive failed:', err)
          }
        }
        break
      case 'delete':
        if (confirm(`Permanently delete "${lead.lead_name}"? This cannot be undone.`)) {
          try {
            await deleteLead(lead.id)
            setLeads((prev) => prev.filter((l) => l.id !== lead.id))
          } catch (err) {
            console.error('Delete failed:', err)
          }
        }
        break
    }
  }

  // ── LEAD PANEL UPDATES ────────────────────────────────────────────────────
  const handleLeadUpdated = (updated: LeadWithAgent) => {
    setLeads((prev) => prev.map((l) => l.id === updated.id ? updated : l))
  }

  const handleMenuLeadSaved = (updated: LeadWithAgent) => {
    setLeads((prev) => prev.map((l) => l.id === updated.id ? updated : l))
    setMenuLead(null)
  }

  const handleMenuAssigned = (updated: LeadWithAgent) => {
    setLeads((prev) => prev.map((l) => l.id === updated.id ? updated : l))
    setMenuLead(null)
  }

  const handleMenuMoved = (updated: LeadWithAgent) => {
    setLeads((prev) => prev.map((l) => l.id === updated.id ? updated : l))
    setMenuLead(null)
  }

  // ── CONTEXT MENU ITEMS ────────────────────────────────────────────────────
  const MENU_ITEMS: { action: MenuAction; label: string; icon: React.ComponentType<{ className?: string }>; danger?: boolean; divider?: boolean }[] = [
    { action: 'view',      label: 'View Details',         icon: Eye },
    { action: 'edit',      label: 'Edit Lead',            icon: Pencil },
    { action: 'assign',    label: 'Assign Sales Agent',   icon: UserCheck },
    { action: 'move',      label: 'Move Stage',           icon: ArrowRight },
    { action: 'duplicate', label: 'Duplicate',            icon: Copy, divider: true },
    { action: 'archive',   label: 'Archive',              icon: Archive },
    { action: 'delete',    label: 'Delete',               icon: Trash2, danger: true, divider: true },
    { action: 'convert',   label: 'Convert to Customer',  icon: UserCheck2 },
    { action: 'booking',   label: 'Convert to Booking',   icon: BookOpen },
    { action: 'quotation', label: 'Generate Quotation',   icon: FileText, divider: true },
    { action: 'followup',  label: 'Schedule Follow-up',   icon: Clock },
    { action: 'note',      label: 'Add Internal Note',    icon: MessageSquare },
  ]

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-omnia-gold animate-spin" />
          <p className="text-sm text-muted-foreground">Loading pipeline...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ── KANBAN BOARD ──────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <div className="flex gap-6 p-4 min-w-max">
          {activeStages.map((stage) => {
            const config = PIPELINE_STAGE_COLORS[stage]
            const stageleads = leadsByStage[stage] || []
            return (
              <div key={stage} className="flex flex-col w-80">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold text-sm ${config.text}`}>
                      {PIPELINE_STAGE_LABELS[stage]}
                    </h3>
                    <span className="bg-gray-200 text-foreground text-xs px-2 py-0.5 rounded-full">
                      {stageleads.length}
                    </span>
                    {stageValues[stage] > 0 && (
                      <span className="text-xs text-muted-foreground font-medium">
                        ${stageValues[stage].toLocaleString()}
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Drop zone */}
                <div
                  className={`flex-1 space-y-3 rounded-lg p-3 min-h-96 transition-colors ${
                    draggedLeadId ? 'bg-omnia-gold/10/60 border-2 border-dashed border-omnia-gold/20' : 'bg-muted'
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage)}
                >
                  {stageleads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`bg-card p-3 rounded-lg border hover:border-omnia-gold/40 hover:shadow-md cursor-pointer transition-all select-none ${
                        draggedLeadId === lead.id ? 'opacity-40 border-omnia-gold/60 shadow-lg scale-95' : 'border-border'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-foreground truncate">
                            {lead.lead_name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {lead.company || lead.contact_person || lead.email}
                          </p>
                        </div>
                        <button
                          onClick={(e) => openMenu(e, lead)}
                          className="p-1 rounded-md hover:bg-muted transition-colors flex-shrink-0"
                        >
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> Value:
                          </span>
                          <span className="font-semibold text-xs text-omnia-gold-dark">
                            {lead.currency} {Number(lead.estimated_value).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Close Date:
                          </span>
                          <span className="text-xs text-foreground">
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
                            <div className="w-5 h-5 rounded-full bg-omnia-gold/15 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-omnia-gold-dark">
                                {lead.assigned_agent.full_name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground truncate">
                              {lead.assigned_agent.full_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {stageleads.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <p className="text-sm">No leads</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── CONTEXT MENU ──────────────────────────────────────────────────── */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-[150] bg-card rounded-xl shadow-2xl border border-border py-1.5 w-52 overflow-hidden"
          style={{ left: Math.min(contextMenu.x, window.innerWidth - 220), top: Math.min(contextMenu.y, window.innerHeight - 400) }}
        >
          <div className="px-3 py-2 border-b border-gray-100 mb-1">
            <p className="text-xs font-semibold text-foreground truncate">{contextMenu.lead.lead_name}</p>
          </div>
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.action}>
                {item.divider && <div className="h-px bg-muted my-1" />}
                <button
                  onClick={() => handleMenuAction(item.action, contextMenu.lead)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                    item.danger
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── LEAD DETAIL PANEL ─────────────────────────────────────────────── */}
      <LeadDetailPanel
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onLeadUpdated={handleLeadUpdated}
      />

      {/* ── MENU-DRIVEN MODALS ─────────────────────────────────────────────── */}
      {menuLead && (
        <>
          <LeadEditModal
            isOpen={showEdit}
            lead={menuLead}
            onClose={() => { setShowEdit(false); setMenuLead(null) }}
            onSaved={handleMenuLeadSaved}
          />
          <AssignAgentModal
            isOpen={showAssign}
            lead={menuLead}
            onClose={() => { setShowAssign(false); setMenuLead(null) }}
            onAssigned={handleMenuAssigned}
          />
          <MoveStageModal
            isOpen={showMoveStage}
            lead={menuLead}
            onClose={() => { setShowMoveStage(false); setMenuLead(null) }}
            onMoved={handleMenuMoved}
          />
          <ConvertLeadModal
            isOpen={showConvert}
            lead={menuLead}
            onClose={() => { setShowConvert(false); setMenuLead(null) }}
          />
        </>
      )}
    </>
  )
})
