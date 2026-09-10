'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, MessageSquare, Hash, Bell, CheckSquare, Calendar, Users, Loader2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { searchCommunications, type SearchResult } from '../actions'
import { cn } from '@/lib/utils'

const TYPE_META: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
  message: { label: 'Message', icon: MessageSquare, color: 'text-blue-500' },
  channel_message: { label: 'Channel', icon: Hash, color: 'text-omnia-gold' },
  announcement: { label: 'Announcement', icon: Bell, color: 'text-purple-500' },
  task: { label: 'Task', icon: CheckSquare, color: 'text-amber-500' },
  meeting: { label: 'Meeting', icon: Calendar, color: 'text-green-500' },
  employee: { label: 'Employee', icon: Users, color: 'text-sky-500' },
}

function relativeTime(ts: string | null) {
  if (!ts) return null
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function CommunicationSearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user')
      if (stored) { const u = JSON.parse(stored); setProfileId(u.id || null) }
    } catch { }
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!query.trim() || query.length < 2 || !profileId) {
      setResults([]); return
    }
    clearTimeout(debounceRef.current)
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await searchCommunications(query, profileId)
        setResults(r)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, profileId])

  const navigate = (href: string) => router.push(href)

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    acc[r.type] = acc[r.type] || []
    acc[r.type].push(r)
    return acc
  }, {})

  const groupOrder = ['channel_message', 'message', 'announcement', 'task', 'meeting', 'employee']

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Search</h1>
          <p className="text-muted-foreground mt-1">Find messages, tasks, meetings, and more</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            {loading ? (
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search channels, messages, tasks, meetings, employees…"
            className="w-full pl-12 pr-4 py-4 bg-card border-2 border-border rounded-2xl focus:outline-none focus:border-omnia-gold text-base shadow-sm transition-all"
            autoFocus
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* No query state */}
        {!query && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-omnia-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Search className="w-10 h-10 text-omnia-gold" />
            </div>
            <h3 className="font-semibold text-foreground mb-2 text-lg">Search across everything</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Find channel messages, direct messages, announcements, tasks, meetings, and employees.
              Results respect your access permissions.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 max-w-sm mx-auto">
              {Object.entries(TYPE_META).map(([type, meta]) => {
                const Icon = meta.icon
                return (
                  <div key={type} className="flex flex-col items-center gap-1.5 p-3 bg-card rounded-xl border border-border">
                    <Icon className={cn('w-5 h-5', meta.color)} />
                    <span className="text-xs text-muted-foreground">{meta.label}s</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Results */}
        {query && !loading && results.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-medium">No results for &ldquo;{query}&rdquo;</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search term or check your spelling.</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">{results.length} result{results.length !== 1 ? 's' : ''}</p>
            {groupOrder.map((type) => {
              const group = grouped[type]
              if (!group || group.length === 0) return null
              const meta = TYPE_META[type]
              const Icon = meta.icon
              return (
                <div key={type}>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    <Icon className={cn('w-4 h-4', meta.color)} />
                    {meta.label}s
                  </h2>
                  <div className="space-y-2">
                    {group.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => navigate(result.href)}
                        className="w-full flex items-start gap-4 p-4 bg-card rounded-xl shadow-sm border border-border hover:shadow-md hover:border-omnia-gold/20 transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                          <Icon className={cn('w-5 h-5', meta.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm leading-snug">{result.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{result.excerpt}</p>
                          {result.timestamp && (
                            <p className="text-xs text-muted-foreground/70 mt-1">{relativeTime(result.timestamp)}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
