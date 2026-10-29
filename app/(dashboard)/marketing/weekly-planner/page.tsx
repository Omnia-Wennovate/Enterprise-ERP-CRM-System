'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useProfile } from '@/lib/context/profile-context'
import type {
  WeeklyContentPlan,
  WeeklyPlanStatus,
  ContentBacklogItem,
  ContentBacklogCategory,
  ImportedCalendar,
} from '@/types/marketing'
import { PLATFORM_LABELS } from '@/types/marketing'
import {
  Loader2, ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, CheckCircle, Clock,
  Star, Pencil, Trash2, CalendarPlus, AlertTriangle, AlertCircle, Upload, FileText,
} from 'lucide-react'
import {
  getWeeklyPlansForWeeks, createWeeklyPlan, createBulkWeeklyPlans, updateWeeklyPlan, updateWeeklyPlanStatus,
  deleteWeeklyPlan, deleteWeeklyPlansByIds,
  getPlannerNotes, savePlannerNotes,
  getContentBacklog, createBacklogItem, createBacklogItems, updateBacklogItem, deleteBacklogItem, deleteBacklogItemsByIds,
  getWeekStartDate, getWeekDates, addDays, parseDateKey, toDateKey,
} from '@/lib/services/weekly-planner'
import { getCampaigns } from '@/lib/services/campaigns'

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const CALENDAR_PLATFORMS = ['tiktok', 'instagram', 'facebook'] as const
const POST_TYPES = ['video', 'reel', 'image', 'carousel', 'story', 'text'] as const

const BACKLOG_SECTIONS: { key: ContentBacklogCategory; label: string; statusHint: string }[] = [
  { key: 'recorded', label: 'Recorded, waiting to be used', statusHint: 'Recorded and edited' },
  { key: 'to_record', label: 'Still to record', statusHint: 'Needs a recording session' },
  { key: 'idea', label: 'Other ideas', statusHint: 'Confirm what footage exists' },
  { key: 'coming_up', label: 'Coming up', statusHint: 'Plan in early November' },
]

const NEXT_STATUS: Partial<Record<WeeklyPlanStatus, WeeklyPlanStatus>> = {
  draft: 'in_progress',
  in_progress: 'ready',
  ready: 'draft',
}

const platformLabel = (p: string) => PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS] ?? p
const fmtShort = (key: string) => parseDateKey(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const fmtWeekday = (key: string) => parseDateKey(key).toLocaleDateString('en-US', { weekday: 'short' })
const fmtDayDate = (key: string) => `${fmtWeekday(key)}, ${fmtShort(key)}`
const fmtLong = (key: string, withYear = false) =>
  parseDateKey(key).toLocaleDateString('en-US', { month: 'long', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) })

/** 0 = Monday … 6 = Sunday, matching day_of_week */
const dayIndex = (key: string) => (parseDateKey(key).getDay() + 6) % 7
const planDate = (p: WeeklyContentPlan) => addDays(p.week_start_date, p.day_of_week)

interface EntryForm {
  date: string
  content_theme: string
  platform: string
  cross_post_platforms: string[]
  host: string
  is_featured: boolean
  recording: 'recorded' | 'scheduled' | 'none'
  recording_date: string
  post_type: string
  campaign_id: string
  notes: string
}

const emptyEntry = (date: string): EntryForm => ({
  date,
  content_theme: '',
  platform: 'tiktok',
  cross_post_platforms: [],
  host: '',
  is_featured: false,
  recording: 'none',
  recording_date: '',
  post_type: 'video',
  campaign_id: '',
  notes: '',
})

interface BacklogForm {
  title: string
  category: ContentBacklogCategory
  host: string
  status: string
}

const inputCls = 'w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary'
const labelCls = 'block text-sm font-medium text-foreground mb-1'

// ============================================================================
// PAGE
// ============================================================================

