'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle2, Circle, AlertCircle, Plus, Filter, Clock, Flag, Loader2, X, Users
} from 'lucide-react'
import {
  getTasksForUser, createTaskAction, updateTaskStatusAction,
  getEmployeesForSearch, type TaskWithMeta, type EmployeeOption
} from '../actions'
import { cn } from '@/lib/utils'

// ─── Priority Badge ────────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', map[priority] || map.medium)}>
      {priority}
    </span>
  )
}

// ─── Status Icon ──────────────────────────────────────────────────────────────
function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-green-500" />
  if (status === 'in_progress') return <AlertCircle className="w-5 h-5 text-amber-500" />
  if (status === 'cancelled') return <X className="w-5 h-5 text-slate-400" />
  return <Circle className="w-5 h-5 text-muted-foreground" />
}

// ─── Task Create Dialog ────────────────────────────────────────────────────────
function CreateTaskDialog({
  profileId,
  profileName,
  onCreated,
  onClose,
  prefillBookingId,
  prefillCustomerId,
}: {
  profileId: string
  profileName: string
  onCreated: () => void
  onClose: () => void
  prefillBookingId?: string
  prefillCustomerId?: string
}) {
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
    bookingId: prefillBookingId || '',
    customerId: prefillCustomerId || '',
  })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    getEmployeesForSearch().then(setEmployees).catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    setErr(null)
    try {
      await createTaskAction({
        title: form.title,
        description: form.description || undefined,
        assignedTo: form.assignedTo || undefined,
        assignedBy: profileId,
        assignedByName: profileName,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        bookingId: form.bookingId || undefined,
        customerId: form.customerId || undefined,
      })
      onCreated()
      onClose()
    } catch (e: any) {
      setErr(e.message || 'Failed to create task.')
    } finally {
      setLoading(false)
    }
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">New Task</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Create and assign a task to a team member</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Title *</label>
            <input
              value={form.title} onChange={(e) => set('title', e.target.value)}
              placeholder="Task title…"
              className="w-full px-3.5 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
            <textarea
              value={form.description} onChange={(e) => set('description', e.target.value)}
              placeholder="Describe the task…" rows={2}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 text-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Assign To</label>
              <select
                value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 text-sm bg-white"
              >
                <option value="">Unassigned</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Priority</label>
              <select
                value={form.priority} onChange={(e) => set('priority', e.target.value)}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 text-sm bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Due Date</label>
            <input
              type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-omnia-gold/40 text-sm"
            />
          </div>
          {(form.bookingId || form.customerId) && (
            <div className="flex items-center gap-2 bg-omnia-gold/8 border border-omnia-gold/20 rounded-xl px-4 py-2.5">
              <Flag className="w-4 h-4 text-omnia-gold" />
              <p className="text-xs text-foreground">
                {form.bookingId && <span>Linked to booking <strong>{form.bookingId}</strong></span>}
                {form.customerId && <span>Linked to customer record</span>}
              </p>
            </div>
          )}
          {err && <p className="text-sm text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{err}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !form.title.trim()} className="flex-1 px-4 py-2.5 bg-omnia-gold text-primary-foreground rounded-xl text-sm font-medium hover:bg-omnia-gold-dark transition-colors disabled:opacity-50">
              {loading ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Task Row ──────────────────────────────────────────────────────────────────
function TaskRow({ task, profileId, onUpdate }: { task: TaskWithMeta; profileId: string; onUpdate: () => void }) {
  const [updating, setUpdating] = useState(false)

  const nextStatus: Record<string, 'pending' | 'in_progress' | 'completed' | 'cancelled'> = {
    pending: 'in_progress',
    in_progress: 'completed',
    completed: 'pending',
    cancelled: 'pending',
  }

  const cycleStatus = async () => {
    if (updating) return
    setUpdating(true)
    try {
      await updateTaskStatusAction(task.id, nextStatus[task.status] || 'pending')
      onUpdate()
    } finally {
      setUpdating(false)
    }
  }

  return (
    <tr className={cn('hover:bg-muted/30 transition-colors', task.isOverdue && task.status !== 'completed' && 'bg-red-50/50')}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <button onClick={cycleStatus} disabled={updating} className="flex-shrink-0 hover:opacity-70 transition-opacity">
            {updating ? <Loader2 className="w-5 h-5 animate-spin text-omnia-gold" /> : <StatusIcon status={task.status} />}
          </button>
          <div>
            <p className={cn('font-medium text-foreground text-sm', task.status === 'completed' && 'line-through text-muted-foreground')}>
              {task.title}
            </p>
            {task.description && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{task.description}</p>}
            {(task.booking_id || task.customer_id) && (
              <p className="text-xs text-omnia-gold mt-0.5">
                {task.booking_id ? `📋 ${task.booking_id}` : '👤 Customer'}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <p className="text-sm text-muted-foreground">{task.assignedByName || '—'}</p>
      </td>
      <td className="px-5 py-3.5"><PriorityBadge priority={task.priority} /></td>
      <td className="px-5 py-3.5">
        {task.due_date ? (
          <div className={cn('flex items-center gap-1.5 text-sm', task.isOverdue && task.status !== 'completed' ? 'text-red-600 font-semibold' : task.isDueToday ? 'text-amber-600 font-semibold' : 'text-muted-foreground')}>
            <Clock className="w-3.5 h-3.5" />
            {task.isDueToday ? 'Today' : task.isOverdue ? `Overdue · ${task.due_date}` : task.due_date}
          </div>
        ) : <span className="text-sm text-muted-foreground">—</span>}
      </td>
      <td className="px-5 py-3.5">
        <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium capitalize',
          task.status === 'completed' ? 'bg-green-100 text-green-700' :
          task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
          task.status === 'cancelled' ? 'bg-slate-100 text-slate-500' :
          'bg-amber-100 text-amber-700'
        )}>
          {task.status.replace('_', ' ')}
        </span>
      </td>
    </tr>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [profileName, setProfileName] = useState<string>('')
  const [role, setRole] = useState('employee')
  const [department, setDepartment] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'overdue'>('all')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        const user = JSON.parse(stored)
        setProfileId(user.id || null)
        setRole(user.role || 'employee')
        setDepartment(user.department || null)
        const name = user.full_name || user.name || (
          user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : ''
        )
        setProfileName(name)
      }
    } catch {
      setError('Unable to load user profile.')
      setLoading(false)
    }
  }, [])

  const loadTasks = () => {
    if (!profileId) return
    setLoading(true)
    getTasksForUser(profileId, department, role)
      .then(setTasks)
      .catch(() => setError('Failed to load tasks.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadTasks() }, [profileId, department, role])

  const filtered = tasks.filter((t) => {
    if (filter === 'all') return true
    if (filter === 'overdue') return t.isOverdue && t.status !== 'completed'
    return t.status === filter
  })

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    overdue: tasks.filter((t) => t.isOverdue && t.status !== 'completed').length,
  }

  const tabs: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'completed', label: 'Completed' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
            <p className="text-muted-foreground mt-1">Tasks assigned to you and your team</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-omnia-gold text-primary-foreground rounded-xl hover:bg-omnia-gold-dark font-medium text-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                filter === tab.key
                  ? 'border-omnia-gold text-omnia-gold-dark'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className={cn(
                  'ml-2 px-1.5 py-0.5 rounded-full text-xs',
                  filter === tab.key ? 'bg-omnia-gold/10 text-omnia-gold-dark' : 'bg-muted text-muted-foreground'
                )}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border animate-pulse">
                <div className="w-5 h-5 rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
                <div className="h-6 bg-muted rounded w-16" />
                <div className="h-4 bg-muted rounded w-20" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              {filter === 'completed' ? 'No completed tasks yet' :
               filter === 'overdue' ? 'No overdue tasks 🎉' :
               'No tasks here'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {filter === 'all' ? 'Create your first task to get started.' : `No ${filter.replace('_', ' ')} tasks right now.`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 px-5 py-2.5 bg-omnia-gold text-primary-foreground rounded-xl hover:bg-omnia-gold-dark font-medium text-sm"
              >
                Create Task
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {!loading && !error && filtered.length > 0 && (
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned By</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((task) => (
                    <TaskRow key={task.id} task={task} profileId={profileId!} onUpdate={loadTasks} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showCreate && profileId && (
        <CreateTaskDialog
          profileId={profileId}
          profileName={profileName}
          onCreated={loadTasks}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
