'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Phone,
  Mail,
  Globe,
  MapPin,
  DollarSign,
  Calendar,
  Plane,
  Users,
  Baby,
  Hotel,
  Shield,
  User,
  Building2,
  Briefcase,
  Tag,
  Pencil,
  ArrowRight,
  UserCheck,
  FileText,
  Clock,
  MessageSquare,
  Paperclip,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getLeadById } from '@/lib/services/leads'
import { getSalesAgents } from '@/lib/services/leads'
import { LeadActivityTimeline } from './LeadActivityTimeline'
import { LeadDocumentsTab } from './LeadDocumentsTab'
import { FollowUpForm } from './FollowUpForm'
import { LeadNoteEditor } from './LeadNoteEditor'
import { LeadEditModal } from './LeadEditModal'
import { MoveStageModal } from './MoveStageModal'
import { AssignAgentModal } from './AssignAgentModal'
import { ConvertLeadModal } from './ConvertLeadModal'
import type { LeadWithAgent, SalesAgent } from '@/types/leads'
import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  LEAD_SOURCE_LABELS,
  TRAVEL_TYPE_LABELS,
  type LeadSource,
  type TravelType,
} from '@/types/leads'

type Tab = 'overview' | 'activity' | 'documents' | 'followups' | 'notes'

interface Props {
  leadId: string | null
  onClose: () => void
  onLeadUpdated: (lead: LeadWithAgent) => void
  onLeadArchived?: (leadId: string) => void
}

function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | number | null | boolean; icon?: React.ComponentType<{ className?: string }> }) {
  if (value === null || value === undefined || value === '') return null
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-1.5 w-36 flex-shrink-0">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <span className="text-sm text-gray-800 break-words flex-1">{display}</span>
    </div>
  )
}

