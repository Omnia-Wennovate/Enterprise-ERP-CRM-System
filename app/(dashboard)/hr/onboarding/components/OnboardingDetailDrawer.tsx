'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle2, Circle, AlertTriangle, Clock, Shield, User,
  Calendar, ChevronDown, ChevronUp, Play, Pause, Ban, MessageSquare
} from 'lucide-react'
import type { OnboardingWithDetails, OnboardingTask, OnboardingTaskStatus } from '@/types/hr'
import { completeTask, uncompleteTask, updateTaskStatus, updateOnboardingTask } from '@/lib/services/onboarding'
import { calculateHealthScore } from '@/lib/services/onboarding'

interface Props {
  onboarding: OnboardingWithDetails
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  currentUserId?: string
}

type Tab = 'overview' | 'tasks' | 'preboarding' | 'timeline'

const statusActions: { value: OnboardingTaskStatus; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'not_started', label: 'Not Started', icon: Circle, color: 'text-slate-400' },
  { value: 'in_progress', label: 'In Progress', icon: Play, color: 'text-blue-500' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-500' },
  { value: 'blocked', label: 'Blocked', icon: Ban, color: 'text-red-500' },
]

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export function OnboardingDetailDrawer({ onboarding, isOpen, onClose, onUpdate, currentUserId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  const { employee, tasks, buddy } = onboarding
  const total = tasks.length
  const completed = tasks.filter(t => t.is_completed).length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  const health = calculateHealthScore(tasks, onboarding.start_date)

  const preBoardingTasks = tasks.filter(t => t.phase === 'pre_boarding')
  const dayOneTasks = tasks.filter(t => t.phase === 'day_one')

  const requiredTasks = tasks.filter(t => t.is_required)
  const requiredCompleted = requiredTasks.filter(t => t.is_completed).length
  const requiredProgress = requiredTasks.length > 0 ? Math.round((requiredCompleted / requiredTasks.length) * 100) : 100

  const optionalTasks = tasks.filter(t => !t.is_required)
  const optionalCompleted = optionalTasks.filter(t => t.is_completed).length
  const optionalProgress = optionalTasks.length > 0 ? Math.round((optionalCompleted / optionalTasks.length) * 100) : 100

  // Timeline events from tasks
  const timeline = useMemo(() => {
    const events: { date: string; label: string; type: string }[] = []
    events.push({ date: onboarding.created_at, label: 'Onboarding created', type: 'created' })
    tasks.forEach(t => {
      if (t.completed_at) {
        events.push({ date: t.completed_at, label: `"${t.task_label}" completed`, type: 'completed' })
      }
    })
    if (onboarding.completed_at) {
      events.push({ date: onboarding.completed_at, label: 'Onboarding completed', type: 'done' })
    }
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [onboarding, tasks])

  const handleToggleComplete = async (task: OnboardingTask) => {
    setLoadingTaskId(task.id)
    try {
      if (task.is_completed) {
        await uncompleteTask(task.id)
      } else {
        await completeTask(task.id, currentUserId || '')
      }
      onUpdate()
    } catch (err) {
      console.error('Failed to toggle task:', err)
    } finally {
      setLoadingTaskId(null)
    }
  }

  const handleStatusChange = async (taskId: string, status: OnboardingTaskStatus) => {
    setLoadingTaskId(taskId)
    try {
      await updateTaskStatus(taskId, status)
      onUpdate()
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setLoadingTaskId(null)
    }
  }

  const handleUpdateNote = async (taskId: string, notes: string) => {
    try {
      await updateOnboardingTask(taskId, { notes })
      onUpdate()
    } catch (err) {
      console.error('Failed to update note:', err)
    }
  }

  if (!isOpen) return null

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'tasks', label: 'Tasks', count: dayOneTasks.length },
    { key: 'preboarding', label: 'Pre-boarding', count: preBoardingTasks.length },
    { key: 'timeline', label: 'Timeline', count: timeline.length },
  ]

  const renderTaskList = (taskList: OnboardingTask[]) => (
    <div className="space-y-2">
      {taskList.map(task => {
        const isLoading = loadingTaskId === task.id
        const isExpanded = expandedTask === task.id
        const isOverdue = !task.is_completed && task.due_date && new Date(task.due_date) < new Date()

        return (
          <div
            key={task.id}
            className={`rounded-xl border p-3 transition-all ${
              task.is_completed ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10' :
              isOverdue ? 'border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/10' :
              'border-border'
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => handleToggleComplete(task)}
                disabled={isLoading}
                className="mt-0.5 flex-shrink-0"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
                ) : task.is_completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className={`w-5 h-5 ${isOverdue ? 'text-red-400' : 'text-muted-foreground'} hover:text-teal-500 transition-colors`} />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${task.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.task_label}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </span>
                  {task.is_required && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">Required</span>
                  )}
                  {isOverdue && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                    </span>
                  )}
                </div>
                {task.due_date && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Due {new Date(task.due_date).toLocaleDateString()}
                    {task.responsible_person && (
                      <span className="ml-2 flex items-center gap-1">
                        <User className="w-3 h-3" /> {task.responsible_person.first_name} {task.responsible_person.last_name}
                      </span>
                    )}
                  </p>
                )}
              </div>

              <button
                onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 pt-3 border-t border-border space-y-3 overflow-hidden"
                >
                  {/* Status buttons */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Status:</span>
                    {statusActions.map(sa => (
                      <button
                        key={sa.value}
                        onClick={() => handleStatusChange(task.id, sa.value)}
                        disabled={isLoading}
                        className={`text-[11px] px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                          task.status === sa.value ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300' : 'border-border hover:bg-muted'
                        }`}
                      >
                        <sa.icon className={`w-3 h-3 ${sa.color}`} />
                        {sa.label}
                      </button>
                    ))}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                      <MessageSquare className="w-3 h-3" /> Notes
                    </label>
                    <textarea
                      defaultValue={task.notes || ''}
                      onBlur={e => handleUpdateNote(task.id, e.target.value)}
                      placeholder="Add a note..."
                      className="w-full text-xs px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                      rows={2}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
      {taskList.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No tasks in this phase.</p>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative bg-card w-full max-w-xl shadow-2xl border-l border-border flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-700 dark:text-teal-300 font-semibold text-sm">
              {(employee?.first_name ?? '?').charAt(0)}{(employee?.last_name ?? '?').charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-foreground">{employee?.first_name ?? ''} {employee?.last_name ?? ''}</h2>
              <p className="text-xs text-muted-foreground">{employee?.position || 'N/A'} · {employee?.department || 'N/A'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-teal-500 text-teal-700 dark:text-teal-300'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="Email" value={employee.email} />
                <InfoField label="Department" value={employee.department} />
                <InfoField label="Position" value={employee.position} />
                <InfoField label="Start Date" value={onboarding.start_date ? new Date(onboarding.start_date).toLocaleDateString() : 'Not set'} />
                <InfoField label="Template" value={onboarding.template} capitalize />
                <InfoField label="Status" value={onboarding.status} capitalize />
                {buddy && <InfoField label="Buddy" value={`${buddy.first_name} ${buddy.last_name}`} />}
              </div>

              {/* Progress Section */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Overall Progress</span>
                  <span className="text-lg font-bold text-foreground">{progress}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-teal-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ProgressMini label="Required" value={requiredProgress} count={`${requiredCompleted}/${requiredTasks.length}`} />
                  <ProgressMini label="Optional" value={optionalProgress} count={`${optionalCompleted}/${optionalTasks.length}`} />
                </div>
              </div>

              {/* Health Score */}
              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg width={64} height={64} className="-rotate-90">
                    <circle cx={32} cy={32} r={26} fill="none" stroke="currentColor" className="text-muted/30" strokeWidth={6} />
                    <motion.circle
                      cx={32} cy={32} r={26} fill="none"
                      stroke={health.score >= 80 ? '#10b981' : health.score >= 60 ? '#f59e0b' : '#ef4444'}
                      strokeWidth={6} strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 26}
                      initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - health.score / 100) }}
                      transition={{ duration: 1 }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{health.score}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-1">Health Score</p>
                  {health.recommendations.length > 0 ? (
                    health.recommendations.map((r, i) => (
                      <p key={i} className="text-xs text-amber-600 dark:text-amber-400">⚠ {r}</p>
                    ))
                  ) : (
                    <p className="text-xs text-emerald-600">All systems healthy.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && renderTaskList(dayOneTasks)}

          {/* Pre-boarding Tab */}
          {activeTab === 'preboarding' && (
            <div>
              {onboarding.start_date && new Date(onboarding.start_date) > new Date() && (
                <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-800 text-center">
                  <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                    {Math.ceil((new Date(onboarding.start_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} days until start
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    {preBoardingTasks.filter(t => t.is_completed).length} of {preBoardingTasks.length} pre-boarding tasks complete
                  </p>
                </div>
              )}
              {renderTaskList(preBoardingTasks)}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-0">
              {timeline.map((event, i) => (
                <div key={i} className="flex gap-3 pb-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      event.type === 'done' ? 'bg-emerald-500' : event.type === 'completed' ? 'bg-teal-500' : 'bg-blue-500'
                    }`} />
                    {i < timeline.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                  </div>
                  <div className="pb-2">
                    <p className="text-sm text-foreground">{event.label}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(event.date).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {timeline.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No activity recorded yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Completion banner */}
        {onboarding.status === 'completed' && (
          <div className="px-6 py-4 bg-emerald-50 dark:bg-emerald-950/30 border-t border-emerald-200 dark:border-emerald-800 text-center">
            <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-center gap-2">
              🎉 Onboarding Complete
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              Completed on {onboarding.completed_at ? new Date(onboarding.completed_at).toLocaleDateString() : 'N/A'} · {progress}% tasks done
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function InfoField({ label, value, capitalize }: { label: string; value?: string; capitalize?: boolean }) {
  return (
    <div>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <p className={`text-sm font-medium text-foreground ${capitalize ? 'capitalize' : ''}`}>{value || 'N/A'}</p>
    </div>
  )
}

function ProgressMini({ label, value, count }: { label: string; value: number; count: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-[11px] font-semibold">{count}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${value === 100 ? 'bg-emerald-500' : 'bg-teal-400'}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </div>
  )
}
