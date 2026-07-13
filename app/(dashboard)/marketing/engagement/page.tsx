'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type { SocialComment, SocialMessage } from '@/types/marketing'
import { Loader2, MessageCircle, Mail, Clock, AlertTriangle, CheckCircle, Send, ThumbsUp, ThumbsDown, Minus } from 'lucide-react'
import { getComments, replyToComment, getMessages, answerMessage, getEngagementStats } from '@/lib/services/engagement'

export default function EngagementPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [comments, setComments] = useState<SocialComment[]>([])
  const [messages, setMessages] = useState<SocialMessage[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'comments' | 'messages'>('comments')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [commentFilter, setCommentFilter] = useState<'all' | 'unreplied' | 'replied'>('all')

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try { setProfile(JSON.parse(authUser)) } catch { router.push('/login') }
  }, [router])

  useEffect(() => { if (profile) loadData() }, [profile])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [c, m, s] = await Promise.all([getComments(), getMessages(), getEngagementStats()])
      setComments(c); setMessages(m); setStats(s)
    } catch (err) { console.error(err) }
    finally { setIsLoading(false) }
  }

  const handleReplyComment = async (commentId: string) => {
    if (!replyText.trim() || !profile) return
    try {
      await replyToComment(commentId, replyText, profile.id)
      setReplyingTo(null); setReplyText('')
      await loadData()
    } catch (err) { console.error(err) }
  }

  const handleAnswerMessage = async (messageId: string) => {
    if (!replyText.trim() || !profile) return
    try {
      await answerMessage(messageId, replyText, profile.id)
      setReplyingTo(null); setReplyText('')
      await loadData()
    } catch (err) { console.error(err) }
  }

  if (!profile) return null

  const sentimentIcon = (s: string | null) => {
    if (s === 'positive') return <ThumbsUp size={12} className="text-[#22C55E]" />
    if (s === 'negative') return <ThumbsDown size={12} className="text-[#EF4444]" />
    return <Minus size={12} className="text-[#6B7280]" />
  }

  const filteredComments = commentFilter === 'all' ? comments :
    commentFilter === 'unreplied' ? comments.filter(c => !c.is_replied) :
    comments.filter(c => c.is_replied)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F7FA]">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#0B1F33]">Customer Engagement</h1>
            <p className="text-sm text-[#4B6B7A] mt-1">Monitor and respond to social media interactions</p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {[
                { label: 'Total Comments', value: stats.totalComments, icon: MessageCircle, color: '#3B82F6' },
                { label: 'Total Messages', value: stats.totalMessages, icon: Mail, color: '#8B5CF6' },
                { label: 'Unanswered Comments', value: stats.unansweredComments, icon: AlertTriangle, color: '#EF4444' },
                { label: 'Unanswered Messages', value: stats.unansweredMessages, icon: AlertTriangle, color: '#F59E0B' },
                { label: 'Avg Response Time', value: `${stats.avgResponseTime}m`, icon: Clock, color: '#0A8FA8' },
              ].map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                        <Icon size={16} style={{ color: s.color }} />
                      </div>
                    </div>
                    <p className="text-xs text-[#4B6B7A]">{s.label}</p>
                    <p className="text-xl font-bold text-[#0B1F33] mt-1">{s.value}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button onClick={() => setActiveTab('comments')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'comments' ? 'bg-[#0A8FA8] text-white' : 'bg-white text-[#4B6B7A] border border-[#DBEAFE]'}`}>
              <MessageCircle size={14} /> Comments ({comments.length})
            </button>
            <button onClick={() => setActiveTab('messages')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'messages' ? 'bg-[#0A8FA8] text-white' : 'bg-white text-[#4B6B7A] border border-[#DBEAFE]'}`}>
              <Mail size={14} /> Messages ({messages.length})
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0A8FA8]" size={48} /></div>
          ) : activeTab === 'comments' ? (
            <>
              <div className="flex gap-2 mb-4">
                {(['all', 'unreplied', 'replied'] as const).map(f => (
                  <button key={f} onClick={() => setCommentFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${commentFilter === f ? 'bg-[#0A8FA8] text-white' : 'bg-white text-[#4B6B7A] border border-[#DBEAFE]'}`}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {filteredComments.length === 0 ? (
                  <div className="bg-white rounded-xl border border-[#DBEAFE] p-12 text-center text-sm text-[#4B6B7A]">No comments found</div>
                ) : filteredComments.map(c => (
                  <div key={c.id} className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#F0F7FA] rounded-full flex items-center justify-center text-xs font-bold text-[#0A8FA8]">
                          {(c.author_name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0B1F33]">{c.author_name || 'Unknown'}</p>
                          <p className="text-xs text-[#4B6B7A]">{new Date(c.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sentimentIcon(c.sentiment)}
                        {c.is_replied ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E]"><CheckCircle size={10} className="inline mr-1" />Replied</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444]">Pending</span>
                        )}
                        {c.priority === 'urgent' && <span className="text-xs px-2 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444]">🔴 Urgent</span>}
                        {c.priority === 'high' && <span className="text-xs px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]">🟡 High</span>}
                      </div>
                    </div>
                    <p className="text-sm text-[#0B1F33] mb-3 pl-10">{c.content}</p>
                    {c.reply_content && (
                      <div className="ml-10 p-3 bg-[#F0F7FA] rounded-lg mb-3 border-l-2 border-[#0A8FA8]">
                        <p className="text-xs text-[#4B6B7A] mb-1">Reply:</p>
                        <p className="text-sm text-[#0B1F33]">{c.reply_content}</p>
                      </div>
                    )}
                    {!c.is_replied && (
                      replyingTo === c.id ? (
                        <div className="ml-10 flex gap-2">
                          <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..." className="flex-1 border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" />
                          <button onClick={() => handleReplyComment(c.id)} className="px-3 py-2 bg-[#0A8FA8] text-white rounded-lg hover:bg-[#088096]"><Send size={14} /></button>
                          <button onClick={() => { setReplyingTo(null); setReplyText('') }} className="px-3 py-2 text-[#4B6B7A] text-sm">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setReplyingTo(c.id)} className="ml-10 text-xs px-3 py-1.5 text-[#0A8FA8] bg-[#0A8FA8]/10 rounded-lg hover:bg-[#0A8FA8]/20">Reply</button>
                      )
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#DBEAFE] p-12 text-center text-sm text-[#4B6B7A]">No messages found</div>
              ) : messages.map(m => (
                <div key={m.id} className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#F0F7FA] rounded-full flex items-center justify-center text-xs font-bold text-[#8B5CF6]">
                        {(m.sender_name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0B1F33]">{m.sender_name || 'Unknown'}</p>
                        <p className="text-xs text-[#4B6B7A]">{new Date(m.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.response_time_minutes && <span className="text-xs text-[#4B6B7A]"><Clock size={10} className="inline mr-1" />{m.response_time_minutes}m</span>}
                      {m.is_answered ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E]">Answered</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444]">Pending</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-[#0B1F33] mb-3 pl-10">{m.content}</p>
                  {m.response_content && (
                    <div className="ml-10 p-3 bg-[#F0F7FA] rounded-lg mb-3 border-l-2 border-[#8B5CF6]">
                      <p className="text-xs text-[#4B6B7A] mb-1">Response:</p>
                      <p className="text-sm text-[#0B1F33]">{m.response_content}</p>
                    </div>
                  )}
                  {!m.is_answered && (
                    replyingTo === m.id ? (
                      <div className="ml-10 flex gap-2">
                        <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your response..." className="flex-1 border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8]" />
                        <button onClick={() => handleAnswerMessage(m.id)} className="px-3 py-2 bg-[#0A8FA8] text-white rounded-lg hover:bg-[#088096]"><Send size={14} /></button>
                        <button onClick={() => { setReplyingTo(null); setReplyText('') }} className="px-3 py-2 text-[#4B6B7A] text-sm">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setReplyingTo(m.id)} className="ml-10 text-xs px-3 py-1.5 text-[#8B5CF6] bg-[#8B5CF6]/10 rounded-lg hover:bg-[#8B5CF6]/20">Respond</button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
