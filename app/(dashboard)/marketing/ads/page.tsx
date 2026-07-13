'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type { Advertisement } from '@/types/marketing'
import { Loader2, Plus, X, DollarSign, MousePointerClick, Eye, TrendingUp } from 'lucide-react'
import { getAdvertisements, createAdvertisement, updateAdvertisement, deleteAdvertisement, getTotalAdSpend, getTotalAdBudget } from '@/lib/services/advertisements'
import { getCampaigns } from '@/lib/services/campaigns'

export default function AdsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [ads, setAds] = useState<Advertisement[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [totalSpend, setTotalSpend] = useState(0)
  const [totalBudget, setTotalBudget] = useState(0)
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [form, setForm] = useState({ name: '', platform: 'meta', campaign_id: '', budget: 0, ad_type: 'sponsored', target_audience: '', start_date: '', end_date: '' })

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try { setProfile(JSON.parse(authUser)) } catch { router.push('/login') }
  }, [router])

  useEffect(() => { if (profile) loadData() }, [profile])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [a, c, s, b] = await Promise.all([getAdvertisements(), getCampaigns(), getTotalAdSpend(), getTotalAdBudget()])
      setAds(a); setCampaigns(c); setTotalSpend(s); setTotalBudget(b)
    } catch (err) { console.error(err) }
    finally { setIsLoading(false) }
  }

  const handleCreate = async () => {
    try {
      await createAdvertisement({ ...form as any, campaign_id: form.campaign_id || undefined, created_by: profile?.id })
      setShowModal(false)
      setForm({ name: '', platform: 'meta', campaign_id: '', budget: 0, ad_type: 'sponsored', target_audience: '', start_date: '', end_date: '' })
      await loadData()
    } catch (err) { console.error(err) }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try { await updateAdvertisement(id, { status } as any); await loadData() } catch (err) { console.error(err) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this ad?')) return
    try { await deleteAdvertisement(id); await loadData() } catch (err) { console.error(err) }
  }

  if (!profile) return null

  const platformColors: Record<string, string> = { meta: '#1877F2', google: '#4285F4', tiktok: '#000000', linkedin: '#0A66C2' }
  const platformLabels: Record<string, string> = { meta: 'Meta Ads', google: 'Google Ads', tiktok: 'TikTok Ads', linkedin: 'LinkedIn Ads' }
  const statusColors: Record<string, string> = { draft: '#6B7280', active: '#22C55E', paused: '#F59E0B', completed: '#10B981', cancelled: '#EF4444' }
  const adPlatforms = ['meta', 'google', 'tiktok', 'linkedin'] as const

  const filtered = filterPlatform === 'all' ? ads : ads.filter(a => a.platform === filterPlatform)
  const budgetUsagePercent = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F7FA]">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F33]">Advertisement Management</h1>
              <p className="text-sm text-[#4B6B7A] mt-1">Manage paid advertising across all platforms</p>
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0A8FA8] text-white text-sm font-medium rounded-lg hover:bg-[#088096]">
              <Plus size={16} /> New Ad
            </button>
          </div>

          {/* Budget Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2"><DollarSign size={16} className="text-[#3B82F6]" /><span className="text-xs text-[#4B6B7A]">Total Budget</span></div>
              <p className="text-2xl font-bold text-[#0B1F33]">${totalBudget.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-[#EF4444]" /><span className="text-xs text-[#4B6B7A]">Total Spend</span></div>
              <p className="text-2xl font-bold text-[#0B1F33]">${totalSpend.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3"><Eye size={16} className="text-[#0A8FA8]" /><span className="text-xs text-[#4B6B7A]">Budget Usage</span></div>
              <div className="w-full h-3 bg-[#F0F7FA] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${budgetUsagePercent > 90 ? 'bg-[#EF4444]' : budgetUsagePercent > 70 ? 'bg-[#F59E0B]' : 'bg-[#0A8FA8]'}`} style={{ width: `${Math.min(100, budgetUsagePercent)}%` }} />
              </div>
              <p className="text-xs text-[#4B6B7A] mt-1">{Math.round(budgetUsagePercent)}% used</p>
            </div>
          </div>

          {/* Platform Filter */}
          <div className="flex gap-2 mb-6">
            <button onClick={() => setFilterPlatform('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterPlatform === 'all' ? 'bg-[#0A8FA8] text-white' : 'bg-white text-[#4B6B7A] border border-[#DBEAFE]'}`}>All ({ads.length})</button>
            {adPlatforms.map(p => {
              const count = ads.filter(a => a.platform === p).length
              return (
                <button key={p} onClick={() => setFilterPlatform(p)} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterPlatform === p ? 'text-white' : 'bg-white text-[#4B6B7A] border border-[#DBEAFE]'}`} style={filterPlatform === p ? { backgroundColor: platformColors[p] } : {}}>
                  {platformLabels[p]} ({count})
                </button>
              )
            })}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0A8FA8]" size={48} /></div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-12 text-center"><p className="text-[#4B6B7A]">No advertisements found</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(ad => {
                const pColor = platformColors[ad.platform] || '#6B7280'
                const sColor = statusColors[ad.status] || '#6B7280'
                const spendPercent = ad.budget > 0 ? (ad.spend / ad.budget) * 100 : 0
                return (
                  <div key={ad.id} className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm hover:shadow-md transition-all overflow-hidden">
                    <div className="h-1.5" style={{ backgroundColor: pColor }} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#0B1F33] truncate">{ad.name}</p>
                          <p className="text-xs font-medium mt-0.5" style={{ color: pColor }}>{platformLabels[ad.platform]}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0" style={{ backgroundColor: `${sColor}15`, color: sColor }}>{ad.status}</span>
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[#4B6B7A]">Budget: ${ad.budget.toLocaleString()}</span>
                          <span className="font-medium text-[#0B1F33]">${ad.spend.toLocaleString()} spent</span>
                        </div>
                        <div className="w-full h-2 bg-[#F0F7FA] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#0A8FA8] to-[#06B6D4] rounded-full" style={{ width: `${Math.min(100, spendPercent)}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-3 border-t border-[#DBEAFE]">
                        {ad.status === 'active' && <button onClick={() => handleStatusChange(ad.id, 'paused')} className="text-xs px-3 py-1.5 text-[#F59E0B] bg-[#F59E0B]/10 rounded-lg hover:bg-[#F59E0B]/20">Pause</button>}
                        {ad.status === 'paused' && <button onClick={() => handleStatusChange(ad.id, 'active')} className="text-xs px-3 py-1.5 text-[#22C55E] bg-[#22C55E]/10 rounded-lg hover:bg-[#22C55E]/20">Resume</button>}
                        {ad.status === 'draft' && <button onClick={() => handleStatusChange(ad.id, 'active')} className="text-xs px-3 py-1.5 text-[#22C55E] bg-[#22C55E]/10 rounded-lg hover:bg-[#22C55E]/20">Launch</button>}
                        <button onClick={() => handleDelete(ad.id)} className="text-xs px-3 py-1.5 text-[#EF4444] bg-[#EF4444]/10 rounded-lg hover:bg-[#EF4444]/20 ml-auto">Delete</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Create Ad Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                <div className="flex items-center justify-between p-6 border-b border-[#DBEAFE]">
                  <h3 className="text-lg font-semibold text-[#0B1F33]">Create New Ad</h3>
                  <button onClick={() => setShowModal(false)} className="text-[#4B6B7A] hover:text-[#0B1F33]"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Ad Name</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Platform</label><select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]">{adPlatforms.map(p => <option key={p} value={p}>{platformLabels[p]}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Budget ($)</label><input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: parseFloat(e.target.value) || 0 })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Campaign</label><select value={form.campaign_id} onChange={e => setForm({ ...form, campaign_id: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]"><option value="">No campaign</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Target Audience</label><input type="text" value={form.target_audience} onChange={e => setForm({ ...form, target_audience: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Start Date</label><input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" /></div>
                    <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">End Date</label><input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" /></div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t border-[#DBEAFE]">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-[#4B6B7A]">Cancel</button>
                  <button onClick={handleCreate} className="px-4 py-2 bg-[#0A8FA8] text-white text-sm font-medium rounded-lg hover:bg-[#088096]">Create Ad</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
