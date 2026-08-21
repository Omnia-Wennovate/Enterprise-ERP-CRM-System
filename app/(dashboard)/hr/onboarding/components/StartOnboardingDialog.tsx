'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Search, ChevronRight, ChevronLeft, User, Users, Settings, TrendingUp,
  DollarSign, Wrench, Plus, Trash2, GripVertical, CheckCircle2, AlertCircle,
  Calendar, Shield, Star, Sparkles
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { getEmployees } from '@/lib/services/hr'
import { checkDuplicateOnboarding, createOnboarding, getTemplateTasks } from '@/lib/services/onboarding'
import type {
  EmployeeProfile, OnboardingTaskCategory, OnboardingTaskPriority,
  OnboardingTaskPhase, CreateOnboardingData, ONBOARDING_TEMPLATES, TASK_CATEGORIES
} from '@/types/hr'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type WizardStep = 1 | 2 | 3 | 4

const templates = [
  { value: 'standard', label: 'Standard Employee', icon: User },
  { value: 'sales', label: 'Sales Agent', icon: TrendingUp },
  { value: 'operations', label: 'Operations Officer', icon: Settings },
  { value: 'finance', label: 'Finance Staff', icon: DollarSign },
  { value: 'manager', label: 'Manager', icon: Users },
  { value: 'custom', label: 'Custom', icon: Wrench },
]

const categories: { value: OnboardingTaskCategory; label: string }[] = [
  { value: 'orientation', label: 'Orientation' },
  { value: 'it_systems', label: 'IT & Systems' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'training', label: 'Training' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'finance', label: 'Finance' },
  { value: 'team_introduction', label: 'Team Introduction' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'role_specific', label: 'Role Specific' },
  { value: 'equipment', label: 'Equipment' },
]

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
}

interface TaskDraft {
  id: string
  task_label: string
  description?: string
  category: OnboardingTaskCategory
  phase: OnboardingTaskPhase
  priority: OnboardingTaskPriority
  is_required: boolean
  due_date?: string
  responsible_person_id?: string
  sort_order: number
  notes?: string
}

