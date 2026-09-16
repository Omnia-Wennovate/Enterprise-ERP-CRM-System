'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Bell, Plus, AlertCircle, Loader2, CheckCircle, Flag, Calendar, Clock, X, ChevronDown, ChevronUp

} from 'lucide-react'
import {
  getAnnouncementsForUser, markAnnouncementRead, publishAnnouncementAction,
  type AnnouncementWithMeta
} from '../actions'
import { cn } from '@/lib/utils'

// ─── Priority styles ───────────────────────────────────────────────────────────
const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  emergency: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-l-red-500', dot: 'bg-red-500' },
  urgent: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-l-orange-500', dot: 'bg-orange-500' },
  high: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-l-amber-500', dot: 'bg-amber-500' },
  normal: { bg: 'bg-blue-50/50', text: 'text-blue-700', border: 'border-l-blue-400', dot: 'bg-blue-400' },
  low: { bg: 'bg-muted/50', text: 'text-muted-foreground', border: 'border-l-slate-300', dot: 'bg-slate-300' },
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  payroll_completed: 'Payroll',
  holiday_notice: 'Holiday',
  company_policy: 'Policy',
  office_meeting: 'Meeting',
  training: 'Training',
  visa_regulation: 'Visa',
  emergency: 'Emergency',
}