export function LeadDetailPanel({ leadId, onClose, onLeadUpdated, onLeadArchived }: Props) {
  const [lead, setLead] = useState<LeadWithAgent | null>(null)
  const [agents, setAgents] = useState<SalesAgent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [activityRefresh, setActivityRefresh] = useState(0)

  // Sub-modal states
  const [showEdit, setShowEdit] = useState(false)
  const [showMoveStage, setShowMoveStage] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [showConvert, setShowConvert] = useState(false)

  const fetchLead = useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      const data = await getLeadById(id)
      setLead(data)
    } catch (err) {
      console.error('Failed to load lead:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (leadId) {
      fetchLead(leadId)
      setActiveTab('overview')
    } else {
      setLead(null)
    }
  }, [leadId, fetchLead])

  useEffect(() => {
    getSalesAgents().then(setAgents).catch(console.error)
  }, [])

  const handleLeadSaved = (updated: LeadWithAgent) => {
    setLead(updated)
    onLeadUpdated(updated)
    setActivityRefresh((n) => n + 1)
  }

  const handleMoved = (updated: LeadWithAgent) => {
    setLead(updated)
    onLeadUpdated(updated)
    setActivityRefresh((n) => n + 1)
  }

  const handleAssigned = (updated: LeadWithAgent) => {
    setLead(updated)
    onLeadUpdated(updated)
    setActivityRefresh((n) => n + 1)
  }

  const refreshActivity = () => setActivityRefresh((n) => n + 1)

  const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview',  label: 'Overview',  icon: User },
    { id: 'activity',  label: 'Activity',  icon: Clock },
    { id: 'documents', label: 'Documents', icon: Paperclip },
    { id: 'followups', label: 'Follow-ups', icon: Calendar },
    { id: 'notes',     label: 'Notes',     icon: MessageSquare },
  ]

  if (!leadId) return null

  return (
    <>
      <AnimatePresence>
        {leadId && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[100]"
              onClick={onClose}
            />

            {/* Slide-over panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-[620px] bg-card shadow-2xl z-[110] flex flex-col border-l border-gray-200"
            >
              {isLoading || !lead ? (
                <div className="flex flex-col items-center justify-center flex-1">
                  <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-3" />
                  <p className="text-sm text-gray-500">Loading lead details...</p>
                </div>
              ) : (
                <>
                  {/* ── HEADER ────────────────────────────────────────────── */}
                  <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-primary-foreground flex-shrink-0">
                    {/* Top bar */}
                    <div className="flex items-start justify-between px-5 pt-4 pb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PIPELINE_STAGE_COLORS[lead.pipeline_stage].bg} ${PIPELINE_STAGE_COLORS[lead.pipeline_stage].text}`}>
                            {PIPELINE_STAGE_LABELS[lead.pipeline_stage]}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_COLORS[lead.priority].bg} ${PRIORITY_COLORS[lead.priority].text}`}>
                            {PRIORITY_LABELS[lead.priority]}
                          </span>
                          {lead.pipeline_stage === 'won' && (
                            <button
                              onClick={() => setShowConvert(true)}
                              className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Convert
                            </button>
                          )}
                        </div>
                        <h2 className="text-xl font-bold text-primary-foreground truncate">{lead.lead_name}</h2>
                        {lead.company && (
                          <p className="text-sm text-teal-200 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {lead.company}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-card/20 transition-colors flex-shrink-0 ml-3"
                      >
                        <X className="w-5 h-5 text-primary-foreground" />
                      </button>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 divide-x divide-teal-500/40 px-0 border-t border-teal-500/30">
                      <div className="px-5 py-3">
                        <p className="text-[11px] text-teal-300 uppercase tracking-wider">Value</p>
                        <p className="text-base font-bold text-primary-foreground">
                          {lead.currency} {Number(lead.estimated_value).toLocaleString()}
                        </p>
                      </div>
                      <div className="px-5 py-3">
                        <p className="text-[11px] text-teal-300 uppercase tracking-wider">Close Date</p>
                        <p className="text-base font-bold text-primary-foreground">
                          {lead.expected_close_date ? new Date(lead.expected_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </p>
                      </div>
                      <div className="px-5 py-3">
                        <p className="text-[11px] text-teal-300 uppercase tracking-wider">Probability</p>
                        <p className="text-base font-bold text-primary-foreground">{lead.probability}%</p>
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-1.5 px-5 py-3 border-t border-teal-500/30 overflow-x-auto">
                      <button
                        onClick={() => setShowEdit(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/15 hover:bg-card/25 text-primary-foreground text-xs font-medium transition-all whitespace-nowrap"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => setShowMoveStage(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/15 hover:bg-card/25 text-primary-foreground text-xs font-medium transition-all whitespace-nowrap"
                      >
                        <ArrowRight className="w-3.5 h-3.5" /> Move Stage
                      </button>
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/15 hover:bg-card/25 text-primary-foreground text-xs font-medium transition-all whitespace-nowrap"
                        >
                          <Phone className="w-3.5 h-3.5" /> Call
                        </a>
                      )}
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/15 hover:bg-card/25 text-primary-foreground text-xs font-medium transition-all whitespace-nowrap"
                        >
                          <Mail className="w-3.5 h-3.5" /> Email
                        </a>
                      )}
                      <button
                        onClick={() => setShowAssign(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/15 hover:bg-card/25 text-primary-foreground text-xs font-medium transition-all whitespace-nowrap"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Assign
                      </button>
                      {lead.pipeline_stage === 'won' && (
                        <button
                          onClick={() => setShowConvert(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/30 hover:bg-green-500/50 text-primary-foreground text-xs font-medium transition-all whitespace-nowrap"
                        >
                          <FileText className="w-3.5 h-3.5" /> Convert
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── AGENT BADGE ───────────────────────────────────────── */}
                  {lead.assigned_agent && (
                    <div className="flex items-center gap-2 px-5 py-2.5 bg-teal-50 border-b border-teal-100">
                      <div className="w-6 h-6 rounded-full bg-teal-200 flex items-center justify-center text-[11px] font-bold text-teal-800 flex-shrink-0">
                        {lead.assigned_agent.full_name?.charAt(0) || '?'}
                      </div>
                      <span className="text-xs text-teal-700 font-medium">
                        Assigned to {lead.assigned_agent.full_name}
                      </span>
                    </div>
                  )}

                  {/* ── TABS ──────────────────────────────────────────────── */}
                  <div className="flex border-b border-gray-200 overflow-x-auto flex-shrink-0 bg-card">
                    {TABS.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                            activeTab === tab.id
                              ? 'border-teal-500 text-teal-600 bg-teal-50'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {tab.label}
                        </button>
                      )
                    })}
                  </div>

                  {/* ── TAB CONTENT ──────────────────────────────────────── */}
                  <div className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                      {/* OVERVIEW TAB */}
                      {activeTab === 'overview' && (
                        <motion.div
                          key="overview"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="p-5 space-y-6"
                        >
                          {/* Contact Info */}
                          <section>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" /> Contact Information
                            </h3>
                            <div className="bg-gray-50 rounded-xl p-3 space-y-0.5">
                              <InfoRow label="Lead Name"     value={lead.lead_name}       icon={User} />
                              <InfoRow label="Company"       value={lead.company}          icon={Building2} />
                              <InfoRow label="Contact"       value={lead.contact_person}   icon={User} />
                              <InfoRow label="Job Title"     value={lead.job_title}        icon={Briefcase} />
                              <InfoRow label="Email"         value={lead.email}            icon={Mail} />
                              <InfoRow label="Phone"         value={lead.phone}            icon={Phone} />
                              <InfoRow label="Mobile"        value={lead.mobile}           icon={Phone} />
                              <InfoRow label="Website"       value={lead.website}          icon={Globe} />
                              <InfoRow label="Industry"      value={lead.industry}         icon={Briefcase} />
                              <InfoRow label="Country"       value={lead.country}          icon={MapPin} />
                              <InfoRow label="City"          value={lead.city}             icon={MapPin} />
                              <InfoRow label="Address"       value={lead.address}          icon={MapPin} />
                            </div>
                          </section>

                          {/* Sales Info */}
                          <section>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5" /> Sales Information
                            </h3>
                            <div className="bg-gray-50 rounded-xl p-3 space-y-0.5">
                              <InfoRow label="Lead Source"   value={LEAD_SOURCE_LABELS[lead.lead_source as LeadSource] || lead.lead_source} />
                              <InfoRow label="Assigned To"   value={lead.assigned_agent?.full_name || lead.assigned_to || 'Unassigned'} icon={User} />
                              <InfoRow label="Estimated Value" value={`${lead.currency} ${Number(lead.estimated_value).toLocaleString()}`} icon={DollarSign} />
                              <InfoRow label="Travel Type"   value={lead.travel_type ? TRAVEL_TYPE_LABELS[lead.travel_type as TravelType] : undefined} icon={Plane} />
                              <InfoRow label="Close Date"    value={lead.expected_close_date ? new Date(lead.expected_close_date).toLocaleDateString() : undefined} icon={Calendar} />
                              <InfoRow label="Pipeline"      value={PIPELINE_STAGE_LABELS[lead.pipeline_stage]} />
                              <InfoRow label="Probability"   value={`${lead.probability}%`} />
                              <InfoRow label="Priority"      value={PRIORITY_LABELS[lead.priority]} />
                              <InfoRow label="Status"        value={lead.status} />
                            </div>
                          </section>

                          {/* Travel Requirements */}
                          <section>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Plane className="w-3.5 h-3.5" /> Travel Requirements
                            </h3>
                            <div className="bg-gray-50 rounded-xl p-3 space-y-0.5">
                              <InfoRow label="Destination"   value={lead.destination}       icon={MapPin} />
                              <InfoRow label="Travel Date"   value={lead.travel_date ? new Date(lead.travel_date).toLocaleDateString() : undefined} icon={Calendar} />
                              <InfoRow label="Return Date"   value={lead.return_date ? new Date(lead.return_date).toLocaleDateString() : undefined} icon={Calendar} />
                              <InfoRow label="Adults"        value={lead.adults}            icon={Users} />
                              <InfoRow label="Children"      value={lead.children}          icon={Users} />
                              <InfoRow label="Infants"       value={lead.infants}           icon={Baby} />
                              <InfoRow label="Budget"        value={lead.budget ? `${lead.currency} ${Number(lead.budget).toLocaleString()}` : undefined} icon={DollarSign} />
                              <InfoRow label="Airline"       value={lead.preferred_airline} icon={Plane} />
                              <InfoRow label="Hotel"         value={lead.preferred_hotel}   icon={Hotel} />
                              <InfoRow label="Visa Required" value={lead.visa_required}     icon={Shield} />
                              <InfoRow label="Special Req."  value={lead.special_requests} />
                            </div>
                          </section>

                          {/* Tags */}
                          {lead.tags && lead.tags.length > 0 && (
                            <section>
                              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5" /> Tags
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {lead.tags.map((tag) => (
                                  <span key={tag} className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 text-xs font-medium border border-teal-200">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </section>
                          )}

                          {/* Notes */}
                          {lead.notes && (
                            <section>
                              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" /> Notes
                              </h3>
                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                              </div>
                            </section>
                          )}

                          {/* Metadata */}
                          <section>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" /> Metadata
                            </h3>
                            <div className="bg-gray-50 rounded-xl p-3 space-y-0.5">
                              <InfoRow label="Created"     value={new Date(lead.created_at).toLocaleString()} icon={Calendar} />
                              <InfoRow label="Updated"     value={new Date(lead.updated_at).toLocaleString()} icon={Calendar} />
                              <InfoRow label="Lead ID"     value={lead.id} />
                            </div>
                          </section>
                        </motion.div>
                      )}

                      {/* ACTIVITY TAB */}
                      {activeTab === 'activity' && (
                        <motion.div
                          key="activity"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="p-5"
                        >
                          <LeadActivityTimeline leadId={lead.id} refreshTrigger={activityRefresh} />
                        </motion.div>
                      )}

                      {/* DOCUMENTS TAB */}
                      {activeTab === 'documents' && (
                        <motion.div
                          key="documents"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="p-5"
                        >
                          <LeadDocumentsTab
                            leadId={lead.id}
                            refreshTrigger={activityRefresh}
                            onDocumentUploaded={refreshActivity}
                          />
                        </motion.div>
                      )}

                      {/* FOLLOW-UPS TAB */}
                      {activeTab === 'followups' && (
                        <motion.div
                          key="followups"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="p-5"
                        >
                          <FollowUpForm
                            leadId={lead.id}
                            agents={agents}
                            refreshTrigger={activityRefresh}
                            onFollowUpCreated={refreshActivity}
                          />
                        </motion.div>
                      )}

                      {/* NOTES TAB */}
                      {activeTab === 'notes' && (
                        <motion.div
                          key="notes"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="p-5"
                        >
                          <LeadNoteEditor
                            leadId={lead.id}
                            refreshTrigger={activityRefresh}
                            onNoteAdded={refreshActivity}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sub-modals — rendered outside slide-over to avoid z-index issues */}
      {lead && (
        <>
          <LeadEditModal
            isOpen={showEdit}
            lead={lead}
            onClose={() => setShowEdit(false)}
            onSaved={handleLeadSaved}
          />
          <MoveStageModal
            isOpen={showMoveStage}
            lead={lead}
            onClose={() => setShowMoveStage(false)}
            onMoved={handleMoved}
          />
          <AssignAgentModal
            isOpen={showAssign}
            lead={lead}
            onClose={() => setShowAssign(false)}
            onAssigned={handleAssigned}
          />
          <ConvertLeadModal
            isOpen={showConvert}
            lead={lead}
            onClose={() => setShowConvert(false)}
            onConverted={refreshActivity}
          />
        </>
      )}
    </>
  )
}
