'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/lib/context/profile-context'
import type { ContentProductionRequest, ProductionStatus } from '@/types/marketing'
import { PRODUCTION_STATUS_LABELS, PRODUCTION_STATUS_COLORS } from '@/types/marketing'
import { Loader2, Plus, X, ChevronRight, User, Users, Search, Check } from 'lucide-react'
import {
  getProductionRequests,
  createProductionRequest,
  setProductionStatus,
  deleteProductionRequest,
  updateProductionRequest,
  getEmployeesForProductionAssignment,
  notifyProductionRequestAssignees,
  type ProductionAssigneeOption,
} from '@/lib/services/content-production'
import { publishProductionRequestAnnouncement } from '@/app/(dashboard)/communication/actions'
import { getCampaigns } from '@/lib/services/campaigns'

// ─── Multi-select dropdown for assignees ─────────────────────────────────────
function AssigneeSelector({
  employees,
  selected,
  onChange,
}: {
  employees: ProductionAssigneeOption[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = employees.filter((e) =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (e.department || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.position || '').toLowerCase().includes(search.toLowerCase())
  )

  const selectedEmployees = employees.filter((e) => selected.includes(e.id))

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen((v) => !v)}
        className="w-full min-h-[38px] border border-border rounded-lg px-3 py-2 text-sm cursor-pointer flex flex-wrap gap-1 items-center focus-within:border-primary bg-background"
      >
        {selectedEmployees.length === 0 ? (
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Users size={13} /> Select team members…
          </span>
        ) : (
          selectedEmployees.map((e) => (
            <span
              key={e.id}
              className="flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-medium px-2 py-0.5 rounded-full"
            >
              {e.full_name}
              <button
                type="button"
                onClick={(ev) => { ev.stopPropagation(); toggle(e.id) }}
                className="hover:text-destructive ml-0.5"
              >
                <X size={10} />
              </button>
            </span>
          ))
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-background rounded-lg">
              <Search size={13} className="text-muted-foreground flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, role…"
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No employees found</p>
            ) : (
              filtered.map((e) => {
                const isSelected = selected.includes(e.id)
                return (
                  <div
                    key={e.id}
                    onClick={() => toggle(e.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted/50 ${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'bg-primary border-primary' : 'border-border'
                    }`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{e.full_name}</p>
                      {(e.position || e.department) && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {[e.position, e.department].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductionRequestsPage() {
  const router = useRouter()
  const profile = useProfile()
  const [requests, setRequests] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [employees, setEmployees] = useState<ProductionAssigneeOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRequest, setEditingRequest] = useState<any | null>(null)

  const emptyForm = {
    title: '',
    requesting_department: '',
    campaign_id: '',
    description: '',
    priority: 'medium',
    due_date: '',
    recording_date: '',
    recording_location: '',
    required_equipment: '',
    requires_travel: false,
    assigneeIds: [] as string[],
  }
  const [form, setForm] = useState(emptyForm)

  // Resolve requester name from profile
  const getRequesterName = (): string => {
    if (!profile) return ''
    const KNOWN: Record<string, string> = {
      'davidbezuneh@gmail.com': 'David Bezuneh',
      'belenwolde2@gmail.com': 'Belen Wolde',
      'marketing@omniatravel.com': 'Marketing Team',
    }
    const email = ((profile as any).email || '').toLowerCase()
    if (KNOWN[email]) return KNOWN[email]
    const fn = (profile as any).first_name
    const ln = (profile as any).last_name
    const isGeneric = !fn || fn.trim().toLowerCase() === 'user'
    if (!isGeneric) return `${fn || ''} ${ln || ''}`.trim()
    const local = email.split('@')[0]?.replace(/\d+/g, '').replace(/[._\-+]/g, ' ').trim()
    const words = (local || '').split(/\s+/).filter(Boolean).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    return words.join(' ') || email || 'Team Member'
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [r, c, e] = await Promise.all([
        getProductionRequests(),
        getCampaigns(),
        getEmployeesForProductionAssignment(),
      ])
      setRequests(r)
      setCampaigns(c)
      setEmployees(e)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const { assigneeIds, ...rest } = form
      const newReq = await createProductionRequest({
        ...rest as any,
        campaign_id: form.campaign_id || undefined,
        requested_by: profile?.id,
        assigneeIds,
      })

      const creatorName = getRequesterName()

      // Send notifications to each assignee (non-blocking)
      if (assigneeIds.length > 0) {
        notifyProductionRequestAssignees(newReq.id, form.title, assigneeIds, creatorName)
          .catch((e) => console.error('[notifyProductionRequestAssignees]', e))
      }

      // Publish a Communication Center announcement with assignee info (non-blocking)
      if (profile?.id && form.title) {
        const assigneeNamesList = assigneeIds
          .map((id) => employees.find((e) => e.id === id)?.full_name)
          .filter(Boolean) as string[]

        publishProductionRequestAnnouncement({
          requestId: newReq.id,
          requestTitle: form.title,
          assigneeIds,
          assigneeNames: assigneeNamesList,
          publishedBy: profile.id,
          publishedByName: creatorName,
          targetRoles: ['marketing', 'social_media'],
        }).catch((e) => console.error('[publishProductionRequestAnnouncement]', e))
      }

      setShowModal(false)
      setForm(emptyForm)
      await loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleEditAssignees = async (requestId: string, assigneeIds: string[]) => {
    try {
      const req = requests.find((r) => r.id === requestId)
      if (!req) return
      await updateProductionRequest(requestId, { assigneeIds })
      // Notify newly added assignees
      const prev: string[] = req.assigned_team || []
      const newAssignees = assigneeIds.filter((id) => !prev.includes(id))
      if (newAssignees.length > 0) {
        const creatorName = getRequesterName()
        notifyProductionRequestAssignees(requestId, req.title, newAssignees, creatorName)
          .catch((e) => console.error('[notifyProductionRequestAssignees]', e))
      }
      setEditingRequest(null)
      await loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleStatusChange = async (id: string, status: ProductionStatus) => {
    try { await setProductionStatus(id, status); await loadData() } catch (err) { console.error(err) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this request?')) return
    try { await deleteProductionRequest(id); await loadData() } catch (err) { console.error(err) }
  }

  const statuses: ProductionStatus[] = ['requested', 'planning', 'approved', 'recording', 'editing', 'review', 'scheduled', 'published', 'archived']
  const priorityColors: Record<string, string> = { low: '#6B7280', medium: '#3B82F6', high: '#F59E0B', urgent: '#EF4444' }
  const departments = ['Sales', 'Operations', 'HR', 'Finance', 'Management', 'Social Media', 'Marketing']

  const getKanbanColumns = () => {
    return statuses.map(status => ({
      status,
      label: PRODUCTION_STATUS_LABELS[status],
      color: PRODUCTION_STATUS_COLORS[status],
      items: requests.filter(r => r.status === status),
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Production Requests</h1>
              <p className="text-sm text-muted-foreground mt-1">Track content production from request to publication</p>
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90">
              <Plus size={16} /> New Request
            </button>
          </div>

          {/* Status Overview */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {statuses.map(s => {
              const count = requests.filter(r => r.status === s).length
              const color = PRODUCTION_STATUS_COLORS[s]
              return (
                <div key={s} className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg whitespace-nowrap">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs font-medium text-foreground">{PRODUCTION_STATUS_LABELS[s]}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-background text-muted-foreground font-medium">{count}</span>
                </div>
              )
            })}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={48} /></div>
          ) : (
            /* Kanban Board */
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
              {getKanbanColumns().map(col => (
                <div key={col.status} className="flex-shrink-0 w-72">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                    <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-background text-muted-foreground font-medium ml-auto">{col.items.length}</span>
                  </div>
                  <div className="space-y-3">
                    {col.items.map(req => {
                      const pColor = priorityColors[req.priority] || '#6B7280'
                      const nextStatusIdx = statuses.indexOf(req.status as ProductionStatus)
                      const nextStatus = nextStatusIdx < statuses.length - 1 ? statuses[nextStatusIdx + 1] : null
                      const assigneeProfiles: Array<{ id: string; full_name: string }> = req.assigneeProfiles || []
                      return (
                        <div key={req.id} className="bg-card rounded-xl border border-border shadow-sm p-4 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium text-foreground flex-1 mr-2">{req.title}</h4>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0" style={{ backgroundColor: `${pColor}15`, color: pColor }}>{req.priority}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{req.requesting_department}</p>

                          {/* Assignees */}
                          {assigneeProfiles.length > 0 && (
                            <div className="mb-2">
                              <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                                <Users size={9} /> Assigned To
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {assigneeProfiles.map((a) => (
                                  <span key={a.id} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                                    {a.full_name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Requester */}
                          {req.requesterName && (
                            <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                              <User size={9} /> By: {req.requesterName}
                            </p>
                          )}

                          {/* Completion Bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium text-foreground">{req.completion_percent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${req.completion_percent}%`, backgroundColor: col.color }} />
                            </div>
                          </div>

                          {req.due_date && <p className="text-[10px] text-muted-foreground mb-2">📅 Due: {new Date(req.due_date).toLocaleDateString()}</p>}

                          <div className="flex items-center gap-1 pt-2 border-t border-border">
                            {nextStatus && (
                              <button onClick={() => handleStatusChange(req.id, nextStatus)} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg font-medium" style={{ backgroundColor: `${PRODUCTION_STATUS_COLORS[nextStatus]}15`, color: PRODUCTION_STATUS_COLORS[nextStatus] }}>
                                <ChevronRight size={10} /> {PRODUCTION_STATUS_LABELS[nextStatus]}
                              </button>
                            )}
                            <button
                              onClick={() => setEditingRequest({ ...req, editAssigneeIds: req.assigned_team || [] })}
                              className="text-[10px] px-2 py-1 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 flex items-center gap-1"
                            >
                              <Users size={9} /> Edit
                            </button>
                            <button onClick={() => handleDelete(req.id)} className="text-[10px] px-2 py-1 bg-destructive/10 text-destructive rounded-lg ml-auto">×</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Request Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
                  <h3 className="text-lg font-semibold text-foreground">New Production Request</h3>
                  <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div><label className="block text-sm font-medium text-foreground mb-1">Title</label><input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Product Video for Summer Campaign" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-foreground mb-1">Department</label><select value={form.requesting_department} onChange={e => setForm({ ...form, requesting_department: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"><option value="">Select...</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-foreground mb-1">Priority</label><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
                  </div>

                  {/* Assigned To — multi-select */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                      <Users size={14} /> Assigned To
                    </label>
                    <AssigneeSelector
                      employees={employees}
                      selected={form.assigneeIds}
                      onChange={(ids) => setForm({ ...form, assigneeIds: ids })}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Select one or more team members. Each will receive a notification.</p>
                  </div>

                  <div><label className="block text-sm font-medium text-foreground mb-1">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-foreground mb-1">Due Date</label><input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
                    <div><label className="block text-sm font-medium text-foreground mb-1">Recording Date</label><input type="date" value={form.recording_date} onChange={e => setForm({ ...form, recording_date: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-foreground mb-1">Recording Location</label><input type="text" value={form.recording_location} onChange={e => setForm({ ...form, recording_location: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
                  <div><label className="block text-sm font-medium text-foreground mb-1">Required Equipment</label><input type="text" value={form.required_equipment} onChange={e => setForm({ ...form, required_equipment: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Camera, Lights, Drone, etc." /></div>
                  <div><label className="block text-sm font-medium text-foreground mb-1">Campaign</label><select value={form.campaign_id} onChange={e => setForm({ ...form, campaign_id: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"><option value="">None</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={form.requires_travel} onChange={e => setForm({ ...form, requires_travel: e.target.checked })} className="rounded border-border" />
                    <label className="text-sm text-foreground">Requires Travel</label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t border-border">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
                  <button onClick={handleCreate} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90">Create Request</button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Assignees Modal */}
          {editingRequest && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Edit Assignees</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{editingRequest.title}</p>
                  </div>
                  <button onClick={() => setEditingRequest(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
                </div>
                <div className="p-5 space-y-3">
                  <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
                    <Users size={14} /> Assigned To
                  </label>
                  <AssigneeSelector
                    employees={employees}
                    selected={editingRequest.editAssigneeIds}
                    onChange={(ids) => setEditingRequest({ ...editingRequest, editAssigneeIds: ids })}
                  />
                  <p className="text-[10px] text-muted-foreground">Newly added assignees will receive a notification.</p>
                </div>
                <div className="flex justify-end gap-3 p-5 border-t border-border">
                  <button onClick={() => setEditingRequest(null)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
                  <button
                    onClick={() => handleEditAssignees(editingRequest.id, editingRequest.editAssigneeIds)}
                    className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90"
                  >
                    Save Assignees
                  </button>
                </div>
              </div>
            </div>
          )}
    </div>
  )
}
