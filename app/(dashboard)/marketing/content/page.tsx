'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type { SocialPost, PostStatus } from '@/types/marketing'
import { Loader2, Plus, Filter, Eye, Heart, Share2, MousePointerClick, X, Send, Check, Clock, Archive, AlertCircle } from 'lucide-react'
import { getSocialPosts, createSocialPost, updateSocialPost, deleteSocialPost, submitForApproval, approvePost, publishPost, archivePost } from '@/lib/services/social-posts'
import { getSocialAccounts } from '@/lib/services/social-accounts'
import { getCampaigns } from '@/lib/services/campaigns'

export default function ContentPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<PostStatus | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ account_id: '', campaign_id: '', content_type: 'image', caption: '', scheduled_for: '' })

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try { setProfile(JSON.parse(authUser)) } catch { router.push('/login') }
  }, [router])

  useEffect(() => { if (profile) loadData() }, [profile])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [p, a, c] = await Promise.all([
        getSocialPosts(),
        getSocialAccounts(),
        getCampaigns(),
      ])
      setPosts(p)
      setAccounts(a)
      setCampaigns(c)
    } catch (err) { console.error(err) }
    finally { setIsLoading(false) }
  }

  const handleCreate = async () => {
    try {
      await createSocialPost({
        ...form as any,
        account_id: form.account_id || undefined,
        campaign_id: form.campaign_id || undefined,
        created_by: profile?.id,
      })
      setShowModal(false)
      setForm({ account_id: '', campaign_id: '', content_type: 'image', caption: '', scheduled_for: '' })
      await loadData()
    } catch (err) { console.error(err) }
  }

  const handleAction = async (postId: string, action: string) => {
    try {
      switch (action) {
        case 'submit': await submitForApproval(postId); break
        case 'approve': await approvePost(postId, profile?.id || ''); break
        case 'publish': await publishPost(postId); break
        case 'archive': await archivePost(postId); break
        case 'delete': if (confirm('Delete this post?')) await deleteSocialPost(postId); break
      }
      await loadData()
    } catch (err) { console.error(err) }
  }

  if (!profile) return null

  const tabs: { key: PostStatus | 'all'; label: string; icon: any; color: string }[] = [
    { key: 'all', label: 'All', icon: Filter, color: '#0B1F33' },
    { key: 'draft', label: 'Drafts', icon: AlertCircle, color: '#6B7280' },
    { key: 'pending_approval', label: 'Pending', icon: Clock, color: '#F59E0B' },
    { key: 'approved', label: 'Approved', icon: Check, color: '#10B981' },
    { key: 'scheduled', label: 'Scheduled', icon: Clock, color: '#3B82F6' },
    { key: 'published', label: 'Published', icon: Send, color: '#22C55E' },
    { key: 'archived', label: 'Archived', icon: Archive, color: '#9CA3AF' },
  ]

  const filteredPosts = activeTab === 'all' ? posts : posts.filter(p => p.status === activeTab)

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      draft: '#6B7280', pending_approval: '#F59E0B', approved: '#10B981',
      scheduled: '#3B82F6', published: '#22C55E', archived: '#9CA3AF', rejected: '#EF4444',
    }
    return map[status] || '#6B7280'
  }

  const contentTypes = ['image', 'video', 'carousel', 'reel', 'story', 'short', 'live', 'text'] as const

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F7FA]">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F33]">Content Management</h1>
              <p className="text-sm text-[#4B6B7A] mt-1">Create, manage, and track all social media content</p>
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0A8FA8] text-white text-sm font-medium rounded-lg hover:bg-[#088096]">
              <Plus size={16} /> Create Post
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map(tab => {
              const Icon = tab.icon
              const count = tab.key === 'all' ? posts.length : posts.filter(p => p.status === tab.key).length
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.key ? 'bg-[#0A8FA8] text-white' : 'bg-white text-[#4B6B7A] border border-[#DBEAFE] hover:border-[#0A8FA8]'
                  }`}
                >
                  <Icon size={14} /> {tab.label} <span className="text-xs opacity-75">({count})</span>
                </button>
              )
            })}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0A8FA8]" size={48} /></div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-12 text-center">
              <p className="text-[#4B6B7A]">No posts found for this filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.map(post => {
                const statusColor = getStatusColor(post.status)
                return (
                  <div key={post.id} className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm hover:shadow-md transition-all overflow-hidden">
                    <div className="h-1.5" style={{ backgroundColor: statusColor }} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                          {post.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-[#F0F7FA] text-[#4B6B7A] capitalize">{post.content_type}</span>
                      </div>
                      <p className="text-sm text-[#0B1F33] font-medium mb-3 line-clamp-3">{post.caption || 'No caption'}</p>
                      {post.is_top_performing && (
                        <div className="flex items-center gap-1 mb-3 text-xs text-[#F59E0B] font-medium">⭐ Top Performing</div>
                      )}
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        <div className="text-center">
                          <Eye size={12} className="mx-auto text-[#4B6B7A] mb-1" />
                          <p className="text-xs font-medium text-[#0B1F33]">{post.reach_count?.toLocaleString() || 0}</p>
                        </div>
                        <div className="text-center">
                          <Heart size={12} className="mx-auto text-[#4B6B7A] mb-1" />
                          <p className="text-xs font-medium text-[#0B1F33]">{post.likes_count?.toLocaleString() || 0}</p>
                        </div>
                        <div className="text-center">
                          <Share2 size={12} className="mx-auto text-[#4B6B7A] mb-1" />
                          <p className="text-xs font-medium text-[#0B1F33]">{post.shares_count?.toLocaleString() || 0}</p>
                        </div>
                        <div className="text-center">
                          <MousePointerClick size={12} className="mx-auto text-[#4B6B7A] mb-1" />
                          <p className="text-xs font-medium text-[#0B1F33]">{post.clicks_count?.toLocaleString() || 0}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-[#DBEAFE]">
                        {post.status === 'draft' && (
                          <button onClick={() => handleAction(post.id, 'submit')} className="text-xs px-3 py-1.5 bg-[#F59E0B]/10 text-[#F59E0B] rounded-lg hover:bg-[#F59E0B]/20">Submit</button>
                        )}
                        {post.status === 'pending_approval' && (
                          <button onClick={() => handleAction(post.id, 'approve')} className="text-xs px-3 py-1.5 bg-[#10B981]/10 text-[#10B981] rounded-lg hover:bg-[#10B981]/20">Approve</button>
                        )}
                        {(post.status === 'approved' || post.status === 'scheduled') && (
                          <button onClick={() => handleAction(post.id, 'publish')} className="text-xs px-3 py-1.5 bg-[#22C55E]/10 text-[#22C55E] rounded-lg hover:bg-[#22C55E]/20">Publish</button>
                        )}
                        {post.status === 'published' && (
                          <button onClick={() => handleAction(post.id, 'archive')} className="text-xs px-3 py-1.5 bg-[#9CA3AF]/10 text-[#9CA3AF] rounded-lg hover:bg-[#9CA3AF]/20">Archive</button>
                        )}
                        <button onClick={() => handleAction(post.id, 'delete')} className="text-xs px-3 py-1.5 bg-[#EF4444]/10 text-[#EF4444] rounded-lg hover:bg-[#EF4444]/20 ml-auto">Delete</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Create Post Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                <div className="flex items-center justify-between p-6 border-b border-[#DBEAFE]">
                  <h3 className="text-lg font-semibold text-[#0B1F33]">Create New Post</h3>
                  <button onClick={() => setShowModal(false)} className="text-[#4B6B7A] hover:text-[#0B1F33]"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0B1F33] mb-1">Content Type</label>
                    <select value={form.content_type} onChange={e => setForm({ ...form, content_type: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]">
                      {contentTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0B1F33] mb-1">Account</label>
                    <select value={form.account_id} onChange={e => setForm({ ...form, account_id: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]">
                      <option value="">Select Account</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.account_name} ({a.platform})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0B1F33] mb-1">Campaign (Optional)</label>
                    <select value={form.campaign_id} onChange={e => setForm({ ...form, campaign_id: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]">
                      <option value="">No Campaign</option>
                      {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0B1F33] mb-1">Caption</label>
                    <textarea value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} rows={4} placeholder="Write your caption..." className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8] resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0B1F33] mb-1">Schedule For (Optional)</label>
                    <input type="datetime-local" value={form.scheduled_for} onChange={e => setForm({ ...form, scheduled_for: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t border-[#DBEAFE]">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-[#4B6B7A]">Cancel</button>
                  <button onClick={handleCreate} className="px-4 py-2 bg-[#0A8FA8] text-white text-sm font-medium rounded-lg hover:bg-[#088096]">Create Draft</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
