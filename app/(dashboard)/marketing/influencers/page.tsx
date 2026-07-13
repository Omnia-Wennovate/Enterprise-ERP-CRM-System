'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type { Influencer } from '@/types/marketing'
import { PLATFORM_COLORS, PLATFORM_LABELS } from '@/types/marketing'
import { Loader2, Plus, X, Users, DollarSign, Star } from 'lucide-react'
import { getInfluencers, createInfluencer, updateInfluencer, deleteInfluencer } from '@/lib/services/influencers'
import { getCampaigns } from '@/lib/services/campaigns'

export default function InfluencersPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null)
  const [form, setForm] = useState({ name: '', platform: 'instagram', handle: '', followers_count: 0, category: '', country: '', campaign_id: '', payment_amount: 0, performance_notes: '' })

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try { setProfile(JSON.parse(authUser)) } catch { router.push('/login') }
  }, [router])

  useEffect(() => { if (profile) loadData() }, [profile])

  const loadData = async () => {
    try { setIsLoading(true); const [i, c] = await Promise.all([getInfluencers(), getCampaigns()]); setInfluencers(i); setCampaigns(c) } catch (err) { console.error(err) } finally { setIsLoading(false) }
  }

  const handleSubmit = async () => {
    try {
      if (editingInfluencer) { await updateInfluencer(editingInfluencer.id, form as any) }
      else { await createInfluencer({ ...form as any, campaign_id: form.campaign_id || undefined }) }
      setShowModal(false); setEditingInfluencer(null)
      setForm({ name: '', platform: 'instagram', handle: '', followers_count: 0, category: '', country: '', campaign_id: '', payment_amount: 0, performance_notes: '' })
      await loadData()
    } catch (err) { console.error(err) }
  }

  const handleEdit = (inf: Influencer) => {
    setEditingInfluencer(inf)
    setForm({ name: inf.name, platform: inf.platform, handle: inf.handle || '', followers_count: inf.followers_count, category: inf.category || '', country: inf.country || '', campaign_id: inf.campaign_id || '', payment_amount: inf.payment_amount || 0, performance_notes: inf.performance_notes || '' })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => { if (confirm('Delete?')) { await deleteInfluencer(id); await loadData() } }

  const handlePaymentStatus = async (id: string, status: string) => {
    try { await updateInfluencer(id, { payment_status: status } as any); await loadData() } catch (err) { console.error(err) }
  }

  if (!profile) return null

  const platforms = ['facebook', 'instagram', 'tiktok', 'linkedin', 'youtube', 'twitter', 'telegram', 'whatsapp'] as const
  const paymentColors: Record<string, string> = { pending: '#F59E0B', paid: '#22C55E', cancelled: '#EF4444' }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F7FA]">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F33]">Influencer Management</h1>
              <p className="text-sm text-[#4B6B7A] mt-1">Manage influencer partnerships and performance</p>
            </div>
            <button onClick={() => { setEditingInfluencer(null); setForm({ name: '', platform: 'instagram', handle: '', followers_count: 0, category: '', country: '', campaign_id: '', payment_amount: 0, performance_notes: '' }); setShowModal(true) }} className="flex items-center gap-2 px-4 py-2 bg-[#0A8FA8] text-white text-sm font-medium rounded-lg hover:bg-[#088096]">
              <Plus size={16} /> Add Influencer
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0A8FA8]" size={48} /></div>
          ) : influencers.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-12 text-center"><p className="text-[#4B6B7A]">No influencers added yet</p></div>
          ) : (
            <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#DBEAFE] bg-[#F8FAFC]">
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#4B6B7A]">Influencer</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#4B6B7A]">Platform</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#4B6B7A]">Followers</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#4B6B7A]">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#4B6B7A]">Payment</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#4B6B7A]">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#4B6B7A]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {influencers.map(inf => {
                      const pColor = PLATFORM_COLORS[inf.platform as keyof typeof PLATFORM_COLORS] || '#6B7280'
                      const payColor = paymentColors[inf.payment_status] || '#6B7280'
                      return (
                        <tr key={inf.id} className="border-b border-[#DBEAFE] hover:bg-[#F8FAFC]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A8FA8] to-[#06B6D4] flex items-center justify-center text-white text-sm font-bold">{inf.name[0]}</div>
                              <div>
                                <p className="text-sm font-medium text-[#0B1F33]">{inf.name}</p>
                                {inf.handle && <p className="text-xs text-[#4B6B7A]">@{inf.handle}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: `${pColor}15`, color: pColor }}>{PLATFORM_LABELS[inf.platform as keyof typeof PLATFORM_LABELS]}</span></td>
                          <td className="px-4 py-3"><span className="text-sm font-medium text-[#0B1F33]">{inf.followers_count.toLocaleString()}</span></td>
                          <td className="px-4 py-3 text-sm text-[#4B6B7A]">{inf.category || '—'}</td>
                          <td className="px-4 py-3 text-sm font-medium text-[#0B1F33]">${(inf.payment_amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: `${payColor}15`, color: payColor }}>{inf.payment_status}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleEdit(inf)} className="text-xs px-2 py-1 bg-[#F0F7FA] text-[#4B6B7A] rounded hover:bg-[#DBEAFE]">Edit</button>
                              {inf.payment_status === 'pending' && <button onClick={() => handlePaymentStatus(inf.id, 'paid')} className="text-xs px-2 py-1 bg-[#22C55E]/10 text-[#22C55E] rounded hover:bg-[#22C55E]/20">Pay</button>}
                              <button onClick={() => handleDelete(inf.id)} className="text-xs px-2 py-1 bg-[#EF4444]/10 text-[#EF4444] rounded hover:bg-[#EF4444]/20">×</button>
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

          {showModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-[#DBEAFE] sticky top-0 bg-white z-10">
                  <h3 className="text-lg font-semibold text-[#0B1F33]">{editingInfluencer ? 'Edit' : 'Add'} Influencer</h3>
                  <button onClick={() => setShowModal(false)} className="text-[#4B6B7A] hover:text-[#0B1F33]"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Name</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Platform</label><select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]">{platforms.map(p => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Handle</label><input type="text" value={form.handle} onChange={e => setForm({ ...form, handle: e.target.value })} placeholder="@handle" className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Followers</label><input type="number" value={form.followers_count} onChange={e => setForm({ ...form, followers_count: parseInt(e.target.value) || 0 })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" /></div>
                    <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Payment ($)</label><input type="number" value={form.payment_amount} onChange={e => setForm({ ...form, payment_amount: parseFloat(e.target.value) || 0 })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Category</label><input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Travel, Lifestyle" className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" /></div>
                    <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Country</label><input type="text" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Campaign</label><select value={form.campaign_id} onChange={e => setForm({ ...form, campaign_id: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]"><option value="">None</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Performance Notes</label><textarea value={form.performance_notes} onChange={e => setForm({ ...form, performance_notes: e.target.value })} rows={2} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8] resize-none" /></div>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t border-[#DBEAFE]">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-[#4B6B7A]">Cancel</button>
                  <button onClick={handleSubmit} className="px-4 py-2 bg-[#0A8FA8] text-white text-sm font-medium rounded-lg hover:bg-[#088096]">{editingInfluencer ? 'Update' : 'Add'}</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
