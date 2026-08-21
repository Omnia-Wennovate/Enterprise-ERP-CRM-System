'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type { SocialLead } from '@/types/marketing'
import { PLATFORM_COLORS, PLATFORM_LABELS } from '@/types/marketing'
import { Loader2, Plus, X, UserPlus, Mail, Phone, Filter } from 'lucide-react'
import { getSocialLeads, createSocialLead, updateSocialLead, deleteSocialLead, convertLead, assignLeadToAgent } from '@/lib/services/social-leads'
import { getCampaigns } from '@/lib/services/campaigns'

export default function LeadsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [leads, setLeads] = useState<SocialLead[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [form, setForm] = useState({ platform: 'facebook', campaign_id: '', contact_name: '', contact_email: '', contact_phone: '', source: '', notes: '', ad_reference: '' })

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try { setProfile(JSON.parse(authUser)) } catch { router.push('/login') }
  }, [router])

  useEffect(() => { if (profile) loadData() }, [profile])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [l, c] = await Promise.all([getSocialLeads(), getCampaigns()])
      setLeads(l); setCampaigns(c)
    } catch (err) { console.error(err) }
    finally { setIsLoading(false) }
  }

  const handleCreate = async () => {
    try {
      await createSocialLead({ ...form as any, campaign_id: form.campaign_id || undefined })
      setShowModal(false)
      setForm({ platform: 'facebook', campaign_id: '', contact_name: '', contact_email: '', contact_phone: '', source: '', notes: '', ad_reference: '' })
      await loadData()
    } catch (err) { console.error(err) }
  }

  const handleConvert = async (id: string) => {
    try { await convertLead(id); await loadData() } catch (err) { console.error(err) }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try { await updateSocialLead(id, { status } as any); await loadData() } catch (err) { console.error(err) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead?')) return
    try { await deleteSocialLead(id); await loadData() } catch (err) { console.error(err) }
  }

  if (!profile) return null

  const statusColors: Record<string, string> = { new: '#3B82F6', contacted: '#F59E0B', qualified: '#8B5CF6', converted: '#22C55E', lost: '#EF4444' }
  const platforms = ['facebook', 'instagram', 'tiktok', 'linkedin', 'youtube', 'twitter', 'telegram', 'whatsapp'] as const

  let filtered = leads
  if (filterStatus !== 'all') filtered = filtered.filter(l => l.status === filterStatus)
  if (filterPlatform !== 'all') filtered = filtered.filter(l => l.platform === filterPlatform)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Social Media Leads</h1>
              <p className="text-sm text-muted-foreground mt-1">Track and convert leads from social campaigns</p>
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90">
              <Plus size={16} /> Add Lead
            </button>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[
              { key: 'all', label: 'All Leads' },
              { key: 'new', label: 'New' },
              { key: 'contacted', label: 'Contacted' },
              { key: 'qualified', label: 'Qualified' },
              { key: 'converted', label: 'Converted' },
            ].map(s => {
              const count = s.key === 'all' ? leads.length : leads.filter(l => l.status === s.key).length
              const color = statusColors[s.key] || '#C8A951'
              return (
                <button key={s.key} onClick={() => setFilterStatus(s.key)} className={`p-4 rounded-xl border text-left transition-all ${filterStatus === s.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary'}`}>
                  <p className={`text-xs font-medium ${filterStatus === s.key ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{s.label}</p>
                  <p className="text-xl font-bold mt-1">{count}</p>
                </button>
              )
            })}
          </div>

          {/* Platform Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button onClick={() => setFilterPlatform('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${filterPlatform === 'all' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground border border-border'}`}>All Platforms</button>
            {platforms.map(p => (
              <button key={p} onClick={() => setFilterPlatform(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${filterPlatform === p ? 'text-primary-foreground' : 'bg-card text-muted-foreground border border-border'}`} style={filterPlatform === p ? { backgroundColor: PLATFORM_COLORS[p] } : {}}>
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={48} /></div>
          ) : (
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Contact</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Platform</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Source</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">No leads found</td></tr>
                    ) : filtered.map(lead => {
                      const color = statusColors[lead.status] || '#6B7280'
                      const platformColor = PLATFORM_COLORS[lead.platform as keyof typeof PLATFORM_COLORS] || '#6B7280'
                      return (
                        <tr key={lead.id} className="border-b border-border hover:bg-muted transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-foreground">{lead.contact_name || 'Unknown'}</p>
                            <div className="flex items-center gap-3 mt-1">
                              {lead.contact_email && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail size={10} />{lead.contact_email}</span>}
                              {lead.contact_phone && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone size={10} />{lead.contact_phone}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: `${platformColor}15`, color: platformColor }}>
                              {PLATFORM_LABELS[lead.platform as keyof typeof PLATFORM_LABELS] || lead.platform}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{lead.source || lead.ad_reference || '—'}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: `${color}15`, color }}>{lead.status}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {lead.status !== 'converted' && lead.status !== 'lost' && (
                                <>
                                  {lead.status === 'new' && <button onClick={() => handleStatusChange(lead.id, 'contacted')} className="text-xs px-2 py-1 bg-[#F59E0B]/10 text-warning rounded hover:bg-[#F59E0B]/20">Contact</button>}
                                  {lead.status === 'contacted' && <button onClick={() => handleStatusChange(lead.id, 'qualified')} className="text-xs px-2 py-1 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded hover:bg-[#8B5CF6]/20">Qualify</button>}
                                  <button onClick={() => handleConvert(lead.id)} className="text-xs px-2 py-1 bg-[#22C55E]/10 text-[#22C55E] rounded hover:bg-[#22C55E]/20">Convert</button>
                                </>
                              )}
                              <button onClick={() => handleDelete(lead.id)} className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded hover:bg-destructive/20">×</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Create Lead Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-card rounded-xl shadow-xl w-full max-w-lg">
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Add New Lead</h3>
                  <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div><label className="block text-sm font-medium text-foreground mb-1">Contact Name</label><input type="text" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-foreground mb-1">Email</label><input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
                    <div><label className="block text-sm font-medium text-foreground mb-1">Phone</label><input type="tel" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-foreground mb-1">Platform</label><select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">{platforms.map(p => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-foreground mb-1">Campaign</label><select value={form.campaign_id} onChange={e => setForm({ ...form, campaign_id: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"><option value="">No campaign</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  </div>
                  <div><label className="block text-sm font-medium text-foreground mb-1">Source / Ad Reference</label><input type="text" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" placeholder="e.g. Facebook Lead Form, Instagram DM" /></div>
                  <div><label className="block text-sm font-medium text-foreground mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" /></div>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t border-border">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
                  <button onClick={handleCreate} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90">Add Lead</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
