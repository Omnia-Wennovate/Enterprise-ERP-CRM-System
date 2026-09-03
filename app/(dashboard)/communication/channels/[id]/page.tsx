'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  Send, Hash, Lock, Users, ArrowLeft, Loader2, AlertCircle, Search, Info, X
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getDepartmentConfig, getChannelDepartment } from '@/lib/department-config'
import {
  getChannelDetail, sendChannelMessageAction, markChannelRead
} from '../../actions'
import { PresenceDot, PresenceStatus } from '@/components/communication/PresenceDot'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  content: string | null
  created_at: string
  sender_id: string
  profiles: { id: string; full_name: string; avatar_url: string | null } | null
}

interface Member {
  profile_id: string
  role: string
  profiles: { id: string; full_name: string; department: string | null; position: string | null } | null
}

function formatTime(ts: string): string {
  const d = new Date(ts)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={cn(
      'rounded-full bg-omnia-gold/15 flex items-center justify-center font-semibold text-omnia-gold-dark flex-shrink-0',
      sizeClass
    )}>
      {initials}
    </div>
  )
}

export default function ChannelDetailPage() {
  const params = useParams()
  const channelId = params.id as string

  const [channel, setChannel] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileId, setProfileId] = useState<string | null>(null)
  const [profileName, setProfileName] = useState<string>('You')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        const user = JSON.parse(stored)
        setProfileId(user.id || null)
        setProfileName(user.full_name || user.name || 'You')
      }
    } catch { }
  }, [])

  // Load channel data
  useEffect(() => {
    if (!channelId) return
    setLoading(true)
    getChannelDetail(channelId)
      .then(({ channel, members, messages }) => {
        setChannel(channel)
        setMembers(members as Member[])
        setMessages(messages as Message[])
        // Mark as read
        if (profileId) markChannelRead(channelId, profileId)
      })
      .catch(() => setError('Failed to load channel.'))
      .finally(() => setLoading(false))
  }, [channelId, profileId])

  // Realtime subscription for new messages
  useEffect(() => {
    if (!channelId) return
    const supabase = createClient()
    const sub = supabase
      .channel(`channel:${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'channel_messages',
        filter: `channel_id=eq.${channelId}`,
      }, async (payload) => {
        const newMsg = payload.new as any
        // Fetch sender profile
        const { data: pData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .eq('id', newMsg.sender_id)
          .single()
        const profile = pData ? {
          id: pData.id,
          avatar_url: pData.avatar_url,
          full_name: `${pData.first_name || ''} ${pData.last_name || ''}`.trim() || 'Unknown'
        } : null
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev
          return [...prev, { ...newMsg, profiles: profile }]
        })
        if (profileId) markChannelRead(channelId, profileId)
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [channelId, profileId])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!messageInput.trim() || !profileId || sending) return
    setSending(true)
    const content = messageInput.trim()
    setMessageInput('')
    try {
      await sendChannelMessageAction(channelId, profileId, content)
      // Realtime will add it; optimistic add for responsiveness
      setMessages((prev) => [
        ...prev,
        {
          id: `opt-${Date.now()}`,
          content,
          created_at: new Date().toISOString(),
          sender_id: profileId,
          profiles: { id: profileId, full_name: profileName, avatar_url: null },
        },
      ])
    } catch {
      setMessageInput(content) // restore on error
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const deptKey = channel ? getChannelDepartment(channel.name) : 'general'
  const deptConfig = getDepartmentConfig(deptKey)

  const filteredMessages = searchQuery
    ? messages.filter((m) =>
        m.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-omnia-gold animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading channel…</p>
        </div>
      </div>
    )
  }

  if (error || !channel) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-foreground font-medium">{error || 'Channel not found'}</p>
          <Link href="/communication/channels" className="text-sm text-omnia-gold hover:underline mt-2 inline-block">
            ← Back to Channels
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* ── Channel Header ── */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 flex-shrink-0">
        {/* Dept accent bar */}
        <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: deptConfig.accent }} />

        <Link
          href="/communication/channels"
          className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground lg:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="w-9 h-9 rounded-xl bg-omnia-gold/10 flex items-center justify-center flex-shrink-0">
          {channel.is_private ? (
            <Lock className="w-5 h-5 text-omnia-gold" />
          ) : (
            <Hash className="w-5 h-5 text-omnia-gold" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-foreground">#{channel.name}</h2>
            {channel.is_private && (
              <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded">Private</span>
            )}
          </div>
          {channel.description && (
            <p className="text-xs text-muted-foreground truncate">{channel.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages…"
              className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-omnia-gold/40 w-40"
            />
          </div>
          <button
            onClick={() => setShowMembers((v) => !v)}
            className={cn(
              'p-2 rounded-lg transition-colors text-muted-foreground',
              showMembers ? 'bg-omnia-gold/10 text-omnia-gold' : 'hover:bg-muted'
            )}
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ── Messages ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {filteredMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <Hash className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-foreground mb-1">
                  {searchQuery ? 'No messages match your search' : `Welcome to #${channel.name}`}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {searchQuery
                    ? 'Try a different search term.'
                    : 'This is the beginning of the channel. Send the first message!'}
                </p>
              </div>
            )}

            {filteredMessages.map((msg, i) => {
              const isOwn = msg.sender_id === profileId
              const prevMsg = filteredMessages[i - 1]
              const isSameSender = prevMsg?.sender_id === msg.sender_id &&
                new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 5 * 60000
              const name = msg.profiles?.full_name || 'Unknown'

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-2.5 group',
                    isSameSender ? 'mt-0.5' : 'mt-3',
                    isOwn ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {!isSameSender ? (
                    <div className="relative flex-shrink-0">
                      <Avatar name={name} />
                      <PresenceDot userId={msg.sender_id} className="absolute bottom-0 right-0" />
                    </div>
                  ) : (
                    <div className="w-9 flex-shrink-0" />
                  )}
                  <div className={cn('flex flex-col max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
                    {!isSameSender && (
                      <div className={cn('flex items-center gap-2 mb-1', isOwn ? 'flex-row-reverse' : 'flex-row')}>
                        <span className="text-xs font-semibold text-foreground">{isOwn ? 'You' : name}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(msg.created_at)}</span>
                      </div>
                    )}
                    <div className={cn(
                      'px-3.5 py-2 rounded-2xl text-sm',
                      isOwn
                        ? 'bg-omnia-gold text-primary-foreground rounded-br-sm'
                        : 'bg-card shadow-sm border border-border text-foreground rounded-bl-sm'
                    )}>
                      {msg.content}
                    </div>
                    {isSameSender && (
                      <span className="text-xs text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatTime(msg.created_at)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Message Composer ── */}
          {!channel.is_readonly ? (
            <div className="bg-card border-t border-border px-4 py-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-muted rounded-xl px-4 py-2.5 border border-border focus-within:border-omnia-gold/40 focus-within:ring-1 focus-within:ring-omnia-gold/20 transition-all">
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder={`Message #${channel.name}…`}
                    className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!messageInput.trim() || sending || !profileId}
                  className="p-2.5 bg-omnia-gold text-primary-foreground rounded-xl hover:bg-omnia-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-muted border-t border-border px-4 py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground flex-shrink-0">
              <Info className="w-4 h-4" />
              This is a read-only channel
            </div>
          )}
        </div>

        {/* ── Members Sidebar ── */}
        {showMembers && (
          <div className="w-64 border-l border-border bg-card flex flex-col flex-shrink-0 overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm">
                Members · {members.length}
              </h3>
              <button onClick={() => setShowMembers(false)} className="p-1 hover:bg-muted rounded transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {members.map((m) => {
                const prof = m.profiles
                const name = prof?.full_name || 'Unknown'
                const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                return (
                  <div key={m.profile_id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-omnia-gold/15 flex items-center justify-center text-xs font-semibold text-omnia-gold-dark">
                        {initials}
                      </div>
                      <PresenceDot userId={m.profile_id} className="absolute bottom-0 right-0" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{name}</p>
                      {prof?.department && (
                        <p className="text-xs text-muted-foreground truncate">{prof.department}</p>
                      )}
                    </div>
                    {m.role === 'moderator' && (
                      <span className="text-xs text-omnia-gold flex-shrink-0">Admin</span>
                    )}
                  </div>
                )
              })}
              {members.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No members yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
