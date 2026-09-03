'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, MessageSquare, AlertCircle, Clock, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PresenceDot, PresenceStatus } from '@/components/communication/PresenceDot'
import {
  getConversationsForUser, getEmployeesForSearch,
  createDirectConversationAction, type ConversationWithMeta, type EmployeeOption
} from '../actions'
import { cn } from '@/lib/utils'

function relativeTime(ts: string | null): string {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function Initials({ name }: { name: string }) {
  const i = name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
  return (
    <div className="w-10 h-10 rounded-full bg-omnia-gold/15 flex items-center justify-center font-semibold text-omnia-gold-dark text-sm flex-shrink-0">
      {i}
    </div>
  )
}

// ─── New DM Dialog ────────────────────────────────────────────────────────────
function NewDMDialog({
  profileId,
  onClose,
}: {
  profileId: string
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    getEmployeesForSearch()
      .then(setEmployees)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = employees.filter(
    (e) =>
      e.id !== profileId &&
      (e.full_name.toLowerCase().includes(query.toLowerCase()) ||
       (e.department || '').toLowerCase().includes(query.toLowerCase()))
  )

  const startConversation = async (targetId: string) => {
    setStarting(targetId)
    try {
      const convId = await createDirectConversationAction(profileId, targetId)
      onClose()
      router.push(`/communication/dm/${convId}`)
    } catch (e) {
      console.error(e)
    } finally {
      setStarting(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-bold text-foreground">New Direct Message</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Find a team member to message</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or department…"
              className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 text-sm"
            />
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-omnia-gold animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {query ? 'No employees found' : 'No employees available'}
              </p>
            ) : (
              filtered.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => startConversation(emp.id)}
                  disabled={starting === emp.id}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-omnia-gold/15 flex items-center justify-center text-sm font-semibold text-omnia-gold-dark">
                      {emp.full_name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <PresenceDot userId={emp.id} className="absolute bottom-0 right-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{emp.full_name}</p>
                    <p className="text-xs text-muted-foreground">{emp.position || emp.department || ''}</p>
                  </div>
                  {starting === emp.id && <Loader2 className="w-4 h-4 animate-spin text-omnia-gold" />}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main DM Page ─────────────────────────────────────────────────────────────
export default function DirectMessagesPage() {
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewDM, setShowNewDM] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        const user = JSON.parse(stored)
        setProfileId(user.id || null)
      }
    } catch {
      setError('Unable to load user profile.')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!profileId) return
    setLoading(true)
    getConversationsForUser(profileId)
      .then(setConversations)
      .catch(() => setError('Failed to load conversations.'))
      .finally(() => setLoading(false))
  }, [profileId])

  const filtered = conversations.filter((conv) => {
    const name = conv.otherParticipant?.full_name || conv.title || ''
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Direct Messages</h1>
            <p className="text-muted-foreground mt-1">One-on-one conversations with team members</p>
          </div>
          <button
            onClick={() => setShowNewDM(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-omnia-gold text-primary-foreground rounded-xl hover:bg-omnia-gold-dark font-medium text-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            New Message
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conversations…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 bg-background"
                />
              </div>
            </div>

            <div className="divide-y divide-border max-h-[calc(100vh-280px)] overflow-y-auto">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-muted rounded w-2/3" />
                      <div className="h-3 bg-muted rounded w-full" />
                    </div>
                  </div>
                ))
              ) : error ? (
                <div className="p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {searchQuery ? 'Try a different search.' : 'Start a conversation with a team member.'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowNewDM(true)}
                      className="mt-3 px-4 py-2 bg-omnia-gold text-primary-foreground rounded-lg text-xs font-medium hover:bg-omnia-gold-dark transition-colors"
                    >
                      Start Conversation
                    </button>
                  )}
                </div>
              ) : (
                filtered.map((conv) => {
                  const participant = conv.otherParticipant
                  const name = participant?.full_name || conv.title || 'Conversation'
                  const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                  return (
                    <Link
                      key={conv.id}
                      href={`/communication/dm/${conv.id}`}
                      className="block p-4 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-omnia-gold/15 flex items-center justify-center font-semibold text-omnia-gold-dark text-sm">
                            {initials}
                          </div>
                          {participant && (
                            <PresenceDot userId={participant.id} className="absolute bottom-0 right-0" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn('text-sm truncate', conv.unreadCount > 0 ? 'font-bold text-foreground' : 'font-medium text-foreground')}>
                              {name}
                            </p>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {conv.unreadCount > 0 && (
                                <span className="bg-omnia-gold text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                          {conv.lastMessage && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                          )}
                          <div className="flex items-center gap-1 mt-1">
                            {participant && <PresenceStatus userId={participant.id} />}
                            {conv.lastMessageAt && (
                              <span className="text-xs text-muted-foreground ml-auto flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {relativeTime(conv.lastMessageAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>

          {/* Empty state panel */}
          <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border border-border p-12 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-omnia-gold/10 flex items-center justify-center mx-auto mb-5">
                <MessageSquare className="w-10 h-10 text-omnia-gold" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Select a conversation</h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                Choose a conversation from the list or start a new one with a team member.
              </p>
              <button
                onClick={() => setShowNewDM(true)}
                className="mt-5 px-5 py-2.5 bg-omnia-gold text-primary-foreground rounded-xl hover:bg-omnia-gold-dark font-medium text-sm transition-colors"
              >
                New Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {showNewDM && profileId && (
        <NewDMDialog profileId={profileId} onClose={() => setShowNewDM(false)} />
      )}
    </div>
  )
}
