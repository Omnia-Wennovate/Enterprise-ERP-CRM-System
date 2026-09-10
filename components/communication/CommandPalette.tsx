'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageSquare, Hash, CheckSquare, Calendar, Search,
  Bell, Users, ArrowRight, Loader2,
} from 'lucide-react'
import { searchCommunications, type SearchResult } from '@/app/(dashboard)/communication/actions'
import { cn } from '@/lib/utils'

interface CommandPaletteProps {
  profileId: string
  userRole: string
  isOpen: boolean
  onClose: () => void
}

const TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  message: MessageSquare,
  channel_message: Hash,
  announcement: Bell,
  task: CheckSquare,
  meeting: Calendar,
  employee: Users,
}

const TYPE_LABELS: Record<string, string> = {
  message: 'Message',
  channel_message: 'Channel',
  announcement: 'Announcement',
  task: 'Task',
  meeting: 'Meeting',
  employee: 'Employee',
}

const QUICK_ACTIONS = [
  { label: 'New Direct Message', href: '/communication/dm', icon: MessageSquare, action: 'new-dm' },
  { label: 'New Task', href: '/communication/tasks', icon: CheckSquare, action: 'new-task' },
  { label: 'Schedule Meeting', href: '/communication/meetings', icon: Calendar, action: 'new-meeting' },
  { label: 'Go to Channels', href: '/communication/channels', icon: Hash, action: 'nav' },
  { label: 'Go to Announcements', href: '/communication/announcements', icon: Bell, action: 'nav' },
  { label: 'Search All', href: '/communication/search', icon: Search, action: 'nav' },
]

export function CommandPalette({ profileId, userRole, isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await searchCommunications(query, profileId)
        setResults(r)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(debounceRef.current)
  }, [query, profileId])

  const items = query.trim() ? results : []
  const quickActions = !query.trim() ? QUICK_ACTIONS : []
  const totalItems = items.length + quickActions.length

  const navigate = useCallback((href: string) => {
    onClose()
    router.push(href)
  }, [router, onClose])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((s) => Math.min(s + 1, totalItems - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((s) => Math.max(s - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (query.trim()) {
          const r = items[selected]
          if (r) navigate(r.href)
        } else {
          const qa = quickActions[selected]
          if (qa) navigate(qa.href)
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, selected, totalItems, items, quickActions, query, navigate, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 mx-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            {loading ? (
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin flex-shrink-0" />
            ) : (
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(0) }}
              placeholder="Search channels, messages, tasks, meetings…"
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-base"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-muted-foreground">
              Esc
            </kbd>
          </div>

          {/* Results / Quick Actions */}
          <div className="max-h-96 overflow-y-auto py-2">
            {!query.trim() && (
              <>
                <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick Actions
                </p>
                {quickActions.map((qa, i) => {
                  const Icon = qa.icon
                  return (
                    <button
                      key={qa.action + qa.href}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        selected === i ? 'bg-omnia-gold/10' : 'hover:bg-muted/50'
                      )}
                      onMouseEnter={() => setSelected(i)}
                      onClick={() => navigate(qa.href)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-omnia-gold/15 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-omnia-gold" />
                      </div>
                      <span className="font-medium text-foreground">{qa.label}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </button>
                  )
                })}
              </>
            )}

            {query.trim() && results.length === 0 && !loading && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                No results for &ldquo;{query}&rdquo;
              </div>
            )}

            {results.length > 0 && (
              <>
                <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Results
                </p>
                {results.map((result, i) => {
                  const Icon = TYPE_ICONS[result.type] || Search
                  return (
                    <button
                      key={result.id}
                      className={cn(
                        'w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors',
                        selected === i ? 'bg-omnia-gold/10' : 'hover:bg-muted/50'
                      )}
                      onMouseEnter={() => setSelected(i)}
                      onClick={() => navigate(result.href)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.excerpt}</p>
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0">
                        {TYPE_LABELS[result.type]}
                      </span>
                    </button>
                  )
                })}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>Esc close</span>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Hook for mounting the palette ───────────────────────────────────────────

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }
}