export function StartOnboardingDialog({ isOpen, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<WizardStep>(1)
  const [employees, setEmployees] = useState<EmployeeProfile[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null)
  const [duplicateId, setDuplicateId] = useState<string | null>(null)

  // Step 2
  const [template, setTemplate] = useState('standard')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [buddyId, setBuddyId] = useState('')
  const [buddyCandidates, setBuddyCandidates] = useState<EmployeeProfile[]>([])

  // Step 3
  const [tasks, setTasks] = useState<TaskDraft[]>([])
  const [editingTask, setEditingTask] = useState<string | null>(null)

  // Step 4
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Load employees
  useEffect(() => {
    if (isOpen) {
      setLoadingEmployees(true)
      getEmployees()
        .then(data => setEmployees(data || []))
        .catch(console.error)
        .finally(() => setLoadingEmployees(false))
    }
  }, [isOpen])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setSelectedEmployee(null)
      setDuplicateId(null)
      setTemplate('standard')
      setStartDate(new Date().toISOString().split('T')[0])
      setBuddyId('')
      setTasks([])
      setSuccess(false)
      setError('')
      setSearch('')
      setDeptFilter('')
    }
  }, [isOpen])

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const name = `${e.first_name} ${e.last_name}`.toLowerCase()
      const matchSearch = !search || name.includes(search.toLowerCase()) || (e.department || '').toLowerCase().includes(search.toLowerCase())
      const matchDept = !deptFilter || e.department === deptFilter
      return matchSearch && matchDept
    })
  }, [employees, search, deptFilter])

  const departments = useMemo(() => {
    const depts = new Set<string>()
    employees.forEach(e => { if (e.department) depts.add(e.department) })
    return Array.from(depts).sort()
  }, [employees])

  // Check duplicate on select
  const handleSelectEmployee = async (emp: EmployeeProfile) => {
    setSelectedEmployee(emp)
    setDuplicateId(null)
    try {
      const existing = await checkDuplicateOnboarding(emp.id)
      if (existing) {
        setDuplicateId(existing.id)
      }
    } catch (err) {
      console.error('Error checking duplicate:', err)
    }

    // Compute buddy candidates
    const candidates = employees.filter(
      e => e.id !== emp.id && e.department === emp.department && e.id !== emp.manager_id
    )
    setBuddyCandidates(candidates)
  }

  // Load template tasks when step 3 opens
  useEffect(() => {
    if (step === 3 && tasks.length === 0 && startDate) {
      const templateTasks = getTemplateTasks(template, startDate)
      setTasks(templateTasks.map((t, i) => ({
        id: `draft-${i}-${Date.now()}`,
        task_label: t.task_label,
        description: t.description,
        category: t.category,
        phase: t.phase,
        priority: t.priority,
        is_required: t.is_required,
        due_date: t.due_date,
        responsible_person_id: t.responsible_person_id,
        sort_order: t.sort_order ?? i,
        notes: t.notes,
      })))
    }
  }, [step, template, startDate])

  // Add task
  const addTask = () => {
    const newTask: TaskDraft = {
      id: `draft-${Date.now()}`,
      task_label: 'New Task',
      category: 'orientation',
      phase: 'day_one',
      priority: 'medium',
      is_required: true,
      sort_order: tasks.length,
    }
    setTasks([...tasks, newTask])
    setEditingTask(newTask.id)
  }

  // Remove task
  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  // Update task
  const updateTask = (id: string, updates: Partial<TaskDraft>) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  // Drag reorder
  const onDragEnd = (result: any) => {
    if (!result.destination) return
    const items = Array.from(tasks)
    const [reordered] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reordered)
    setTasks(items.map((t, i) => ({ ...t, sort_order: i })))
  }

  // Submit
  const handleSubmit = async () => {
    if (!selectedEmployee) return
    setSubmitting(true)
    setError('')

    try {
      const data: CreateOnboardingData = {
        employee_id: selectedEmployee.id,
        buddy_id: buddyId || undefined,
        template,
        start_date: startDate,
        tasks: tasks.map(t => ({
          task_label: t.task_label,
          description: t.description,
          category: t.category,
          phase: t.phase,
          priority: t.priority,
          is_required: t.is_required,
          due_date: t.due_date,
          responsible_person_id: t.responsible_person_id,
          sort_order: t.sort_order,
          notes: t.notes,
          status: 'not_started' as const,
        })),
      }

      await createOnboarding(data)
      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch (err: any) {
      if (err.message === 'DUPLICATE_ONBOARDING') {
        setError('An active onboarding already exists for this employee.')
      } else {
        setError(err.message || 'Failed to create onboarding.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const preBoardingTasks = tasks.filter(t => t.phase === 'pre_boarding')
  const dayOneTasks = tasks.filter(t => t.phase === 'day_one')
  const requiredCount = tasks.filter(t => t.is_required).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-lg font-bold text-foreground">Start Employee Onboarding</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Step {step} of 4</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(s => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  s === step ? 'bg-omnia-gold text-white' : s < step ? 'bg-omnia-gold/15 text-omnia-gold-dark' : 'bg-muted text-muted-foreground'
                }`}>
                  {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 4 && <div className={`flex-1 h-0.5 rounded ${s < step ? 'bg-teal-400' : 'bg-muted'}`} />}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>Employee</span>
            <span>Plan</span>
            <span>Tasks</span>
            <span>Review</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* ── STEP 1: Select Employee ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text" placeholder="Search employees..."
                      value={search} onChange={e => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
                    />
                  </div>
                  <select
                    value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                    className="px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
                  >
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {loadingEmployees ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />)}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {filteredEmployees.map(emp => (
                      <div
                        key={emp.id}
                        onClick={() => handleSelectEmployee(emp)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                          selectedEmployee?.id === emp.id
                            ? 'border-omnia-gold bg-omnia-gold/10 dark:bg-teal-950/30'
                            : 'border-transparent hover:bg-muted/50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-omnia-gold/15 dark:bg-teal-900 flex items-center justify-center text-omnia-gold-dark dark:text-teal-300 font-semibold text-sm flex-shrink-0">
                          {(emp.first_name || '?')[0]}{(emp.last_name || '?')[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">{emp.first_name || ''} {emp.last_name || ''}</p>
                          <p className="text-xs text-muted-foreground">{emp.position || emp.job_title || 'No Position'} · {emp.department || 'No Dept'}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          emp.employment_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {emp.employment_status}
                        </span>
                      </div>
                    ))}
                    {filteredEmployees.length === 0 && (
                      <p className="text-center text-muted-foreground py-8 text-sm">No employees found.</p>
                    )}
                  </div>
                )}

                {/* Preview card */}
                {selectedEmployee && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-omnia-gold/10 dark:bg-teal-950/30 rounded-xl border border-omnia-gold/20 dark:border-teal-800"
                  >
                    {duplicateId ? (
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Onboarding already exists for this employee.</p>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">An active onboarding process is currently in progress.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground text-xs">Name</span><p className="font-medium">{selectedEmployee.first_name} {selectedEmployee.last_name}</p></div>
                        <div><span className="text-muted-foreground text-xs">Position</span><p className="font-medium">{selectedEmployee.position || 'N/A'}</p></div>
                        <div><span className="text-muted-foreground text-xs">Department</span><p className="font-medium">{selectedEmployee.department || 'N/A'}</p></div>
                        <div><span className="text-muted-foreground text-xs">Start Date</span><p className="font-medium">{selectedEmployee.date_joined ? new Date(selectedEmployee.date_joined).toLocaleDateString() : 'Not set'}</p></div>
                        <div><span className="text-muted-foreground text-xs">Email</span><p className="font-medium truncate">{selectedEmployee.email}</p></div>
                        <div><span className="text-muted-foreground text-xs">Type</span><p className="font-medium capitalize">{selectedEmployee.employee_type.replace('_', ' ')}</p></div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── STEP 2: Onboarding Plan ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-3">Onboarding Template</label>
                  <div className="grid grid-cols-3 gap-3">
                    {templates.map(t => (
                      <div
                        key={t.value}
                        onClick={() => { setTemplate(t.value); setTasks([]) }}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                          template === t.value ? 'border-omnia-gold bg-omnia-gold/10 dark:bg-teal-950/30' : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <t.icon className={`w-5 h-5 ${template === t.value ? 'text-omnia-gold' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">{t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-1.5">Start Date</label>
                    <input
                      type="date" value={startDate}
                      onChange={e => { setStartDate(e.target.value); setTasks([]) }}
                      className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-1.5">Onboarding Buddy (Optional)</label>
                    <select
                      value={buddyId} onChange={e => setBuddyId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
                    >
                      <option value="">No buddy assigned</option>
                      {buddyCandidates.map(b => (
                        <option key={b.id} value={b.id}>{b.first_name} {b.last_name} — {b.position || 'N/A'}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-muted-foreground mt-1">Peers from the same department (excludes manager)</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Task Configuration ── */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{tasks.length} Tasks</p>
                    <p className="text-xs text-muted-foreground">{preBoardingTasks.length} pre-boarding · {dayOneTasks.length} day-one</p>
                  </div>
                  <button onClick={addTask} className="flex items-center gap-1.5 text-sm text-omnia-gold hover:text-omnia-gold-dark font-medium">
                    <Plus className="w-4 h-4" /> Add Task
                  </button>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="tasks">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                className={`rounded-xl border p-3 transition-shadow ${
                                  snap.isDragging ? 'shadow-lg border-omnia-gold/60' : 'border-border'
                                } ${editingTask === task.id ? 'bg-muted/30' : 'bg-card'}`}
                              >
                                <div className="flex items-center gap-2">
                                  <div {...prov.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1">
                                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                                  </div>

                                  {editingTask === task.id ? (
                                    <input
                                      autoFocus
                                      value={task.task_label}
                                      onChange={e => updateTask(task.id, { task_label: e.target.value })}
                                      onBlur={() => setEditingTask(null)}
                                      onKeyDown={e => { if (e.key === 'Enter') setEditingTask(null) }}
                                      className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-omnia-gold-500"
                                    />
                                  ) : (
                                    <span
                                      onClick={() => setEditingTask(task.id)}
                                      className="flex-1 text-sm font-medium text-foreground cursor-text"
                                    >
                                      {task.task_label}
                                    </span>
                                  )}

                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>
                                    {task.priority}
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                    task.phase === 'pre_boarding' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {task.phase === 'pre_boarding' ? 'Pre-board' : 'Day 1+'}
                                  </span>
                                  {task.is_required && <Star className="w-3.5 h-3.5 text-amber-500" />}
                                  <button onClick={() => removeTask(task.id)} className="p-1 text-muted-foreground hover:text-red-500 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Inline edit row */}
                                <div className="flex items-center gap-2 mt-2 pl-8">
                                  <select
                                    value={task.category}
                                    onChange={e => updateTask(task.id, { category: e.target.value as OnboardingTaskCategory })}
                                    className="text-[11px] px-2 py-1 bg-muted/50 border border-border rounded focus:outline-none"
                                  >
                                    {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                  </select>
                                  <select
                                    value={task.priority}
                                    onChange={e => updateTask(task.id, { priority: e.target.value as OnboardingTaskPriority })}
                                    className="text-[11px] px-2 py-1 bg-muted/50 border border-border rounded focus:outline-none"
                                  >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                  </select>
                                  <select
                                    value={task.phase}
                                    onChange={e => updateTask(task.id, { phase: e.target.value as OnboardingTaskPhase })}
                                    className="text-[11px] px-2 py-1 bg-muted/50 border border-border rounded focus:outline-none"
                                  >
                                    <option value="pre_boarding">Pre-boarding</option>
                                    <option value="day_one">Day One+</option>
                                  </select>
                                  <input
                                    type="date" value={task.due_date || ''}
                                    onChange={e => updateTask(task.id, { due_date: e.target.value })}
                                    className="text-[11px] px-2 py-1 bg-muted/50 border border-border rounded focus:outline-none"
                                  />
                                  <label className="flex items-center gap-1 text-[11px] text-muted-foreground cursor-pointer">
                                    <input
                                      type="checkbox" checked={task.is_required}
                                      onChange={e => updateTask(task.id, { is_required: e.target.checked })}
                                      className="rounded"
                                    />
                                    Req
                                  </label>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </motion.div>
            )}

            {/* ── STEP 4: Review & Create ── */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {success ? (
                  <div className="text-center py-12">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                      <Sparkles className="w-16 h-16 text-omnia-gold mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Onboarding Created!</h3>
                    <p className="text-muted-foreground">
                      {selectedEmployee?.first_name} {selectedEmployee?.last_name}&apos;s onboarding has been set up with {tasks.length} tasks.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-muted/30 rounded-xl p-4 border border-border">
                      <h3 className="font-semibold text-foreground mb-3">Onboarding Summary</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground text-xs">Employee</span><p className="font-medium">{selectedEmployee?.first_name} {selectedEmployee?.last_name}</p></div>
                        <div><span className="text-muted-foreground text-xs">Position</span><p className="font-medium">{selectedEmployee?.position || 'N/A'}</p></div>
                        <div><span className="text-muted-foreground text-xs">Department</span><p className="font-medium">{selectedEmployee?.department || 'N/A'}</p></div>
                        <div><span className="text-muted-foreground text-xs">Start Date</span><p className="font-medium">{new Date(startDate).toLocaleDateString()}</p></div>
                        <div><span className="text-muted-foreground text-xs">Template</span><p className="font-medium capitalize">{template}</p></div>
                        <div><span className="text-muted-foreground text-xs">Total Tasks</span><p className="font-medium">{tasks.length}</p></div>
                        <div><span className="text-muted-foreground text-xs">Required Tasks</span><p className="font-medium">{requiredCount}</p></div>
                        <div><span className="text-muted-foreground text-xs">Pre-boarding Tasks</span><p className="font-medium">{preBoardingTasks.length}</p></div>
                        {buddyId && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground text-xs">Onboarding Buddy</span>
                            <p className="font-medium">{buddyCandidates.find(b => b.id === buddyId)?.first_name} {buddyCandidates.find(b => b.id === buddyId)?.last_name}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Task list preview */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Tasks ({tasks.length})</h4>
                      <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
                        {tasks.map((t, i) => (
                          <div key={t.id} className="flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-muted/30">
                            <span className="text-muted-foreground w-5 text-right text-xs">{i + 1}</span>
                            <span className="flex-1 text-foreground">{t.task_label}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${priorityColors[t.priority]}`}>{t.priority}</span>
                            {t.is_required && <Star className="w-3 h-3 text-amber-500" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
            <button
              onClick={() => setStep(Math.max(1, step - 1) as WizardStep)}
              disabled={step === 1}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep(Math.min(4, step + 1) as WizardStep)}
                disabled={step === 1 && (!selectedEmployee || !!duplicateId)}
                className="flex items-center gap-1.5 px-5 py-2 bg-omnia-gold text-white rounded-lg text-sm font-semibold hover:bg-omnia-gold-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || tasks.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-omnia-gold text-white rounded-lg text-sm font-semibold hover:bg-omnia-gold-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Create Onboarding
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
