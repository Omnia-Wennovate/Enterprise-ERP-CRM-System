'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/lib/context/profile-context'
import type { SocialCampaign } from '@/types/marketing'
import { CAMPAIGN_TYPE_LABELS } from '@/types/marketing'
import { Loader2, Plus, X, Target, Calendar, Users, TrendingUp, DollarSign } from 'lucide-react'
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign } from '@/lib/services/campaigns'

export default function CampaignsPage() {
  const router = useRouter()
  const profile = useProfile()
  const [campaigns, setCampaigns] = useState<SocialCampaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<SocialCampaign | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [form, setForm] = useState({
    name: '', budget: 0, start_date: '', end_date: '', target_audience: '',
    objective: '', campaign_type: 'brand_awareness', expected_leads: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const data = await getCampaigns()
      setCampaigns(data)
    } catch (err) { console.error(err) }
    finally { setIsLoading(false) }
  }

  const handleSubmit = async () => {
    try {
      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, form as any)
      } else {
        await createCampaign({ ...form as any, created_by: profile?.id, status: 'planned' })
      }
      setShowModal(false)
      setEditingCampaign(null)
      setForm({ name: '', budget: 0, start_date: '', end_date: '', target_audience: '', objective: '', campaign_type: 'brand_awareness', expected_leads: 0 })
      await loadData()
    } catch (err) { console.error(err) }
  }

  const handleEdit = (c: SocialCampaign) => {
    setEditingCampaign(c)
    setForm({ name: c.name, budget: c.budget, start_date: c.start_date, end_date: c.end_date, target_audience: c.target_audience || '', objective: c.objective || '', campaign_type: c.campaign_type, expected_leads: c.expected_leads })
    setShowModal(true)
  }

  const handleStatusChange = async (id: string, status: string) => {
    try { await updateCampaign(id, { status } as any); await loadData() } catch (err) { console.error(err) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign?')) return
    try { await deleteCampaign(id); await loadData() } catch (err) { console.error(err) }
  }

  const filtered = filterStatus === 'all' ? campaigns : campaigns.filter(c => c.status === filterStatus)
  const statusColors: Record<string, string> = { planned: '#3B82F6', active: '#22C55E', paused: '#F59E0B', completed: '#10B981', cancelled: '#EF4444' }
  const campaignTypes = Object.keys(CAMPAIGN_TYPE_LABELS) as (keyof typeof CAMPAIGN_TYPE_LABELS)[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Campaign Management</h1>
              <p className="text-sm text-muted-foreground mt-1">Plan, execute, and track marketing campaigns</p>
            </div>
            <button onClick={() => { setEditingCampaign(null); setForm({ name: '', budget: 0, start_date: '', end_date: '', target_audience: '', objective: '', campaign_type: 'brand_awareness', expected_leads: 0 }); setShowModal(true) }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90">
              <Plus size={16} /> New Campaign
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {['all', 'planned', 'active', 'paused', 'completed'].map(s => {
              const count = s === 'all' ? campaigns.length : campaigns.filter(c => c.status === s).length
              return (
                <button key={s} onClick={() => setFilterStatus(s)} className={`p-4 rounded-xl border text-left transition-all ${filterStatus === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary'}`}>
                  <p className={`text-xs font-medium ${filterStatus === s ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}</p>
                  <p className="text-xl font-bold mt-1">{count}</p>
                </button>
              )
            })}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={48} /></div>
          ) : filtered.length === 0 ? (
            <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
              <p className="text-muted-foreground">No campaigns found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(c => {
                const color = statusColors[c.status] || '#6B7280'
                const daysLeft = Math.max(0, Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000))
                const leadProgress = c.expected_leads > 0 ? Math.min(100, (c.actual_leads / c.expected_leads) * 100) : 0
                return (
                  <div key={c.id} className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden">
                    <div className="h-1.5" style={{ backgroundColor: color }} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-foreground truncate">{c.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{CAMPAIGN_TYPE_LABELS[c.campaign_type as keyof typeof CAMPAIGN_TYPE_LABELS] || c.campaign_type}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0" style={{ backgroundColor: `${color}15`, color }}>{c.status}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <DollarSign size={12} /> Budget: ${c.budget?.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar size={12} /> {daysLeft}d left
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users size={12} /> {c.actual_leads}/{c.expected_leads} leads
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <TrendingUp size={12} /> ROI: {c.roi || 0}%
                        </div>
                      </div>

                      {/* Lead Progress */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Lead Progress</span>
                          <span className="font-medium text-foreground">{Math.round(leadProgress)}%</span>
                        </div>
                        <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${leadProgress}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-border">
                        <button onClick={() => handleEdit(c)} className="text-xs px-3 py-1.5 text-muted-foreground bg-background rounded-lg hover:bg-[#DBEAFE]">Edit</button>
                        {c.status === 'planned' && <button onClick={() => handleStatusChange(c.id, 'active')} className="text-xs px-3 py-1.5 text-[#22C55E] bg-[#22C55E]/10 rounded-lg hover:bg-[#22C55E]/20">Activate</button>}
                        {c.status === 'active' && <button onClick={() => handleStatusChange(c.id, 'paused')} className="text-xs px-3 py-1.5 text-warning bg-[#F59E0B]/10 rounded-lg hover:bg-[#F59E0B]/20">Pause</button>}
                        {c.status === 'paused' && <button onClick={() => handleStatusChange(c.id, 'active')} className="text-xs px-3 py-1.5 text-[#22C55E] bg-[#22C55E]/10 rounded-lg hover:bg-[#22C55E]/20">Resume</button>}
                        {(c.status === 'active' || c.status === 'paused') && <button onClick={() => handleStatusChange(c.id, 'completed')} className="text-xs px-3 py-1.5 text-success bg-[#10B981]/10 rounded-lg hover:bg-[#10B981]/20">Complete</button>}
                        <button onClick={() => handleDelete(c.id)} className="text-xs px-3 py-1.5 text-destructive bg-destructive/10 rounded-lg hover:bg-destructive/20 ml-auto">Delete</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
                  <h3 className="text-lg font-semibold text-foreground">{editingCampaign ? 'Edit Campaign' : 'New Campaign'}</h3>
                  <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div><label className="block text-sm font-medium text-foreground mb-1">Campaign Name</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Summer Holiday Package 2026" /></div>
                  <div><label className="block text-sm font-medium text-foreground mb-1">Campaign Type</label><select value={form.campaign_type} onChange={e => setForm({ ...form, campaign_type: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">{campaignTypes.map(t => <option key={t} value={t}>{CAMPAIGN_TYPE_LABELS[t]}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-foreground mb-1">Start Date</label><input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
                    <div><label className="block text-sm font-medium text-foreground mb-1">End Date</label><input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-foreground mb-1">Budget ($)</label><input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: parseFloat(e.target.value) || 0 })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
                    <div><label className="block text-sm font-medium text-foreground mb-1">Expected Leads</label><input type="number" value={form.expected_leads} onChange={e => setForm({ ...form, expected_leads: parseInt(e.target.value) || 0 })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-foreground mb-1">Target Audience</label><input type="text" value={form.target_audience} onChange={e => setForm({ ...form, target_audience: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="e.g. 25-45 year olds, travel enthusiasts" /></div>
                  <div><label className="block text-sm font-medium text-foreground mb-1">Objective</label><textarea value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" placeholder="Campaign objective..." /></div>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t border-border">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
                  <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90">{editingCampaign ? 'Update' : 'Create'}</button>
                </div>
              </div>
            </div>
          )}
    </div>
  )
}
