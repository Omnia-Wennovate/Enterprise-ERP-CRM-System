'use client'

import { useState, useEffect } from 'react'
import {
  Calendar, Clock, Users, Plus, MapPin, Video, AlertCircle, Loader2, CheckCircle2, X
} from 'lucide-react'
import {
  getMeetingsForUser, createMeetingAction, updateMeetingStatusAction,
  getEmployeesForSearch, type MeetingWithMeta, type EmployeeOption
} from '../actions'
import { cn } from '@/lib/utils'

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-green-100 text-green-700',
    completed: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-red-100 text-red-600',
  }
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', map[status] || map.scheduled)}>
      {status.replace('_', ' ')}
    </span>
  )
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

// ─── Create Meeting Dialog ────────────────────────────────────────────────────
function CreateMeetingDialog({ profileId, onCreated, onClose }: {
  profileId: string; onCreated: () => void; onClose: () => void
}) {
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [form, setForm] = useState({
    title: '', description: '', agenda: '',
    meetingDate: '', startTime: '', endTime: '',
    location: '', meetingLink: ''
  })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    getEmployeesForSearch().then((e) => setEmployees(e.filter((emp) => emp.id !== profileId))).catch(console.error)
  }, [profileId])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const toggleParticipant = (id: string) =>
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.meetingDate || !form.startTime) return
    setLoading(true); setErr(null)
    try {
      await createMeetingAction({
        title: form.title, description: form.description || undefined,
        agenda: form.agenda || undefined,
        meetingDate: form.meetingDate, startTime: form.startTime,
        endTime: form.endTime || undefined, location: form.location || undefined,
        meetingLink: form.meetingLink || undefined,
        organizerId: profileId, participantIds: selected,
      })
      onCreated(); onClose()
    } catch (e: any) {
      setErr(e.message || 'Failed to schedule meeting.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-border max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-foreground">Schedule Meeting</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Set up a meeting with your team</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Meeting Title *</label>
            <input
              value={form.title} onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Weekly team sync" required
              className="w-full px-3.5 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-foreground mb-1.5">Date *</label>
              <input
                type="date" value={form.meetingDate} onChange={(e) => set('meetingDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]} required
                className="w-full px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Start Time *</label>
              <input
                type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} required
                className="w-full px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">End Time</label>
              <input
                type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
              <input
                value={form.location} onChange={(e) => set('location', e.target.value)}
                placeholder="Conference Room / Address"
                className="w-full px-3.5 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Video Link</label>
              <input
                value={form.meetingLink} onChange={(e) => set('meetingLink', e.target.value)}
                placeholder="https://zoom.us/j/…"
                className="w-full px-3.5 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Agenda</label>
            <textarea
              value={form.agenda} onChange={(e) => set('agenda', e.target.value)}
              placeholder="Meeting agenda items…" rows={2}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 text-sm resize-none"
            />
          </div>
          {/* Participants */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Participants ({selected.length} selected)
            </label>
            <div className="border border-border rounded-xl max-h-44 overflow-y-auto divide-y divide-border">
              {employees.map((emp) => (
                <label key={emp.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer">
                  <input
                    type="checkbox" checked={selected.includes(emp.id)}
                    onChange={() => toggleParticipant(emp.id)}
                    className="w-4 h-4 accent-omnia-gold"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{emp.full_name}</p>
                    <p className="text-xs text-muted-foreground">{emp.position || emp.department || ''}</p>
                  </div>
                </label>
              ))}
              {employees.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No employees found</p>
              )}
            </div>
          </div>
          {err && <p className="text-sm text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{err}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading || !form.title || !form.meetingDate || !form.startTime} className="flex-1 px-4 py-2.5 bg-omnia-gold text-primary-foreground rounded-xl text-sm font-medium hover:bg-omnia-gold-dark transition-colors disabled:opacity-50">
              {loading ? 'Scheduling…' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Meeting Card ─────────────────────────────────────────────────────────────
function MeetingCard({ meeting, onUpdate }: { meeting: MeetingWithMeta; onUpdate: () => void }) {
  const [cancelling, setCancelling] = useState(false)

  const handleCancel = async () => {
    if (!confirm('Cancel this meeting?')) return
    setCancelling(true)
    try { await updateMeetingStatusAction(meeting.id, 'cancelled'); onUpdate() }
    finally { setCancelling(false) }
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="font-semibold text-foreground text-base leading-tight">{meeting.title}</h3>
        <StatusBadge status={meeting.status} />
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <Calendar className="w-4 h-4 text-omnia-gold flex-shrink-0" />
          <span className="font-medium text-foreground">{formatDate(meeting.meeting_date)}</span>
        </div>
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>{meeting.start_time}{meeting.end_time ? ` – ${meeting.end_time}` : ''}</span>
        </div>
        {meeting.location && (
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>{meeting.location}</span>
          </div>
        )}
        {meeting.meeting_link && (
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Video className="w-4 h-4 flex-shrink-0" />
            <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer"
              className="text-omnia-gold hover:underline truncate">Join online</a>
          </div>
        )}
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <Users className="w-4 h-4 flex-shrink-0" />
          <span>{meeting.participantCount} participant{meeting.participantCount !== 1 ? 's' : ''}</span>
          <span className="text-xs">· Organizer: <span className="text-foreground font-medium">{meeting.organizerName}</span></span>
        </div>
      </div>
      {meeting.agenda && (
        <div className="mt-3 p-2.5 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground line-clamp-2">{meeting.agenda}</p>
        </div>
      )}
      {meeting.status === 'scheduled' && meeting.isOrganizer && (
        <div className="mt-4 flex gap-2">
          {meeting.meeting_link && (
            <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer"
              className="flex-1 px-3 py-2 bg-omnia-gold text-primary-foreground rounded-xl text-center text-sm font-medium hover:bg-omnia-gold-dark transition-colors">
              Join
            </a>
          )}
          <button
            onClick={handleCancel} disabled={cancelling}
            className="px-3 py-2 border border-border text-muted-foreground rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel'}
          </button>
        </div>
      )}
      {meeting.status === 'scheduled' && !meeting.isOrganizer && meeting.meeting_link && (
        <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 w-full px-3 py-2 bg-omnia-gold text-primary-foreground rounded-xl text-sm font-medium hover:bg-omnia-gold-dark transition-colors">
          Join Meeting
        </a>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user')
      if (stored) { const u = JSON.parse(stored); setProfileId(u.id || null) }
    } catch { setError('Unable to load profile.'); setLoading(false) }
  }, [])

  const loadMeetings = () => {
    if (!profileId) return
    setLoading(true)
    getMeetingsForUser(profileId)
      .then(setMeetings)
      .catch(() => setError('Failed to load meetings.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadMeetings() }, [profileId])

  const today = new Date().toISOString().split('T')[0]
  const upcoming = meetings.filter((m) => m.meeting_date >= today && m.status !== 'cancelled')
  const past = meetings.filter((m) => m.meeting_date < today || m.status === 'cancelled')
  const displayed = tab === 'upcoming' ? upcoming : past

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meetings</h1>
            <p className="text-muted-foreground mt-1">Schedule and manage team meetings</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-omnia-gold text-primary-foreground rounded-xl hover:bg-omnia-gold-dark font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Schedule Meeting
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {[{ key: 'upcoming' as const, label: 'Upcoming', count: upcoming.length },
            { key: 'past' as const, label: 'Past', count: past.length }].map((t) => (
            <button
              key={t.key} onClick={() => setTab(t.key)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === t.key ? 'border-omnia-gold text-omnia-gold-dark' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
              {t.count > 0 && (
                <span className={cn('ml-2 px-1.5 py-0.5 rounded-full text-xs',
                  tab === t.key ? 'bg-omnia-gold/10 text-omnia-gold-dark' : 'bg-muted text-muted-foreground'
                )}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse space-y-3">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-2/3" />
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
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              {tab === 'upcoming' ? 'No upcoming meetings' : 'No past meetings'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {tab === 'upcoming' ? 'Schedule a meeting to get started.' : 'Past meetings will appear here.'}
            </p>
            {tab === 'upcoming' && (
              <button onClick={() => setShowCreate(true)} className="mt-4 px-5 py-2.5 bg-omnia-gold text-primary-foreground rounded-xl text-sm font-medium hover:bg-omnia-gold-dark transition-colors">
                Schedule Meeting
              </button>
            )}
          </div>
        )}

        {!loading && !error && displayed.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {displayed.map((m) => <MeetingCard key={m.id} meeting={m} onUpdate={loadMeetings} />)}
          </div>
        )}
      </div>

      {showCreate && profileId && (
        <CreateMeetingDialog profileId={profileId} onCreated={loadMeetings} onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}
