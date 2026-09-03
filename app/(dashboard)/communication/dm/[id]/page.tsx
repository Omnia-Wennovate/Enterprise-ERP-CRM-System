'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Send, ArrowLeft, Loader2, AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  getConversationMessages, sendDMAction, markConversationRead, getConversationsForUser
} from '../../actions'
import { PresenceDot, PresenceStatus } from '@/components/communication/PresenceDot'
import { cn } from '@/lib/utils'

interface DMMessage {
  id: string
  content: string | null
  created_at: string
  sender_id: string
  profiles: { id: string; full_name: string; avatar_url: string | null } | null
}

function formatTime(ts: string) {
  const d = new Date(ts)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function DirectMessageDetailPage() {
  const params = useParams()
  const conversationId = params.id as string

  const [messages, setMessages] = useState<DMMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [profileName, setProfileName] = useState('You')
  const [otherParticipant, setOtherParticipant] = useState<{
    id: string; full_name: string
  } | null>(null)
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

  // Load messages
  useEffect(() => {
    if (!conversationId || !profileId) return
    setLoading(true)
    getConversationMessages(conversationId)
      .then(setMessages as any)
      .catch(() => setError('Failed to load messages.'))
      .finally(() => setLoading(false))
    markConversationRead(conversationId, profileId)
  }, [conversationId, profileId])

  // Load other participant info
  useEffect(() => {
    if (!profileId) return
    getConversationsForUser(profileId).then((convs) => {
      const conv = convs.find((c) => c.id === conversationId)
      if (conv?.otherParticipant) {
        setOtherParticipant({ id: conv.otherParticipant.id, full_name: conv.otherParticipant.full_name })
      }
    }).catch(() => { })
  }, [profileId, conversationId])

  // Realtime
  useEffect(() => {
    if (!conversationId) return
    const supabase = createClient()
    const sub = supabase
      .channel(`dm:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, async (payload) => {
        const msg = payload.new as any
        const { data: pData } = await supabase
          .from('profiles').select('id, first_name, last_name, avatar_url').eq('id', msg.sender_id).single()
        const profile = pData ? {
          id: pData.id,
          avatar_url: pData.avatar_url,
          full_name: `${pData.first_name || ''} ${pData.last_name || ''}`.trim() || 'Unknown'
        } : null
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, { ...msg, profiles: profile }]
        })
        if (profileId) markConversationRead(conversationId, profileId)
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [conversationId, profileId])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !profileId || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')
    try {
      await sendDMAction(conversationId, profileId, content)
      // Optimistic add
      setMessages((prev) => [...prev, {
        id: `opt-${Date.now()}`,
        content,
        created_at: new Date().toISOString(),
        sender_id: profileId,
        profiles: { id: profileId, full_name: profileName, avatar_url: null },
      }])
    } catch {
      setInput(content)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const otherName = otherParticipant?.full_name || 'Conversation'
  const otherInitials = otherName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-omnia-gold animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading conversation…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-foreground font-medium">{error}</p>
          <Link href="/communication/dm" className="text-sm text-omnia-gold hover:underline mt-2 inline-block">
            ← Back to Messages
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <Link href="/communication/dm" className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground lg:hidden">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-omnia-gold/15 flex items-center justify-center font-semibold text-omnia-gold-dark text-sm">
            {otherInitials}
          </div>
          {otherParticipant && <PresenceDot userId={otherParticipant.id} className="absolute bottom-0 right-0" />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground text-sm">{otherName}</h2>
          {otherParticipant && <PresenceStatus userId={otherParticipant.id} />}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-omnia-gold/10 flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-omnia-gold" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Start the conversation</h3>
            <p className="text-sm text-muted-foreground">Send a message to {otherName}</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.sender_id === profileId
          const prev = messages[i - 1]
          const grouped = prev?.sender_id === msg.sender_id &&
            new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < 300000

          return (
            <div key={msg.id} className={cn('flex gap-2 group', isOwn ? 'flex-row-reverse' : 'flex-row', grouped ? 'mt-0.5' : 'mt-3')}>
              {!grouped ? (
                <div className="w-8 h-8 rounded-full bg-omnia-gold/15 flex items-center justify-center text-xs font-semibold text-omnia-gold-dark flex-shrink-0 self-end">
                  {isOwn ? profileName.substring(0, 2).toUpperCase() : otherInitials}
                </div>
              ) : <div className="w-8 flex-shrink-0" />}
              <div className={cn('max-w-sm lg:max-w-md', isOwn ? 'items-end' : 'items-start', 'flex flex-col')}>
                {!grouped && (
                  <span className={cn('text-xs text-muted-foreground mb-1', isOwn ? 'text-right' : 'text-left')}>
                    {formatTime(msg.created_at)}
                  </span>
                )}
                <div className={cn(
                  'px-4 py-2.5 rounded-2xl text-sm break-words',
                  isOwn
                    ? 'bg-omnia-gold text-primary-foreground rounded-br-sm'
                    : 'bg-card shadow-sm border border-border text-foreground rounded-bl-sm'
                )}>
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="bg-card border-t border-border px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-muted rounded-xl px-4 py-2.5 border border-border focus-within:border-omnia-gold/40 focus-within:ring-1 focus-within:ring-omnia-gold/20 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
              }}
              placeholder={`Message ${otherName}…`}
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || !profileId}
            className="p-2.5 bg-omnia-gold text-primary-foreground rounded-xl hover:bg-omnia-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