export default function WeeklyPlannerPage() {
  const profile = useProfile()
  const [weekStart, setWeekStart] = useState<string>(getWeekStartDate(new Date()))
  const [plans, setPlans] = useState<WeeklyContentPlan[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [backlog, setBacklog] = useState<ContentBacklogItem[]>([])
  const [notes, setNotes] = useState('')
  const [notesDraft, setNotesDraft] = useState<string | null>(null)
  const [setupMissing, setSetupMissing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [entryModal, setEntryModal] = useState<{
    form: EntryForm
    editingId: string | null
    backlogId: string | null
  } | null>(null)
  const [backlogModal, setBacklogModal] = useState<{ form: BacklogForm; editingId: string | null } | null>(null)

  // PDF import
  const [isDragging, setIsDragging] = useState(false)
  const [readingFile, setReadingFile] = useState<string | null>(null)
  const [importPreview, setImportPreview] = useState<{
    calendar: ImportedCalendar
    fileName: string
    existingIds: string[]
    replace: boolean
  } | null>(null)
  const [removeAll, setRemoveAll] = useState<{ includeBacklog: boolean } | null>(null)
  const dragDepth = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const weeks = useMemo(() => [weekStart, addDays(weekStart, 7)], [weekStart])
  const cycleDays = useMemo(() => weeks.flatMap((w) => getWeekDates(w).map((d) => d.date)), [weeks])
  const cycleEnd = cycleDays[cycleDays.length - 1]

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true)
    try {
      const [p, c, n, b] = await Promise.all([
        getWeeklyPlansForWeeks(weeks),
        getCampaigns().catch(() => []),
        getPlannerNotes(weeks[0]).catch(() => null),
        getContentBacklog().catch(() => null),
      ])
      setPlans(p)
      setCampaigns(c)
      setNotes(n ?? '')
      setBacklog(b ?? [])
      // Notes / backlog tables only exist after weekly-planner-calendar-migration.sql
      setSetupMissing(n === null || b === null)
    } catch (err) {
      console.error('Failed to load planner:', err)
    } finally {
      setIsLoading(false)
    }
  }, [weeks])

  useEffect(() => {
    setNotesDraft(null)
    loadData()
  }, [loadData])

  const plansByDate = useMemo(() => {
    const map: Record<string, WeeklyContentPlan[]> = {}
    plans.forEach((p) => {
      const key = planDate(p)
      ;(map[key] ??= []).push(p)
    })
    return map
  }, [plans])

  const knownHosts = useMemo(() => {
    const set = new Set<string>()
    plans.forEach((p) => p.host && set.add(p.host))
    backlog.forEach((b) => b.host && set.add(b.host))
    return Array.from(set).sort()
  }, [plans, backlog])

  // --------------------------------------------------------------------------
  // Calendar entry actions
  // --------------------------------------------------------------------------

  const openNewEntry = (date: string) => setEntryModal({ form: emptyEntry(date), editingId: null, backlogId: null })

  const openEditEntry = (plan: WeeklyContentPlan) => {
    setEntryModal({
      editingId: plan.id,
      backlogId: null,
      form: {
        date: planDate(plan),
        content_theme: plan.content_theme ?? '',
        platform: plan.platform ?? 'tiktok',
        cross_post_platforms: plan.cross_post_platforms ?? [],
        host: plan.host ?? '',
        is_featured: !!plan.is_featured,
        recording: plan.is_recorded ? 'recorded' : plan.recording_date ? 'scheduled' : 'none',
        recording_date: plan.recording_date ?? '',
        post_type: plan.post_type ?? 'video',
        campaign_id: plan.campaign_id ?? '',
        notes: plan.notes ?? '',
      },
    })
  }

  const scheduleBacklogItem = (item: ContentBacklogItem) => {
    const firstOpenDay = cycleDays.find((d) => !plansByDate[d]?.length) ?? cycleDays[0]
    setEntryModal({
      editingId: null,
      backlogId: item.id,
      form: {
        ...emptyEntry(firstOpenDay),
        content_theme: item.title,
        host: item.host ?? '',
        recording: item.category === 'recorded' ? 'recorded' : 'none',
      },
    })
  }

  const updateEntryForm = (patch: Partial<EntryForm>) =>
    setEntryModal((m) => (m ? { ...m, form: { ...m.form, ...patch } } : m))

  const handleSaveEntry = async () => {
    if (!entryModal) return
    const { form, editingId, backlogId } = entryModal
    if (!form.content_theme.trim()) {
      alert('Enter the content for this day.')
      return
    }

    const payload: Partial<WeeklyContentPlan> = {
      week_start_date: getWeekStartDate(parseDateKey(form.date)),
      day_of_week: dayIndex(form.date),
      content_theme: form.content_theme.trim(),
      platform: form.platform,
      cross_post_platforms: form.cross_post_platforms.filter((p) => p !== form.platform),
      host: form.host.trim() || null,
      is_featured: form.is_featured,
      is_gap_day: false,
      is_recorded: form.recording === 'recorded',
      recording_date: form.recording === 'scheduled' && form.recording_date ? form.recording_date : null,
      post_type: form.post_type,
      campaign_id: form.campaign_id || null,
      notes: form.notes.trim() || null,
    }

    setIsSaving(true)
    try {
      if (editingId) {
        await updateWeeklyPlan(editingId, payload)
      } else {
        await createWeeklyPlan({ ...payload, status: 'draft', created_by: profile?.id ?? null })
      }
      if (backlogId) await deleteBacklogItem(backlogId)
      setEntryModal(null)
      await loadData(true)
    } catch (err: any) {
      console.error('Failed to save plan:', err)
      alert(`Failed to save plan: ${err.message || 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleMarkGapDay = async (date: string) => {
    try {
      await createWeeklyPlan({
        week_start_date: getWeekStartDate(parseDateKey(date)),
        day_of_week: dayIndex(date),
        content_theme: 'Gap day',
        platform: null,
        is_gap_day: true,
        status: 'ready',
        created_by: profile?.id ?? null,
      })
      await loadData(true)
    } catch (err: any) {
      alert(`Failed to mark gap day: ${err.message || 'Unknown error'}`)
    }
  }

  const handleStatusCycle = async (plan: WeeklyContentPlan) => {
    const next = NEXT_STATUS[plan.status] ?? 'draft'
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, status: next } : p)))
    try {
      await updateWeeklyPlanStatus(plan.id, next)
    } catch (err) {
      console.error(err)
      loadData(true)
    }
  }

  const handleDeleteEntry = async (plan: WeeklyContentPlan) => {
    if (!confirm(plan.is_gap_day ? 'Remove this gap day?' : `Delete "${plan.content_theme}"?`)) return
    try {
      await deleteWeeklyPlan(plan.id)
      await loadData(true)
    } catch (err) {
      console.error(err)
    }
  }

  // --------------------------------------------------------------------------
  // Notes
  // --------------------------------------------------------------------------

  const handleSaveNotes = async () => {
    if (notesDraft === null) return
    setIsSaving(true)
    try {
      await savePlannerNotes(weeks[0], notesDraft.trim(), profile?.id)
      setNotes(notesDraft.trim())
      setNotesDraft(null)
    } catch (err: any) {
      alert(`Failed to save notes: ${err.message || 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // --------------------------------------------------------------------------
  // Backlog
  // --------------------------------------------------------------------------

  const handleSaveBacklog = async () => {
    if (!backlogModal) return
    const { form, editingId } = backlogModal
    if (!form.title.trim()) {
      alert('Enter the content piece.')
      return
    }
    const payload = {
      title: form.title.trim(),
      category: form.category,
      host: form.host.trim() || null,
      status: form.status.trim() || null,
    }
    setIsSaving(true)
    try {
      if (editingId) await updateBacklogItem(editingId, payload)
      else await createBacklogItem({ ...payload, created_by: profile?.id ?? null })
      setBacklogModal(null)
      await loadData(true)
    } catch (err: any) {
      alert(`Failed to save item: ${err.message || 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteBacklog = async (item: ContentBacklogItem) => {
    if (!confirm(`Delete "${item.title}"?`)) return
    try {
      await deleteBacklogItem(item.id)
      await loadData(true)
    } catch (err) {
      console.error(err)
    }
  }

  // --------------------------------------------------------------------------
  // Remove all (current 2-week cycle)
  // --------------------------------------------------------------------------

  const handleRemoveAll = async () => {
    if (!removeAll) return
    setIsSaving(true)
    try {
      await deleteWeeklyPlansByIds(plans.map((p) => p.id))
      if (notes) await savePlannerNotes(weeks[0], '', profile?.id)
      if (removeAll.includeBacklog) await deleteBacklogItemsByIds(backlog.map((b) => b.id))
      setRemoveAll(null)
      setNotesDraft(null)
      await loadData(true)
    } catch (err: any) {
      alert(`Failed to remove: ${err.message || 'Unknown error'}`)
      await loadData(true)
    } finally {
      setIsSaving(false)
    }
  }

  // --------------------------------------------------------------------------
  // PDF import
  // --------------------------------------------------------------------------

  const handleImportFile = async (file: File) => {
    if (setupMissing) {
      alert('Run weekly-planner-calendar-migration.sql in Supabase before importing.')
      return
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please drop a PDF file.')
      return
    }

    setReadingFile(file.name)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/marketing/weekly-planner/import', { method: 'POST', body })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `Import failed (${res.status})`)

      const calendar = json.calendar as ImportedCalendar
      const importWeeks = Array.from(new Set(calendar.entries.map((e) => getWeekStartDate(parseDateKey(e.date)))))
      const existing = importWeeks.length ? await getWeeklyPlansForWeeks(importWeeks) : []

      setImportPreview({
        calendar,
        fileName: file.name,
        existingIds: existing.map((p) => p.id),
        replace: true,
      })
    } catch (err: any) {
      alert(err.message || 'Failed to read the PDF')
    } finally {
      setReadingFile(null)
    }
  }

  const handleApplyImport = async () => {
    if (!importPreview) return
    const { calendar, existingIds, replace } = importPreview
    const firstDate = calendar.cycle_start ?? calendar.entries[0]?.date
    const cycleStart = firstDate ? getWeekStartDate(parseDateKey(firstDate)) : weekStart

    setIsSaving(true)
    try {
      // Create the new rows before removing old ones, so a failure never leaves the weeks empty
      await createBulkWeeklyPlans(calendar.entries.map((e) => ({
        week_start_date: getWeekStartDate(parseDateKey(e.date)),
        day_of_week: dayIndex(e.date),
        content_theme: e.is_gap_day ? 'Gap day' : e.content,
        platform: e.is_gap_day ? null : e.platform,
        cross_post_platforms: e.is_gap_day ? [] : e.cross_post_platforms,
        host: e.is_gap_day ? null : e.host,
        is_featured: !e.is_gap_day && e.is_featured,
        is_gap_day: e.is_gap_day,
        is_recorded: !e.is_gap_day && e.recording === 'recorded',
        recording_date: !e.is_gap_day && e.recording === 'scheduled' ? e.recording_date : null,
        post_type: 'video',
        status: e.is_gap_day ? 'ready' : 'draft',
        created_by: profile?.id ?? null,
      })))
      if (replace) await deleteWeeklyPlansByIds(existingIds)

      if (calendar.notes.length > 0) {
        const previous = replace ? '' : await getPlannerNotes(cycleStart)
        await savePlannerNotes(cycleStart, [previous, ...calendar.notes].filter(Boolean).join('\n'), profile?.id)
      }

      const knownTitles = new Set(backlog.map((b) => b.title.trim().toLowerCase()))
      await createBacklogItems(
        calendar.backlog
          .filter((b) => !knownTitles.has(b.title.trim().toLowerCase()))
          .map((b) => ({ ...b, created_by: profile?.id ?? null }))
      )

      setImportPreview(null)
      if (cycleStart === weekStart) await loadData(true)
      else setWeekStart(cycleStart)
    } catch (err: any) {
      alert(`Import failed: ${err.message || 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const isFileDrag = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes('Files')

  const dropHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      if (!isFileDrag(e)) return
      e.preventDefault()
      dragDepth.current += 1
      setIsDragging(true)
    },
    onDragOver: (e: React.DragEvent) => {
      if (isFileDrag(e)) e.preventDefault()
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!isFileDrag(e)) return
      dragDepth.current = Math.max(0, dragDepth.current - 1)
      if (dragDepth.current === 0) setIsDragging(false)
    },
    onDrop: (e: React.DragEvent) => {
      if (!isFileDrag(e)) return
      e.preventDefault()
      dragDepth.current = 0
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleImportFile(file)
    },
  }

  // --------------------------------------------------------------------------
  // Recording schedule (derived from calendar entries)
  // --------------------------------------------------------------------------

  const recordingRows = useMemo(() => {
    const rank = (p: WeeklyContentPlan) => (p.is_recorded ? 0 : p.recording_date ? 1 : 2)
    return plans
      .filter((p) => !p.is_gap_day)
      .map((p) => ({ plan: p, airDate: planDate(p) }))
      .sort((a, b) =>
        rank(a.plan) - rank(b.plan) ||
        (a.plan.recording_date ?? a.airDate).localeCompare(b.plan.recording_date ?? b.airDate) ||
        a.airDate.localeCompare(b.airDate)
      )
  }, [plans])

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderPlatformCell = (plan: WeeklyContentPlan, column: string) => {
    if (plan.is_gap_day) {
      return column === 'tiktok'
        ? <span className="italic text-muted-foreground">Gap day</span>
        : <span className="text-muted-foreground/60">—</span>
    }
    const primary = (CALENDAR_PLATFORMS as readonly string[]).includes(plan.platform ?? '') ? plan.platform! : 'tiktok'
    if (column === primary) {
      return (
        <span className={plan.is_featured ? 'font-semibold text-foreground' : 'text-foreground'}>
          {plan.content_theme}
          {plan.platform && plan.platform !== primary && (
            <span className="ml-1 text-[10px] text-muted-foreground">({platformLabel(plan.platform)})</span>
          )}
        </span>
      )
    }
    if (plan.cross_post_platforms?.includes(column)) {
      return <span className="text-muted-foreground">Same as {platformLabel(primary)}</span>
    }
    return <span className="text-muted-foreground/60">—</span>
  }

  const renderStatusButton = (plan: WeeklyContentPlan) => {
    const icon =
      plan.status === 'ready' ? <CheckCircle size={14} className="text-[#22C55E]" />
      : plan.status === 'in_progress' ? <Clock size={14} className="text-warning" />
      : <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/40" />
    return (
      <button
        onClick={() => handleStatusCycle(plan)}
        title={`Status: ${plan.status.replace(/_/g, ' ')} (click to change)`}
        className="p-1 rounded hover:bg-muted"
      >
        {icon}
      </button>
    )
  }

  const todayKey = toDateKey(new Date())

  const renderWeek = (wStart: string, idx: number) => {
    const days = getWeekDates(wStart).map((d) => d.date)
    return (
      <div key={wStart}>
        <h3 className="text-base font-bold text-omnia-gold mb-2">
          Week {idx + 1} — {fmtShort(days[0])} to {fmtShort(days[6])}
        </h3>
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm border-collapse">
              <thead>
                <tr className="bg-foreground text-background text-xs">
                  <th className="px-3 py-2.5 text-left w-20 font-semibold">Date</th>
                  <th className="px-3 py-2.5 text-left w-20 font-semibold">Day</th>
                  {CALENDAR_PLATFORMS.map((p) => (
                    <th key={p} className={`px-3 py-2.5 font-semibold ${p === 'tiktok' ? 'text-left' : 'text-left w-40'}`}>
                      {platformLabel(p)}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-left w-32 font-semibold">Host</th>
                  <th className="px-3 py-2.5 w-24" />
                </tr>
              </thead>
              <tbody>
                {days.map((date) => {
                  const entries = plansByDate[date] ?? []
                  const isSunday = dayIndex(date) === 6
                  const isToday = date === todayKey
                  const hasGap = entries.some((e) => e.is_gap_day)

                  const dateCells = (rowSpan: number, featured: boolean) => (
                    <>
                      <td rowSpan={rowSpan} className={`px-3 py-2.5 align-top border-b border-border ${featured ? 'font-bold' : ''}`}>
                        <div className="flex items-center gap-1">
                          {fmtShort(date)}
                          {isToday && <span className="w-1.5 h-1.5 rounded-full bg-primary" title="Today" />}
                        </div>
                        {!hasGap && entries.length > 0 && (
                          <button
                            onClick={() => openNewEntry(date)}
                            title="Add another piece for this day"
                            className="mt-1 text-muted-foreground/60 hover:text-primary"
                          >
                            <Plus size={12} />
                          </button>
                        )}
                      </td>
                      <td rowSpan={rowSpan} className={`px-3 py-2.5 align-top border-b border-border ${featured ? 'font-bold' : ''}`}>
                        <span className="inline-flex items-center gap-1">
                          {fmtWeekday(date)}
                          {isSunday && <Star size={12} className="text-omnia-gold fill-omnia-gold" />}
                        </span>
                      </td>
                    </>
                  )

                  if (entries.length === 0) {
                    return (
                      <tr key={date} className="group">
                        {dateCells(1, false)}
                        <td colSpan={CALENDAR_PLATFORMS.length + 2} className="px-3 py-2 border-b border-border">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openNewEntry(date)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary px-2 py-1 rounded border border-dashed border-border hover:border-primary"
                            >
                              <Plus size={12} /> Add content
                            </button>
                            <button
                              onClick={() => handleMarkGapDay(date)}
                              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Mark as gap day
                            </button>
                          </div>
                        </td>
                        <td className="border-b border-border" />
                      </tr>
                    )
                  }

                  return entries.map((plan, i) => (
                    <tr
                      key={plan.id}
                      className={plan.is_featured ? 'bg-omnia-gold/15' : 'hover:bg-muted/40'}
                    >
                      {i === 0 && dateCells(entries.length, entries.some((e) => e.is_featured))}
                      {CALENDAR_PLATFORMS.map((p) => (
                        <td key={p} className="px-3 py-2.5 border-b border-border border-l align-top">
                          {renderPlatformCell(plan, p)}
                        </td>
                      ))}
                      <td className={`px-3 py-2.5 border-b border-border border-l align-top ${plan.is_featured ? 'font-bold text-omnia-gold-dark' : 'text-foreground'}`}>
                        {plan.is_gap_day ? <span className="text-muted-foreground/60">—</span> : plan.host || <span className="text-muted-foreground/60">—</span>}
                      </td>
                      <td className="px-2 py-2 border-b border-border align-top">
                        <div className="flex items-center justify-end gap-0.5">
                          {!plan.is_gap_day && renderStatusButton(plan)}
                          {!plan.is_gap_day && (
                            <button onClick={() => openEditEntry(plan)} title="Edit" className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted">
                              <Pencil size={13} />
                            </button>
                          )}
                          <button onClick={() => handleDeleteEntry(plan)} title="Delete" className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const noteLines = notes.split('\n').map((l) => l.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean)
  const editingEntryForm = entryModal?.form

  const importSummary = importPreview && (() => {
    const { entries, backlog: importedBacklog } = importPreview.calendar
    const knownTitles = new Set(backlog.map((b) => b.title.trim().toLowerCase()))
    const newBacklog = importedBacklog.filter((b) => !knownTitles.has(b.title.trim().toLowerCase())).length
    const content = entries.filter((e) => !e.is_gap_day)
    return {
      first: entries[0]?.date,
      last: entries[entries.length - 1]?.date,
      contentCount: content.length,
      gapCount: entries.length - content.length,
      recordedCount: content.filter((e) => e.recording === 'recorded').length,
      newBacklog,
      skippedBacklog: importedBacklog.length - newBacklog,
    }
  })()

  return (
    <div className="space-y-8" {...dropHandlers}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Calendar</h1>
          <p className="text-sm font-semibold text-omnia-gold mt-1">
            {fmtLong(weeks[0])} – {fmtLong(cycleEnd, true)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            2-week plan · {CALENDAR_PLATFORMS.map(platformLabel).join(' · ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) handleImportFile(file)
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!!readingFile}
            title="Or drag a PDF anywhere onto this page"
            className="px-3 py-2 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
          >
            <Upload size={14} /> Import PDF
          </button>
          <button
            onClick={() => setRemoveAll({ includeBacklog: false })}
            disabled={plans.length === 0 && !notes && backlog.length === 0}
            title="Remove everything in these two weeks"
            className="px-3 py-2 text-xs font-medium border border-destructive/40 text-destructive hover:bg-destructive/10 rounded-lg flex items-center gap-1.5 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Trash2 size={14} /> Remove all
          </button>
          <button
            onClick={() => setWeekStart(getWeekStartDate(new Date()))}
            className="px-3 py-2 text-xs font-medium border border-border bg-card hover:bg-muted text-foreground rounded-lg"
          >
            This week
          </button>
          <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-2">
            <button onClick={() => setWeekStart(addDays(weekStart, -7))} title="Previous week" className="p-1 text-muted-foreground hover:bg-background rounded">
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2 font-medium text-foreground text-sm">
              <CalendarIcon size={16} className="text-primary" />
              {fmtShort(weeks[0])} – {fmtShort(cycleEnd)}
            </div>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} title="Next week" className="p-1 text-muted-foreground hover:bg-background rounded">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {setupMissing && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-sm">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-foreground">
            <span className="font-semibold">Database update needed:</span> run{' '}
            <code className="px-1 rounded bg-muted text-xs">weekly-planner-calendar-migration.sql</code> in the
            Supabase SQL editor to enable hosts, gap days, recording schedule, notes and leftover contents.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={48} /></div>
      ) : (
        <>
          {/* 2-Week Content Calendar */}
          <section className="space-y-6">
            {weeks.map(renderWeek)}
            <p className="text-xs italic text-muted-foreground">
              <Star size={11} className="inline text-omnia-gold fill-omnia-gold -mt-0.5" /> = Sunday premium slot
              {' · '}Gold-highlighted rows = featured content{' · '}Saturday = gap day
            </p>
          </section>

          {/* Notes */}
          <section>
            <div className="flex items-center justify-between border-b-2 border-omnia-gold pb-1.5 mb-3">
              <h2 className="text-lg font-bold text-foreground">Notes</h2>
              {notesDraft === null ? (
                <button onClick={() => setNotesDraft(notes)} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                  <Pencil size={12} /> Edit
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => setNotesDraft(null)} className="text-xs text-muted-foreground">Cancel</button>
                  <button onClick={handleSaveNotes} disabled={isSaving} className="text-xs font-medium px-3 py-1 rounded-md bg-primary text-primary-foreground disabled:opacity-50">
                    Save notes
                  </button>
                </div>
              )}
            </div>
            {notesDraft !== null ? (
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={5}
                autoFocus
                placeholder={'One note per line, e.g.\nOnly one staff-type video is recorded per day.\nProduct promos stay soft-sell until prices are confirmed.'}
                className={`${inputCls} resize-y`}
              />
            ) : noteLines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes for this cycle yet.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                {noteLines.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            )}
          </section>

          {/* Recording Schedule */}
          <section>
            <div className="border-b-2 border-omnia-gold pb-1.5 mb-2">
              <h2 className="text-lg font-bold text-foreground">Recording Schedule</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Recording never happens on the same day as airing. Gold rows are already recorded.
            </p>
            {recordingRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add content to the calendar to build the recording schedule.</p>
            ) : (
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm border-collapse">
                  <thead>
                    <tr className="bg-foreground text-background text-xs">
                      <th className="px-3 py-2.5 font-semibold w-48">Recording Day</th>
                      <th className="px-3 py-2.5 font-semibold text-left">Content Piece</th>
                      <th className="px-3 py-2.5 font-semibold w-36">Airs On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recordingRows.map(({ plan, airDate }) => {
                      const rec = plan.recording_date
                      const clash = !plan.is_recorded && rec && rec >= airDate
                      return (
                        <tr
                          key={plan.id}
                          onClick={() => openEditEntry(plan)}
                          className="cursor-pointer hover:bg-muted/40"
                        >
                          <td className={`px-3 py-2 text-center border-b border-border ${plan.is_recorded ? 'bg-omnia-gold/15' : ''}`}>
                            {plan.is_recorded ? (
                              'Already recorded'
                            ) : rec ? (
                              <span className="inline-flex items-center gap-1">
                                {fmtDayDate(rec)}
                                {clash && (
                                  <span title={rec === airDate ? 'Records on the same day it airs' : 'Records after the air date'}>
                                    <AlertTriangle size={13} className="text-destructive" />
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="italic text-muted-foreground">Not scheduled</span>
                            )}
                          </td>
                          <td className="px-3 py-2 border-b border-l border-border text-foreground">{plan.content_theme}</td>
                          <td className="px-3 py-2 border-b border-l border-border text-center text-foreground">{fmtDayDate(airDate)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Leftover Contents */}
          <section className="space-y-5">
            <div>
              <div className="border-b-2 border-omnia-gold pb-1.5 mb-2">
                <h2 className="text-lg font-bold text-foreground">Leftover Contents</h2>
              </div>
              <p className="text-sm text-muted-foreground">Everything not used in this cycle, so nothing gets lost.</p>
            </div>

            {BACKLOG_SECTIONS.map((section) => {
              const items = backlog.filter((b) => b.category === section.key)
              return (
                <div key={section.key}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-omnia-gold">{section.label}</h3>
                    <button
                      onClick={() => setBacklogModal({ editingId: null, form: { title: '', category: section.key, host: '', status: '' } })}
                      disabled={setupMissing}
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-1 disabled:opacity-40 disabled:no-underline"
                    >
                      <Plus size={12} /> Add item
                    </button>
                  </div>
                  <div className="bg-card rounded-xl border border-border shadow-sm overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm border-collapse">
                      <thead>
                        <tr className="bg-foreground text-background text-xs">
                          <th className="px-3 py-2 font-semibold text-left">Content Piece</th>
                          <th className="px-3 py-2 font-semibold text-left w-32">Host</th>
                          <th className="px-3 py-2 font-semibold w-64">Status</th>
                          <th className="px-3 py-2 w-28" />
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-3 text-xs text-muted-foreground">Nothing here yet.</td>
                          </tr>
                        ) : items.map((item) => (
                          <tr key={item.id} className="hover:bg-muted/40">
                            <td className="px-3 py-2 border-b border-border text-foreground">{item.title}</td>
                            <td className="px-3 py-2 border-b border-l border-border text-foreground">{item.host || <span className="text-muted-foreground/60">—</span>}</td>
                            <td className="px-3 py-2 border-b border-l border-border text-center text-foreground">{item.status || <span className="text-muted-foreground/60">—</span>}</td>
                            <td className="px-2 py-2 border-b border-border">
                              <div className="flex items-center justify-end gap-0.5">
                                <button onClick={() => scheduleBacklogItem(item)} title="Schedule in calendar" className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted">
                                  <CalendarPlus size={13} />
                                </button>
                                <button
                                  onClick={() => setBacklogModal({
                                    editingId: item.id,
                                    form: { title: item.title, category: item.category, host: item.host ?? '', status: item.status ?? '' },
                                  })}
                                  title="Edit"
                                  className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button onClick={() => handleDeleteBacklog(item)} title="Delete" className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </section>
        </>
      )}

      <datalist id="planner-hosts">
        {knownHosts.map((h) => <option key={h} value={h} />)}
      </datalist>

      {/* Calendar Entry Modal */}
      {entryModal && editingEntryForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {entryModal.editingId ? 'Edit Content' : 'Plan Content'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {fmtLong(editingEntryForm.date, true)}
                  {dayIndex(editingEntryForm.date) === 6 && ' · ★ Sunday premium slot'}
                </p>
              </div>
              <button onClick={() => setEntryModal(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {entryModal.backlogId && (
                <p className="text-xs p-2.5 rounded-lg bg-omnia-gold/10 text-foreground">
                  This item will be removed from Leftover Contents once it's scheduled.
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Air date</label>
                  <select value={editingEntryForm.date} onChange={(e) => updateEntryForm({ date: e.target.value })} className={inputCls}>
                    {(cycleDays.includes(editingEntryForm.date) ? cycleDays : [editingEntryForm.date, ...cycleDays]).map((d) => (
                      <option key={d} value={d}>{fmtDayDate(d)}{dayIndex(d) === 6 ? ' ★' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Host</label>
                  <input
                    list="planner-hosts"
                    value={editingEntryForm.host}
                    onChange={(e) => updateEntryForm({ host: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. Alamin, Blen + Staff"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Content</label>
                <textarea
                  value={editingEntryForm.content_theme}
                  onChange={(e) => updateEntryForm({ content_theme: e.target.value })}
                  rows={2}
                  className={`${inputCls} resize-none`}
                  placeholder="e.g. Alamin: Thailand visa update"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Main platform</label>
                  <select
                    value={editingEntryForm.platform}
                    onChange={(e) => updateEntryForm({
                      platform: e.target.value,
                      cross_post_platforms: editingEntryForm.cross_post_platforms.filter((p) => p !== e.target.value),
                    })}
                    className={inputCls}
                  >
                    {CALENDAR_PLATFORMS.map((p) => <option key={p} value={p}>{platformLabel(p)}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Also post on</label>
                  <div className="flex flex-col gap-1.5 pt-1">
                    {CALENDAR_PLATFORMS.filter((p) => p !== editingEntryForm.platform).map((p) => (
                      <label key={p} className="flex items-center gap-2 text-sm text-foreground">
                        <input
                          type="checkbox"
                          checked={editingEntryForm.cross_post_platforms.includes(p)}
                          onChange={(e) => updateEntryForm({
                            cross_post_platforms: e.target.checked
                              ? [...editingEntryForm.cross_post_platforms, p]
                              : editingEntryForm.cross_post_platforms.filter((x) => x !== p),
                          })}
                        />
                        {platformLabel(p)} <span className="text-xs text-muted-foreground">(same content)</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={editingEntryForm.is_featured}
                  onChange={(e) => updateEntryForm({ is_featured: e.target.checked })}
                />
                Featured content <span className="text-xs text-muted-foreground">(gold-highlighted row)</span>
              </label>

              <div>
                <label className={labelCls}>Recording</label>
                <div className="flex flex-wrap items-center gap-4 text-sm text-foreground">
                  {([
                    ['recorded', 'Already recorded'],
                    ['scheduled', 'Record on…'],
                    ['none', 'Not scheduled'],
                  ] as const).map(([value, label]) => (
                    <label key={value} className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="recording"
                        checked={editingEntryForm.recording === value}
                        onChange={() => updateEntryForm({ recording: value })}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {editingEntryForm.recording === 'scheduled' && (
                  <div className="mt-2">
                    <input
                      type="date"
                      value={editingEntryForm.recording_date}
                      onChange={(e) => updateEntryForm({ recording_date: e.target.value })}
                      className={inputCls}
                    />
                    {editingEntryForm.recording_date && editingEntryForm.recording_date >= editingEntryForm.date && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        {editingEntryForm.recording_date === editingEntryForm.date
                          ? 'This records on the same day it airs.'
                          : 'This records after the air date.'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Post type</label>
                  <select value={editingEntryForm.post_type} onChange={(e) => updateEntryForm({ post_type: e.target.value })} className={inputCls}>
                    {POST_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Campaign</label>
                  <select value={editingEntryForm.campaign_id} onChange={(e) => updateEntryForm({ campaign_id: e.target.value })} className={inputCls}>
                    <option value="">None</option>
                    {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Notes (optional)</label>
                <input
                  type="text"
                  value={editingEntryForm.notes}
                  onChange={(e) => updateEntryForm({ notes: e.target.value })}
                  className={inputCls}
                  placeholder='e.g. Soft-sell, no price — "call or DM to order"'
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-border">
              <button onClick={() => setEntryModal(null)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
              <button
                onClick={handleSaveEntry}
                disabled={isSaving}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : entryModal.editingId ? 'Save Changes' : 'Add to Calendar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leftover Content Modal */}
      {backlogModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                {backlogModal.editingId ? 'Edit Leftover Content' : 'Add Leftover Content'}
              </h3>
              <button onClick={() => setBacklogModal(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Content piece</label>
                <input
                  type="text"
                  value={backlogModal.form.title}
                  onChange={(e) => setBacklogModal({ ...backlogModal, form: { ...backlogModal.form, title: e.target.value } })}
                  className={inputCls}
                  placeholder="e.g. Miami breakfast interview"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Section</label>
                  <select
                    value={backlogModal.form.category}
                    onChange={(e) => setBacklogModal({ ...backlogModal, form: { ...backlogModal.form, category: e.target.value as ContentBacklogCategory } })}
                    className={inputCls}
                  >
                    {BACKLOG_SECTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Host</label>
                  <input
                    list="planner-hosts"
                    value={backlogModal.form.host}
                    onChange={(e) => setBacklogModal({ ...backlogModal, form: { ...backlogModal.form, host: e.target.value } })}
                    className={inputCls}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <input
                  type="text"
                  value={backlogModal.form.status}
                  onChange={(e) => setBacklogModal({ ...backlogModal, form: { ...backlogModal.form, status: e.target.value } })}
                  className={inputCls}
                  placeholder={`e.g. ${BACKLOG_SECTIONS.find((s) => s.key === backlogModal.form.category)?.statusHint}`}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-border">
              <button onClick={() => setBacklogModal(null)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
              <button
                onClick={handleSaveBacklog}
                disabled={isSaving}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove All confirmation */}
      {removeAll && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle size={18} className="text-destructive" /> Remove all
              </h3>
              <button onClick={() => setRemoveAll(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm text-foreground">
              <p>
                This permanently deletes everything planned for{' '}
                <span className="font-semibold">{fmtLong(weeks[0])} – {fmtLong(cycleEnd, true)}</span>:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-0.5">
                <li>{plans.length} calendar {plans.length === 1 ? 'entry' : 'entries'} (including the recording schedule)</li>
                {notes && <li>The notes for this cycle</li>}
              </ul>
              {backlog.length > 0 && (
                <label className="flex items-start gap-2 p-3 rounded-lg bg-muted">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={removeAll.includeBacklog}
                    onChange={(e) => setRemoveAll({ includeBacklog: e.target.checked })}
                  />
                  <span>
                    Also delete all {backlog.length} leftover content items
                    <span className="block text-xs text-muted-foreground">These are shared across all weeks, not just this cycle.</span>
                  </span>
                </label>
              )}
              <p className="text-xs text-muted-foreground">This can't be undone.</p>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-border">
              <button onClick={() => setRemoveAll(null)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
              <button
                onClick={handleRemoveAll}
                disabled={isSaving}
                className="px-4 py-2 bg-destructive text-white text-sm font-medium rounded-lg hover:bg-destructive/90 disabled:opacity-50"
              >
                {isSaving ? 'Removing…' : 'Remove all'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag-and-drop overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="border-2 border-dashed border-primary rounded-2xl bg-card px-10 py-8 text-center shadow-xl max-w-md pointer-events-none">
            <Upload size={32} className="mx-auto text-primary mb-3" />
            <p className="font-semibold text-foreground">Drop the content calendar PDF</p>
            <p className="text-xs text-muted-foreground mt-1">
              The calendar, notes, recording schedule and leftover contents will be read for you to review before saving.
            </p>
          </div>
        </div>
      )}

      {/* Reading PDF */}
      {readingFile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl px-8 py-6 text-center max-w-sm">
            <Loader2 className="animate-spin text-primary mx-auto mb-3" size={32} />
            <p className="font-semibold text-foreground break-all">Reading {readingFile}…</p>
            <p className="text-xs text-muted-foreground mt-1">This usually takes 10–30 seconds.</p>
          </div>
        </div>
      )}

      {/* Import Preview */}
      {importPreview && importSummary && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Import Content Calendar</h3>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  <FileText size={12} /> {importPreview.fileName}
                  {importSummary.first && importSummary.last && (
                    <> · {fmtLong(importSummary.first)} – {fmtLong(importSummary.last, true)}</>
                  )}
                </p>
              </div>
              <button onClick={() => setImportPreview(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  `${importSummary.contentCount} content days`,
                  `${importSummary.gapCount} gap days`,
                  `${importSummary.recordedCount} already recorded`,
                  `${importPreview.calendar.notes.length} notes`,
                  `${importSummary.newBacklog} leftover items`,
                ].map((label) => (
                  <span key={label} className="px-2.5 py-1 rounded-full bg-muted text-foreground font-medium">{label}</span>
                ))}
                {importSummary.skippedBacklog > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                    {importSummary.skippedBacklog} leftover already listed — skipped
                  </span>
                )}
              </div>

              <div className="rounded-lg border border-border overflow-x-auto">
                <table className="w-full min-w-[640px] text-xs border-collapse">
                  <thead>
                    <tr className="bg-foreground text-background">
                      <th className="px-2.5 py-2 text-left font-semibold w-24">Date</th>
                      <th className="px-2.5 py-2 text-left font-semibold">Content</th>
                      <th className="px-2.5 py-2 text-left font-semibold w-36">Also on</th>
                      <th className="px-2.5 py-2 text-left font-semibold w-24">Host</th>
                      <th className="px-2.5 py-2 text-left font-semibold w-28">Recording</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.calendar.entries.map((e, i) => (
                      <tr key={i} className={e.is_featured ? 'bg-omnia-gold/15' : ''}>
                        <td className="px-2.5 py-1.5 border-b border-border whitespace-nowrap">
                          {fmtDayDate(e.date)}
                          {dayIndex(e.date) === 6 && <Star size={10} className="inline ml-1 text-omnia-gold fill-omnia-gold -mt-0.5" />}
                        </td>
                        <td className={`px-2.5 py-1.5 border-b border-border ${e.is_gap_day ? 'italic text-muted-foreground' : 'text-foreground'} ${e.is_featured ? 'font-semibold' : ''}`}>
                          {e.content}
                          {!e.is_gap_day && e.platform !== 'tiktok' && (
                            <span className="ml-1 text-muted-foreground">({platformLabel(e.platform)})</span>
                          )}
                        </td>
                        <td className="px-2.5 py-1.5 border-b border-border text-muted-foreground">
                          {e.cross_post_platforms.length ? e.cross_post_platforms.map(platformLabel).join(', ') : '—'}
                        </td>
                        <td className="px-2.5 py-1.5 border-b border-border text-foreground">{e.host || '—'}</td>
                        <td className="px-2.5 py-1.5 border-b border-border text-muted-foreground">
                          {e.is_gap_day ? '—'
                            : e.recording === 'recorded' ? 'Already recorded'
                            : e.recording === 'scheduled' && e.recording_date ? fmtDayDate(e.recording_date)
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {importPreview.existingIds.length > 0 && (
                <label className="flex items-start gap-2 text-sm text-foreground p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={importPreview.replace}
                    onChange={(e) => setImportPreview({ ...importPreview, replace: e.target.checked })}
                  />
                  <span>
                    Replace the {importPreview.existingIds.length} existing{' '}
                    {importPreview.existingIds.length === 1 ? 'entry' : 'entries'} in these weeks
                    <span className="block text-xs text-muted-foreground">
                      Unticked, the imported days are added alongside what's already planned.
                    </span>
                  </span>
                </label>
              )}

              <p className="text-xs text-muted-foreground">
                Check the rows above. You can still edit anything in the planner after importing.
              </p>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-border">
              <button onClick={() => setImportPreview(null)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
              <button
                onClick={handleApplyImport}
                disabled={isSaving}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? 'Importing…' : 'Import to Calendar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
