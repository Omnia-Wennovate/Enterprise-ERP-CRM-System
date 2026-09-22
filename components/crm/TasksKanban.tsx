'use client'

import { useState, useEffect } from 'react'
import { GripVertical, Plus, MoreVertical, Flag } from 'lucide-react'
import type { Task, TaskStatus, TaskPriority } from '@/types'
import { storage } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { CreatorLabel } from '@/components/ui/CreatorLabel'
import { ModalShell } from '@/components/ui/ModalShell'
import { useProfile } from '@/lib/context/profile-context'
import { createClient } from '@/lib/supabase/client'

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  to_do: { label: 'To Do', color: 'text-foreground', bgColor: 'bg-muted' },
  in_progress: { label: 'In Progress', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  completed: { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-omnia-gold' },
  medium: { label: 'Medium', color: 'text-yellow-600' },
  high: { label: 'High', color: 'text-orange-600' },
  urgent: { label: 'Urgent', color: 'text-red-600' },
}

const STATUSES: TaskStatus[] = ['to_do', 'in_progress', 'completed', 'cancelled']

/** UUID v4 pattern — used to distinguish real UUIDs from demo placeholder strings */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const EMPTY_FORM = {
  title: '',
  description: '',
  status: 'to_do' as TaskStatus,
  priority: 'medium' as TaskPriority,
  due_date: new Date().toISOString().split('T')[0],
}

interface TasksKanbanProps {
  /** Called by parent to open the "New Task" dialog (e.g. from a header button) */
  onRequestOpen?: (open: () => void) => void
}

export function TasksKanban({ onRequestOpen }: TasksKanbanProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  /** Map of profile UUID → resolved full_name for creator display */
  const [creatorsMap, setCreatorsMap] = useState<Record<string, string>>({})

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('to_do')
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const profile = useProfile()

  // Expose the open function to the parent via callback
  useEffect(() => {
    if (onRequestOpen) {
      onRequestOpen(() => {
        setDefaultStatus('to_do')
        setForm(EMPTY_FORM)
        setIsDialogOpen(true)
      })
    }
  }, [onRequestOpen])

  // Load tasks once on mount
  useEffect(() => {
    const loaded = storage.getTasks()
    setTasks(loaded)
    setIsLoading(false)
  }, [])

  // Re-resolve creator names whenever tasks or profile changes
  useEffect(() => {
    if (!tasks.length) return

    // Always seed with the current user so their own tasks show immediately
    const seedMap: Record<string, string> = {}
    if (profile?.id && profile?.full_name) {
      seedMap[profile.id] = profile.full_name
    }

    // Resolve creator names for any UUID-format created_by values
    const creatorIds = [
      ...new Set(
        tasks
          .map((t) => t.created_by)
          .filter((id): id is string => !!id && UUID_REGEX.test(id))
      ),
    ]

    // IDs still needing a Supabase lookup (any UUID not covered by seedMap)
    const unknownIds = creatorIds.filter((id) => !seedMap[id])

    if (unknownIds.length === 0) {
      setCreatorsMap(seedMap)
      return
    }

    // Single batch lookup for remaining UUIDs
    const fetchCreators = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase.from('profiles').select('id, full_name').in('id', unknownIds)
        
        const fetched: Record<string, string> = {}
        if (data) {
          for (const row of data) {
            if (row.id && row.full_name) fetched[row.id] = row.full_name
          }
        }
        setCreatorsMap({ ...seedMap, ...fetched })
      } catch (err) {
        // Non-fatal — creator labels simply won't show if lookup fails
        setCreatorsMap(seedMap)
      }
    }
    
    fetchCreators()
  }, [tasks, profile])

  /**
   * Resolves a creator name for display.
   * Returns null for legacy demo strings (e.g. 'user_001') — no label shown.
   */
  const resolveCreatorName = (createdBy: string | null | undefined): string | null => {
    if (!createdBy) return null
    // If not a UUID, it's a legacy demo placeholder — do not display
    if (!UUID_REGEX.test(createdBy)) return null
    return creatorsMap[createdBy] || null
  }

  const openDialog = (status: TaskStatus) => {
    setDefaultStatus(status)
    setForm({ ...EMPTY_FORM, status })
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    if (!form.title.trim()) return
    setSaving(true)

    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      due_date: form.due_date,
      assigned_to: profile?.id ?? 'user_001',
      assigned_to_name: profile?.full_name ?? 'Me',
      completed_at: form.status === 'completed' ? new Date().toISOString() : null,
      related_to: null,
      related_to_type: null,
      created_at: new Date().toISOString(),
      created_by: profile?.id ?? 'user_001',
      is_reminder_set: false,
    }

    const updated = [...tasks, newTask]
    setTasks(updated)
    storage.setTasks(updated)
    setIsDialogOpen(false)
    setForm(EMPTY_FORM)
    setSaving(false)
  }

  const tasksByStatus = STATUSES.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((task) => task.status === status)
      return acc
    },
    {} as Record<TaskStatus, Task[]>,
  )

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('taskId', task.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    const task = tasks.find((t) => t.id === taskId)
    if (task && task.status !== status) {
      const updated = tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status,
              completed_at: status === 'completed' ? new Date().toISOString() : null,
            }
          : t,
      )
      setTasks(updated)
      storage.setTasks(updated)
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date().toDateString() !== new Date(dueDate).toDateString()
  }

  if (isLoading) return <div className="p-4">Loading tasks...</div>

  return (
    <>
      <div className="overflow-x-auto">
        <div className="flex gap-6 p-4 min-w-max">
          {STATUSES.map((status) => (
            <div key={status} className="flex flex-col w-80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold text-sm ${STATUS_CONFIG[status].color}`}>
                    {STATUS_CONFIG[status].label}
                  </h3>
                  <span className="bg-gray-200 text-foreground text-xs px-2 py-0.5 rounded-full">
                    {tasksByStatus[status].length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => openDialog(status)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div
                className="flex-1 space-y-3 bg-muted rounded-lg p-3 min-h-96"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                {tasksByStatus[status].map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className={`p-3 rounded-lg border cursor-move transition-all hover:shadow-md ${
                      isOverdue(task.due_date) && task.status !== 'completed'
                        ? 'border-red-300 bg-red-50 hover:border-red-400'
                        : 'border-border bg-card hover:border-omnia-gold/40'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground truncate">{task.title}</h4>
                        {task.description && (
                          <p className="text-xs text-muted-foreground truncate mt-1">{task.description}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <Flag className={`w-3 h-3 ${PRIORITY_CONFIG[task.priority].color}`} />
                          <span className={`text-xs font-medium ${PRIORITY_CONFIG[task.priority].color}`}>
                            {PRIORITY_CONFIG[task.priority].label}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            isOverdue(task.due_date) && task.status !== 'completed'
                              ? 'bg-red-100 text-red-700'
                              : STATUS_CONFIG[status].bgColor + ' ' + STATUS_CONFIG[status].color
                          }`}
                        >
                          {new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      {task.is_reminder_set && (
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          🔔 Reminder set
                        </div>
                      )}

                      <CreatorLabel creatorName={resolveCreatorName(task.created_by)} />
                    </div>
                  </div>
                ))}

                {tasksByStatus[status].length === 0 && (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <p className="text-sm">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Task Dialog */}
      <ModalShell
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="New Task"
        subtitle="Add a new task to your board"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-omnia-gold hover:bg-omnia-gold-dark"
              onClick={handleCreate}
              disabled={!form.title.trim() || saving}
            >
              {saving ? 'Creating...' : 'Create Task'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold/50"
              placeholder="Enter task title..."
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold/50 resize-none"
              placeholder="Optional description..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Status</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold/50"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold/50"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
              >
                {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_CONFIG[p].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Due Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold/50"
              value={form.due_date}
              onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
            />
          </div>
        </div>
      </ModalShell>
    </>
  )
}
