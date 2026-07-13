'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type { ContentProductionRequest, ProductionStatus } from '@/types/marketing'
import { PRODUCTION_STATUS_LABELS, PRODUCTION_STATUS_COLORS } from '@/types/marketing'
import { Loader2, Plus, X, ChevronRight } from 'lucide-react'
import { getProductionRequests, createProductionRequest, setProductionStatus, deleteProductionRequest } from '@/lib/services/content-production'
import { getCampaigns } from '@/lib/services/campaigns'

export default function ProductionRequestsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [requests, setRequests] = useState<ContentProductionRequest[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', requesting_department: '', campaign_id: '', description: '', priority: 'medium', due_date: '', recording_date: '', recording_location: '', required_equipment: '', requires_travel: false })

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try { setProfile(JSON.parse(authUser)) } catch { router.push('/login') }
  }, [router])

  useEffect(() => { if (profile) loadData() }, [profile])

  const loadData = async () => {
    try { setIsLoading(true); const [r, c] = await Promise.all([getProductionRequests(), getCampaigns()]); setRequests(r); setCampaigns(c) } catch (err) { console.error(err) } finally { setIsLoading(false) }
  }

  const handleCreate = async () => {
    try {
      await createProductionRequest({ ...form as any, campaign_id: form.campaign_id || undefined, requested_by: profile?.id })
      setShowModal(false)
      setForm({ title: '', requesting_department: '', campaign_id: '', description: '', priority: 'medium', due_date: '', recording_date: '', recording_location: '', required_equipment: '', requires_travel: false })
      await loadData()
    } catch (err) { console.error(err) }
  }

  const handleStatusChange = async (id: string, status: ProductionStatus) => {
    try { await setProductionStatus(id, status); await loadData() } catch (err) { console.error(err) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this request?')) return
    try { await deleteProductionRequest(id); await loadData() } catch (err) { console.error(err) }
  }

  if (!profile) return null

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
    <div className="flex h-screen overflow-hidden bg-[#F0F7FA]">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F33]">Production Requests</h1>
              <p className="text-sm text-[#4B6B7A] mt-1">Track content production from request to publication</p>
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0A8FA8] text-white text-sm font-medium rounded-lg hover:bg-[#088096]">
              <Plus size={16} /> New Request
            </button>
          </div>

          {/* Status Overview */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {statuses.map(s => {
              const count = requests.filter(r => r.status === s).length
              const color = PRODUCTION_STATUS_COLORS[s]
              return (
                <div key={s} className="flex items-center gap-2 px-3 py-2 bg-white border border-[#DBEAFE] rounded-lg whitespace-nowrap">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs font-medium text-[#0B1F33]">{PRODUCTION_STATUS_LABELS[s]}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#F0F7FA] text-[#4B6B7A] font-medium">{count}</span>
                </div>
              )
            })}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0A8FA8]" size={48} /></div>
          ) : (
            /* Kanban Board */
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
              {getKanbanColumns().map(col => (
                <div key={col.status} className="flex-shrink-0 w-72">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                    <h3 className="text-sm font-semibold text-[#0B1F33]">{col.label}</h3>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#F0F7FA] text-[#4B6B7A] font-medium ml-auto">{col.items.length}</span>
                  </div>
                  <div className="space-y-3">
                    {col.items.map(req => {
                      const pColor = priorityColors[req.priority] || '#6B7280'
                      const nextStatusIdx = statuses.indexOf(req.status as ProductionStatus)
                      const nextStatus = nextStatusIdx < statuses.length - 1 ? statuses[nextStatusIdx + 1] : null
                      return (
                        <div key={req.id} className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-4 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium text-[#0B1F33] flex-1 mr-2">{req.title}</h4>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0" style={{ backgroundColor: `${pColor}15`, color: pColor }}>{req.priority}</span>
                          </div>
                          <p className="text-xs text-[#4B6B7A] mb-2">{req.requesting_department}</p>

                          {/* Completion Bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="text-[#4B6B7A]">Progress</span>
                              <span className="font-medium text-[#0B1F33]">{req.completion_percent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#F0F7FA] rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${req.completion_percent}%`, backgroundColor: col.color }} />
                            </div>
                          </div>

                          {req.due_date && <p className="text-[10px] text-[#4B6B7A] mb-2">📅 Due: {new Date(req.due_date).toLocaleDateString()}</p>}

                          <div className="flex items-center gap-1 pt-2 border-t border-[#DBEAFE]">
                            {nextStatus && (
                              <button onClick={() => handleStatusChange(req.id, nextStatus)} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg font-medium" style={{ backgroundColor: `${PRODUCTION_STATUS_COLORS[nextStatus]}15`, color: PRODUCTION_STATUS_COLORS[nextStatus] }}>
                                <ChevronRight size={10} /> {PRODUCTION_STATUS_LABELS[nextStatus]}
                              </button>
                            )}
                            <button onClick={() => handleDelete(req.id)} className="text-[10px] px-2 py-1 bg-[#EF4444]/10 text-[#EF4444] rounded-lg ml-auto">×</button>
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
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-[#DBEAFE] sticky top-0 bg-white z-10">
                  <h3 className="text-lg font-semibold text-[#0B1F33]">New Production Request</h3>
                  <button onClick={() => setShowModal(false)} className="text-[#4B6B7A] hover:text-[#0B1F33]"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Title</label><input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" placeholder="Product Video for Summer Campaign" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Department</label><select value={form.requesting_department} onChange={e => setForm({ ...form, requesting_department: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]"><option value="">Select...</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Priority</label><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
                  </div>
                  <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8] resize-none" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Due Date</label><input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" /></div>
                    <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Recording Date</label><input type="date" value={form.recording_date} onChange={e => setForm({ ...form, recording_date: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Recording Location</label><input type="text" value={form.recording_location} onChange={e => setForm({ ...form, recording_location: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" /></div>
                  <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Required Equipment</label><input type="text" value={form.required_equipment} onChange={e => setForm({ ...form, required_equipment: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" placeholder="Camera, Lights, Drone, etc." /></div>
                  <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Campaign</label><select value={form.campaign_id} onChange={e => setForm({ ...form, campaign_id: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]"><option value="">None</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={form.requires_travel} onChange={e => setForm({ ...form, requires_travel: e.target.checked })} className="rounded border-[#DBEAFE]" />
                    <label className="text-sm text-[#0B1F33]">Requires Travel</label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t border-[#DBEAFE]">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-[#4B6B7A]">Cancel</button>
                  <button onClick={handleCreate} className="px-4 py-2 bg-[#0A8FA8] text-white text-sm font-medium rounded-lg hover:bg-[#088096]">Create Request</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
