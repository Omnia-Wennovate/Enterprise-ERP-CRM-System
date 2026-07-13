'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type { WeeklyContentPlan } from '@/types/marketing'
import { PLATFORM_COLORS, PLATFORM_LABELS } from '@/types/marketing'
import { Loader2, ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, CheckCircle, Clock } from 'lucide-react'
import { getWeeklyPlansByWeek, createWeeklyPlan, updateWeeklyPlanStatus, getWeekStartDate, getWeekDates, deleteWeeklyPlan } from '@/lib/services/weekly-planner'
import { getCampaigns } from '@/lib/services/campaigns'

export default function WeeklyPlannerPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [plans, setPlans] = useState<WeeklyContentPlan[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [weekStart, setWeekStart] = useState<string>(getWeekStartDate(new Date()))
  const [showModal, setShowModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number>(0) // 0-6 (Mon-Sun)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram')
  const [form, setForm] = useState({ content_theme: '', post_type: 'image', campaign_id: '', caption_draft: '', required_media: '' })

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try { setProfile(JSON.parse(authUser)) } catch { router.push('/login') }
  }, [router])

  useEffect(() => { if (profile) loadData() }, [profile, weekStart])

  const loadData = async () => {
    try { setIsLoading(true); const [p, c] = await Promise.all([getWeeklyPlansByWeek(weekStart), getCampaigns()]); setPlans(p); setCampaigns(c) } catch (err) { console.error(err) } finally { setIsLoading(false) }
  }

  const navigateWeek = (dir: number) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + (dir * 7))
    setWeekStart(getWeekStartDate(d))
  }

  const handleCreate = async () => {
    try {
      await createWeeklyPlan({
        week_start_date: weekStart,
        day_of_week: selectedDay,
        platform: selectedPlatform,
        ...form as any,
        campaign_id: form.campaign_id || undefined,
        status: 'draft',
      })
      setShowModal(false)
      setForm({ content_theme: '', post_type: 'image', campaign_id: '', caption_draft: '', required_media: '' })
      await loadData()
    } catch (err) { console.error(err) }
  }

  const handleStatusChange = async (id: string, status: any) => {
    try { await updateWeeklyPlanStatus(id, status); await loadData() } catch (err) { console.error(err) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this plan?')) return
    try { await deleteWeeklyPlan(id); await loadData() } catch (err) { console.error(err) }
  }

  const openModal = (day: number, platform: string) => {
    setSelectedDay(day); setSelectedPlatform(platform); setShowModal(true)
  }

  if (!profile) return null

  const weekDates = getWeekDates(weekStart)
  const platforms = ['instagram', 'facebook', 'linkedin', 'tiktok', 'twitter'] as const
  const postTypes = ['image', 'video', 'carousel', 'reel', 'story', 'text'] as const

  const getPlans = (day: number, platform: string) => plans.filter(p => p.day_of_week === day && p.platform === platform)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F7FA]">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F33]">Weekly Content Planner</h1>
              <p className="text-sm text-[#4B6B7A] mt-1">Plan and coordinate posts across all platforms by week</p>
            </div>
            <div className="flex items-center gap-4 bg-white border border-[#DBEAFE] rounded-lg p-2">
              <button onClick={() => navigateWeek(-1)} className="p-1 text-[#4B6B7A] hover:bg-[#F0F7FA] rounded"><ChevronLeft size={20} /></button>
              <div className="flex items-center gap-2 font-medium text-[#0B1F33]">
                <CalendarIcon size={16} className="text-[#0A8FA8]" />
                {new Date(weekStart).toLocaleDateString()} - {new Date(weekDates[6].date).toLocaleDateString()}
              </div>
              <button onClick={() => navigateWeek(1)} className="p-1 text-[#4B6B7A] hover:bg-[#F0F7FA] rounded"><ChevronRight size={20} /></button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0A8FA8]" size={48} /></div>
          ) : (
            <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-[#DBEAFE] bg-[#F8FAFC]">
                      <th className="p-3 border-r border-[#DBEAFE] w-32 bg-white sticky left-0 z-10">Platform</th>
                      {weekDates.map((d, i) => (
                        <th key={i} className={`p-3 text-center border-r border-[#DBEAFE] min-w-[180px] ${d.date === new Date().toISOString().split('T')[0] ? 'bg-[#0A8FA8]/10' : ''}`}>
                          <p className={`text-xs font-bold ${d.date === new Date().toISOString().split('T')[0] ? 'text-[#0A8FA8]' : 'text-[#0B1F33]'}`}>{d.day}</p>
                          <p className="text-[10px] text-[#4B6B7A]">{new Date(d.date).toLocaleDateString()}</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {platforms.map(platform => {
                      const pColor = PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] || '#6B7280'
                      return (
                        <tr key={platform} className="border-b border-[#DBEAFE]">
                          <td className="p-3 border-r border-[#DBEAFE] bg-white sticky left-0 z-10 align-top">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pColor }} />
                              <span className="text-sm font-medium text-[#0B1F33]">{PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] || platform}</span>
                            </div>
                          </td>
                          {weekDates.map((_, dayIdx) => {
                            const dayPlans = getPlans(dayIdx, platform)
                            return (
                              <td key={dayIdx} className="p-2 border-r border-[#DBEAFE] align-top bg-[#F8FAFC]/50 hover:bg-[#F0F7FA]/50 transition-colors group">
                                <div className="space-y-2">
                                  {dayPlans.map(plan => (
                                    <div key={plan.id} className="bg-white border border-[#DBEAFE] rounded p-2 shadow-sm text-xs relative group/item">
                                      <div className="flex items-start justify-between mb-1">
                                        <span className="font-semibold text-[#0B1F33] truncate pr-2">{plan.content_theme || 'Untitled'}</span>
                                        {plan.status === 'ready' ? <CheckCircle size={12} className="text-[#22C55E] flex-shrink-0" /> : plan.status === 'in_progress' ? <Clock size={12} className="text-[#F59E0B] flex-shrink-0" /> : <div className="w-3 h-3 rounded-full bg-[#E5E7EB] flex-shrink-0" />}
                                      </div>
                                      <p className="text-[10px] text-[#4B6B7A] capitalize mb-1">{plan.post_type}</p>
                                      {plan.caption_draft && <p className="text-[10px] text-[#6B7280] truncate italic">"{plan.caption_draft}"</p>}
                                      
                                      <div className="absolute top-1 right-1 opacity-0 group-hover/item:opacity-100 bg-white shadow rounded flex gap-1 p-0.5">
                                        {plan.status === 'draft' && <button onClick={() => handleStatusChange(plan.id, 'in_progress')} className="text-[#F59E0B] hover:bg-[#F59E0B]/10 p-0.5 rounded"><Clock size={12} /></button>}
                                        {plan.status === 'in_progress' && <button onClick={() => handleStatusChange(plan.id, 'ready')} className="text-[#22C55E] hover:bg-[#22C55E]/10 p-0.5 rounded"><CheckCircle size={12} /></button>}
                                        <button onClick={() => handleDelete(plan.id)} className="text-[#EF4444] hover:bg-[#EF4444]/10 p-0.5 rounded"><X size={12} /></button>
                                      </div>
                                    </div>
                                  ))}
                                  <button onClick={() => openModal(dayIdx, platform)} className="w-full py-1.5 flex justify-center items-center text-[#94A3B8] hover:text-[#0A8FA8] hover:bg-[#0A8FA8]/10 rounded border border-dashed border-[#CBD5E1] opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus size={14} />
                                  </button>
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Create Plan Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-[#DBEAFE]">
                  <div>
                    <h3 className="text-lg font-semibold text-[#0B1F33]">Plan Content</h3>
                    <p className="text-xs text-[#4B6B7A] mt-1">{weekDates[selectedDay].day}, {PLATFORM_LABELS[selectedPlatform as keyof typeof PLATFORM_LABELS]}</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-[#4B6B7A] hover:text-[#0B1F33]"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Theme / Title</label><input type="text" value={form.content_theme} onChange={e => setForm({ ...form, content_theme: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" placeholder="e.g. Testimonial Tuesday" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Post Type</label><select value={form.post_type} onChange={e => setForm({ ...form, post_type: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]">{postTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Campaign</label><select value={form.campaign_id} onChange={e => setForm({ ...form, campaign_id: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]"><option value="">None</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  </div>
                  <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Required Media / Notes</label><input type="text" value={form.required_media} onChange={e => setForm({ ...form, required_media: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" placeholder="Need high-res logo" /></div>
                  <div><label className="block text-sm font-medium text-[#0B1F33] mb-1">Caption Draft (Optional)</label><textarea value={form.caption_draft} onChange={e => setForm({ ...form, caption_draft: e.target.value })} rows={3} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8] resize-none" /></div>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t border-[#DBEAFE]">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-[#4B6B7A]">Cancel</button>
                  <button onClick={handleCreate} className="px-4 py-2 bg-[#0A8FA8] text-white text-sm font-medium rounded-lg hover:bg-[#088096]">Save Plan</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