// ─── Publish Dialog ───────────────────────────────────────────────────────────
function PublishDialog({ profileId, profileName, onPublished, onClose }: {
  profileId: string; profileName: string; onPublished: () => void; onClose: () => void
}) {
  const [form, setForm] = useState({
    title: '', content: '', priority: 'normal', category: 'general',
    targetAudience: 'all', targetRoles: [] as string[], expiresAt: ''
  })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const set = (k: string, v: string | string[]) => setForm((f) => ({ ...f, [k]: v }))

  const ROLE_OPTIONS = [
    { value: 'sales', label: 'Sales' },
    { value: 'operations', label: 'Operations' },
    { value: 'finance', label: 'Finance' },
    { value: 'hr', label: 'HR' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'management', label: 'Management' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return
    setLoading(true); setErr(null); setSuccess(false)
    try {
      await publishAnnouncementAction({
        title: form.title, content: form.content,
        priority: form.priority, category: form.category,
        targetRoles: form.targetAudience === 'all' ? [] : form.targetRoles,
        publishedBy: profileId,
        publishedByName: profileName,
        expiresAt: form.expiresAt || undefined,
      })
      setSuccess(true)
      // Give brief success moment then close + reload
      setTimeout(() => { onPublished(); onClose() }, 800)
    } catch (e: any) {
      setErr(e.message || 'Failed to publish. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-border max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-foreground">New Announcement</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Broadcast to the team</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Title *</label>
            <input
              value={form.title} onChange={(e) => set('title', e.target.value)}
              placeholder="Announcement title…" required
              className="w-full px-3.5 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Content *</label>
            <textarea
              value={form.content} onChange={(e) => set('content', e.target.value)}
              placeholder="Write your announcement…" rows={4} required
              className="w-full px-3.5 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 text-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Priority</label>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 text-sm bg-white">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 text-sm bg-white">
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Target Audience</label>
            <div className="flex gap-2 flex-wrap">
              {[{ v: 'all', l: 'All Company' }, { v: 'dept', l: 'Specific Departments' }].map((opt) => (
                <button key={opt.v} type="button"
                  onClick={() => set('targetAudience', opt.v)}
                  className={cn('px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors',
                    form.targetAudience === opt.v ? 'bg-omnia-gold/10 border-omnia-gold/40 text-omnia-gold-dark' : 'border-border text-muted-foreground hover:bg-muted/50'
                  )}>
                  {opt.l}
                </button>
              ))}
            </div>
            {form.targetAudience === 'dept' && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {ROLE_OPTIONS.map((r) => (
                  <label key={r.value} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox"
                      checked={form.targetRoles.includes(r.value)}
                      onChange={(e) => set('targetRoles', e.target.checked
                        ? [...form.targetRoles, r.value]
                        : form.targetRoles.filter((x) => x !== r.value)
                      )}
                      className="w-4 h-4 accent-omnia-gold"
                    />
                    <span className="text-sm text-foreground">{r.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Expires</label>
            <input type="date" value={form.expiresAt} onChange={(e) => set('expiresAt', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 text-sm"
            />
          </div>
          {err && <p className="text-sm text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{err}</p>}
          {success && <p className="text-sm text-green-600 font-medium flex items-center gap-2"><CheckCircle className="w-4 h-4" />Published successfully!</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading || success || !form.title || !form.content}
              className="flex-1 px-4 py-2.5 bg-omnia-gold text-primary-foreground rounded-xl text-sm font-medium hover:bg-omnia-gold-dark transition-colors disabled:opacity-50">
              {loading ? 'Publishing…' : success ? 'Published!' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Announcement Card ─────────────────────────────────────────────────────────
function AnnouncementCard({ announcement, profileId, onRead }: {
  announcement: AnnouncementWithMeta; profileId: string; onRead: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [marking, setMarking] = useState(false)
  const styles = PRIORITY_STYLES[announcement.priority] || PRIORITY_STYLES.normal

  const handleMarkRead = async () => {
    if (announcement.isRead) return
    setMarking(true)
    try { await markAnnouncementRead(announcement.id, profileId); onRead() }
    finally { setMarking(false) }
  }

  const isLong = announcement.content.length > 200

  return (
    <div
      className={cn(
        'bg-card rounded-xl shadow-sm border border-border border-l-4 overflow-hidden transition-all',
        styles.border,
        !announcement.isRead && 'ring-1 ring-omnia-gold/20'
      )}
      onClick={handleMarkRead}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className={cn('w-2 h-2 rounded-full flex-shrink-0', styles.dot)} />
            <h3 className="font-semibold text-foreground leading-tight">{announcement.title}</h3>
            {!announcement.isRead && (
              <span className="bg-omnia-gold text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">NEW</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', styles.bg, styles.text)}>
              {announcement.priority}
            </span>
            {announcement.isRead && <CheckCircle className="w-4 h-4 text-green-500" />}
          </div>
        </div>
        <div className="ml-4.5">
          <p className={cn('text-sm text-muted-foreground leading-relaxed', !expanded && isLong && 'line-clamp-3')}>
            {announcement.content}
          </p>
          {isLong && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
              className="flex items-center gap-1 text-xs text-omnia-gold hover:text-omnia-gold-dark mt-1 font-medium"
            >
              {expanded ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Read more</>}
            </button>
          )}
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
            {announcement.publishedByName && <span>By <strong>{announcement.publishedByName}</strong></span>}
            {announcement.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(announcement.published_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            )}
            {announcement.category !== 'general' && (
              <span className="px-2 py-0.5 bg-muted rounded-full">{CATEGORY_LABELS[announcement.category] || announcement.category}</span>
            )}
            {announcement.expires_at && (
              <span className="flex items-center gap-1 text-amber-600">
                <Clock className="w-3 h-3" /> Expires {new Date(announcement.expires_at).toLocaleDateString()}
              </span>
            )}
            {marking && <Loader2 className="w-3 h-3 animate-spin text-omnia-gold" />}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [profileName, setProfileName] = useState<string>('')
  const [role, setRole] = useState('employee')
  const [department, setDepartment] = useState<string | null>(null)
  const [showPublish, setShowPublish] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [publishSuccess, setPublishSuccess] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        const u = JSON.parse(stored)
        setProfileId(u.id || null)
        setRole(u.role || 'employee')
        setDepartment(u.department || null)
        // Build display name from localStorage (used in notification message)
        const name = u.full_name || u.name || (
          u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : ''
        )
        setProfileName(name)
      }
    } catch { setError('Unable to load profile.'); setLoading(false) }
  }, [])

  const load = useCallback(() => {
    if (!profileId) return
    setLoading(true)
    getAnnouncementsForUser(profileId, department, role)
      .then(setAnnouncements)
      .catch(() => setError('Failed to load announcements.'))
      .finally(() => setLoading(false))
  }, [profileId, department, role])

  useEffect(() => { load() }, [load])

  // Roles that can publish announcements
  // Includes: super_admin, admin, hr_manager, manager, and any *_manager role
  const canPublish = [
    'super_admin', 'admin', 'hr_manager', 'manager',
  ].includes(role) || role.endsWith('_manager') || role.includes('admin')

  const unreadCount = announcements.filter((a) => !a.isRead).length
  const displayed = filter === 'unread' ? announcements.filter((a) => !a.isRead) : announcements

  const handlePublished = () => {
    setPublishSuccess(true)
    load()
    setTimeout(() => setPublishSuccess(false), 4000)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
            <p className="text-muted-foreground mt-1">Company-wide and department updates</p>
          </div>
          {canPublish && (
            <button onClick={() => setShowPublish(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-omnia-gold text-primary-foreground rounded-xl hover:bg-omnia-gold-dark font-medium text-sm shadow-sm">
              <Plus className="w-4 h-4" />New Announcement
            </button>
          )}
        </div>

        {/* Publish success banner */}
        {publishSuccess && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700 font-medium">Announcement published and sent to all eligible employees.</p>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {[
            { key: 'all' as const, label: `All (${announcements.length})` },
            { key: 'unread' as const, label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
          ].map((t) => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                filter === t.key ? 'border-omnia-gold text-omnia-gold-dark' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}>
              {t.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-l-4 border-slate-200 p-5 animate-pulse space-y-3">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && displayed.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              {filter === 'unread' ? 'All caught up!' : 'No announcements yet'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {filter === 'unread' ? 'You have no unread announcements.' : 'Announcements will appear here.'}
            </p>
          </div>
        )}

        {!loading && !error && displayed.length > 0 && profileId && (
          <div className="space-y-4">
            {displayed.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} profileId={profileId} onRead={load} />
            ))}
          </div>
        )}
      </div>

      {showPublish && profileId && (
        <PublishDialog
          profileId={profileId}
          profileName={profileName}
          onPublished={handlePublished}
          onClose={() => setShowPublish(false)}
        />
      )}
    </div>
  )
}
