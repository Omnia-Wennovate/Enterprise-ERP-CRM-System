import { createClient } from '@/lib/supabase/client'
import type {
  OnboardingTask,
  Onboarding,
  OnboardingWithDetails,
  OnboardingKPIs,
  OnboardingHealthBreakdown,
  CreateOnboardingData,
  OnboardingTaskStatus,
} from '@/types/hr'

// ============================================================================
// QUERIES
// ============================================================================

export async function getOnboardings(): Promise<OnboardingWithDetails[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('onboardings')
    .select(`
      *,
      employee:profiles!onboardings_employee_id_fkey(
        id, first_name, last_name, email, department, position,
        date_joined, manager_id, avatar_url, employment_status
      ),
      buddy:profiles!onboardings_buddy_id_fkey(
        id, first_name, last_name, avatar_url
      ),
      creator:profiles!onboardings_created_by_fkey(
        first_name, last_name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Fetch tasks for all onboardings
  const onboardingIds = (data || []).map((o: any) => o.id)
  let tasks: any[] = []
  if (onboardingIds.length > 0) {
    const { data: tasksData, error: tasksError } = await supabase
      .from('onboarding_tasks')
      .select(`
        *,
        responsible_person:profiles!onboarding_tasks_responsible_person_id_fkey(
          first_name, last_name, avatar_url
        )
      `)
      .in('onboarding_id', onboardingIds)
      .order('sort_order', { ascending: true })

    if (tasksError) throw tasksError
    tasks = tasksData || []
  }

  return (data || [])
    .filter((o: any) => o.employee != null)
    .map((o: any) => ({
      ...o,
      tasks: tasks.filter((t: any) => t.onboarding_id === o.id),
    })) as OnboardingWithDetails[]
}

export async function getOnboardingById(id: string): Promise<OnboardingWithDetails | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('onboardings')
    .select(`
      *,
      employee:profiles!onboardings_employee_id_fkey(
        id, first_name, last_name, email, department, position,
        date_joined, manager_id, avatar_url, employment_status
      ),
      buddy:profiles!onboardings_buddy_id_fkey(
        id, first_name, last_name, avatar_url
      ),
      creator:profiles!onboardings_created_by_fkey(
        first_name, last_name
      )
    `)
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  if (!data) return null

  const { data: tasks, error: tasksError } = await supabase
    .from('onboarding_tasks')
    .select(`
      *,
      responsible_person:profiles!onboarding_tasks_responsible_person_id_fkey(
        first_name, last_name, avatar_url
      )
    `)
    .eq('onboarding_id', id)
    .order('sort_order', { ascending: true })

  if (tasksError) throw tasksError

  return { ...data, tasks: tasks || [] } as OnboardingWithDetails
}

// ============================================================================
// MUTATIONS
// ============================================================================

export async function checkDuplicateOnboarding(employeeId: string): Promise<Onboarding | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('onboardings')
    .select('*')
    .eq('employee_id', employeeId)
    .not('status', 'in', '("completed","cancelled")')
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as Onboarding | null
}

export async function createOnboarding(input: CreateOnboardingData): Promise<OnboardingWithDetails> {
  const supabase = createClient()

  // 1. Check for duplicates
  const existing = await checkDuplicateOnboarding(input.employee_id)
  if (existing) {
    throw new Error('DUPLICATE_ONBOARDING')
  }

  // 2. Create the onboarding record
  const { data: onboarding, error: obError } = await supabase
    .from('onboardings')
    .insert({
      employee_id: input.employee_id,
      buddy_id: input.buddy_id || null,
      template: input.template,
      start_date: input.start_date,
      target_end_date: input.target_end_date || null,
      created_by: input.created_by || null,
      status: 'active',
      health_score: 100,
    })
    .select()
    .single()

  if (obError) throw obError

  // 3. Create tasks
  if (input.tasks.length > 0) {
    const taskRows = input.tasks.map((t, i) => ({
      employee_id: input.employee_id,
      onboarding_id: onboarding.id,
      task_label: t.task_label,
      description: t.description || null,
      category: t.category,
      responsible_person_id: t.responsible_person_id || null,
      due_date: t.due_date || null,
      priority: t.priority || 'medium',
      status: 'not_started' as const,
      phase: t.phase || 'day_one',
      is_required: t.is_required !== false,
      is_completed: false,
      sort_order: t.sort_order ?? i,
      notes: t.notes || null,
    }))

    const { error: tasksError } = await supabase
      .from('onboarding_tasks')
      .insert(taskRows)

    if (tasksError) {
      // Rollback onboarding
      await supabase.from('onboardings').delete().eq('id', onboarding.id)
      throw tasksError
    }
  }

  // 4. Attempt cross-module integrations (graceful fallback)
  await tryCrossModuleIntegrations(input.employee_id, input.tasks, onboarding.id)

  // 5. Return full onboarding
  const result = await getOnboardingById(onboarding.id)
  return result!
}

async function tryCrossModuleIntegrations(
  employeeId: string,
  tasks: CreateOnboardingData['tasks'],
  _onboardingId: string
) {
  const supabase = createClient()

  // Equipment integration — create asset assignment request
  const equipmentTask = tasks.find(t => t.category === 'equipment')
  if (equipmentTask) {
    try {
      await supabase.from('asset_assignments').insert({
        asset_id: null, // Will be assigned later by IT
        employee_id: employeeId,
        issued_date: new Date().toISOString().split('T')[0],
        approval_status: 'pending',
        condition_on_issue: 'new',
      })
    } catch {
      console.info('[Onboarding] Equipment integration skipped — asset_assignments insert failed (table may not support null asset_id)')
    }
  }

  // IT ticket integration — create feature request
  const itTask = tasks.find(t => t.category === 'it_systems')
  if (itTask) {
    try {
      const { data: emp } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', employeeId)
        .single()

      if (emp) {
        await supabase.from('feature_requests').insert({
          title: `IT Account Provisioning for ${emp.first_name} ${emp.last_name}`,
          description: 'Auto-generated from onboarding: set up email, system access, and required software.',
          department: 'Technology',
          status: 'requested',
          priority: 'high',
          requested_by: employeeId,
        })
      }
    } catch {
      console.info('[Onboarding] IT ticket integration skipped — feature_requests insert failed')
    }
  }
}

// ============================================================================
// TASK UPDATES
// ============================================================================

export async function updateOnboardingTask(
  taskId: string,
  updates: Partial<Pick<OnboardingTask, 'task_label' | 'description' | 'due_date' | 'priority' | 'status' | 'responsible_person_id' | 'notes' | 'is_required' | 'sort_order' | 'phase'>>
): Promise<OnboardingTask> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('onboarding_tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error

  // Recalculate onboarding health if we have onboarding_id
  if (data.onboarding_id) {
    await recalculateOnboardingStatus(data.onboarding_id)
  }

  return data as OnboardingTask
}

export async function completeTask(taskId: string, completedBy: string): Promise<OnboardingTask> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('onboarding_tasks')
    .update({
      is_completed: true,
      status: 'completed',
      completed_by: completedBy,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error

  // Recalculate
  if (data.onboarding_id) {
    await recalculateOnboardingStatus(data.onboarding_id)
  }

  return data as OnboardingTask
}

export async function uncompleteTask(taskId: string): Promise<OnboardingTask> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('onboarding_tasks')
    .update({
      is_completed: false,
      status: 'in_progress',
      completed_by: null,
      completed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error

  if (data.onboarding_id) {
    await recalculateOnboardingStatus(data.onboarding_id)
  }

  return data as OnboardingTask
}

export async function updateTaskStatus(taskId: string, status: OnboardingTaskStatus): Promise<OnboardingTask> {
  const supabase = createClient()
  const updates: any = { status, updated_at: new Date().toISOString() }

  if (status === 'completed') {
    updates.is_completed = true
    updates.completed_at = new Date().toISOString()
  } else {
    updates.is_completed = false
    updates.completed_at = null
    updates.completed_by = null
  }

  const { data, error } = await supabase
    .from('onboarding_tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error

  if (data.onboarding_id) {
    await recalculateOnboardingStatus(data.onboarding_id)
  }

  return data as OnboardingTask
}

// ============================================================================
// STATUS & HEALTH RECALCULATION
// ============================================================================

async function recalculateOnboardingStatus(onboardingId: string) {
  const supabase = createClient()

  const { data: tasks } = await supabase
    .from('onboarding_tasks')
    .select('*')
    .eq('onboarding_id', onboardingId)

  if (!tasks || tasks.length === 0) return

  const { data: onboarding } = await supabase
    .from('onboardings')
    .select('start_date')
    .eq('id', onboardingId)
    .single()

  const health = calculateHealthScore(tasks, onboarding?.start_date)
  const allRequiredDone = tasks.filter(t => t.is_required).every(t => t.is_completed)
  const allDone = tasks.every(t => t.is_completed)
  const hasOverdue = tasks.some(t => !t.is_completed && t.due_date && new Date(t.due_date) < new Date())
  const hasBlocked = tasks.some(t => t.status === 'blocked')

  let status: string = 'active'
  if (allRequiredDone && allDone) {
    status = 'completed'
  } else if (hasBlocked) {
    status = 'blocked'
  } else if (hasOverdue) {
    status = 'overdue'
  } else if (health.score < 60) {
    status = 'at_risk'
  }

  const updates: any = {
    status,
    health_score: health.score,
    updated_at: new Date().toISOString(),
  }

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString()

    // Schedule 30/60/90 day check-ins
    if (onboarding?.start_date) {
      await scheduleCheckIns(onboardingId, onboarding.start_date)
    }
  }

  await supabase.from('onboardings').update(updates).eq('id', onboardingId)
}

// ============================================================================
// HEALTH SCORE (deterministic, 0–100)
// ============================================================================

export function calculateHealthScore(
  tasks: Pick<OnboardingTask, 'is_completed' | 'is_required' | 'due_date' | 'status'>[],
  startDate?: string
): OnboardingHealthBreakdown {
  if (tasks.length === 0) {
    return { score: 100, taskCompletion: 100, overdueImpact: 0, blockedImpact: 0, deadlineProximity: 0, requiredCompletion: 100, recommendations: [] }
  }

  const recommendations: string[] = []
  const now = new Date()

  // 1. Task completion (40 weight)
  const completed = tasks.filter(t => t.is_completed).length
  const taskCompletion = Math.round((completed / tasks.length) * 100)

  // 2. Required task completion (25 weight)
  const requiredTasks = tasks.filter(t => t.is_required)
  const requiredCompleted = requiredTasks.filter(t => t.is_completed).length
  const requiredCompletion = requiredTasks.length > 0 ? Math.round((requiredCompleted / requiredTasks.length) * 100) : 100

  // 3. Overdue impact (20 weight)
  const overdueTasks = tasks.filter(t => !t.is_completed && t.due_date && new Date(t.due_date) < now)
  const overdueImpact = overdueTasks.length
  if (overdueImpact > 0) {
    const requiredOverdue = overdueTasks.filter(t => t.is_required).length
    if (requiredOverdue > 0) {
      recommendations.push(`${requiredOverdue} required task${requiredOverdue > 1 ? 's are' : ' is'} overdue.`)
    } else {
      recommendations.push(`${overdueImpact} task${overdueImpact > 1 ? 's are' : ' is'} past deadline.`)
    }
  }

  // 4. Blocked tasks (10 weight)
  const blockedTasks = tasks.filter(t => t.status === 'blocked')
  const blockedImpact = blockedTasks.length
  if (blockedImpact > 0) {
    recommendations.push(`${blockedImpact} task${blockedImpact > 1 ? 's are' : ' is'} blocked and needs attention.`)
  }

  // 5. Deadline proximity (5 weight)
  let deadlineProximity = 0
  const upcomingDeadlines = tasks.filter(t => {
    if (t.is_completed || !t.due_date) return false
    const daysUntil = (new Date(t.due_date).getTime() - now.getTime()) / (1000 * 3600 * 24)
    return daysUntil >= 0 && daysUntil <= 2
  })
  deadlineProximity = upcomingDeadlines.length
  if (deadlineProximity > 0) {
    recommendations.push(`${deadlineProximity} task${deadlineProximity > 1 ? 's' : ''} due within 2 days.`)
  }

  // Calculate score
  const completionScore = (taskCompletion / 100) * 40
  const requiredScore = (requiredCompletion / 100) * 25
  const overdueScore = Math.max(0, 20 - (overdueImpact * 5))
  const blockedScore = Math.max(0, 10 - (blockedImpact * 5))
  const deadlineScore = Math.max(0, 5 - (deadlineProximity * 1))

  const score = Math.round(completionScore + requiredScore + overdueScore + blockedScore + deadlineScore)

  if (score < 50 && recommendations.length === 0) {
    recommendations.push('Onboarding progress is significantly behind schedule.')
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    taskCompletion,
    overdueImpact,
    blockedImpact,
    deadlineProximity,
    requiredCompletion,
    recommendations,
  }
}

// ============================================================================
// 30/60/90 DAY CHECK-INS
// ============================================================================

async function scheduleCheckIns(onboardingId: string, startDate: string) {
  const supabase = createClient()

  const { data: onboarding } = await supabase
    .from('onboardings')
    .select('employee_id, employee:profiles!onboardings_employee_id_fkey(manager_id)')
    .eq('id', onboardingId)
    .single()

  if (!onboarding) return

  const start = new Date(startDate)
  const managerId = (onboarding as any).employee?.manager_id

  const checkIns = [30, 60, 90].map(days => {
    const checkDate = new Date(start)
    checkDate.setDate(checkDate.getDate() + days)
    return {
      employee_id: onboarding.employee_id,
      reviewer_id: managerId || null,
      period_year: checkDate.getFullYear(),
      period_month: checkDate.getMonth() + 1,
      review_type: 'onboarding_checkin',
      status: 'pending',
      manager_notes: `${days}-Day Onboarding Check-In — Review integration, performance, and satisfaction.`,
    }
  })

  try {
    await supabase.from('performance_reviews').insert(checkIns)
  } catch {
    console.info('[Onboarding] 30/60/90 check-in scheduling skipped — performance_reviews insert failed')
  }
}

// ============================================================================
// KPI CALCULATIONS
// ============================================================================

export async function getOnboardingKPIs(): Promise<OnboardingKPIs> {
  const supabase = createClient()
  const now = new Date()
  const weekFromNow = new Date(now)
  weekFromNow.setDate(weekFromNow.getDate() + 7)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Active onboardings
  const { data: allOnboardings } = await supabase
    .from('onboardings')
    .select('id, status, start_date, completed_at, created_at')

  const onboardings = allOnboardings || []
  const active = onboardings.filter(o => !['completed', 'cancelled'].includes(o.status))
  const activeCount = active.length

  // Completed this month
  const completedThisMonth = onboardings.filter(o =>
    o.status === 'completed' && o.completed_at && new Date(o.completed_at) >= monthStart
  ).length

  // Starting soon (within 7 days)
  const startingSoon = active.filter(o => {
    if (!o.start_date) return false
    const sd = new Date(o.start_date)
    return sd >= now && sd <= weekFromNow
  }).length

  // At risk
  const atRiskCount = onboardings.filter(o => ['at_risk', 'overdue', 'blocked'].includes(o.status)).length

  // Completion rate
  const completed = onboardings.filter(o => o.status === 'completed')
  const total = onboardings.length
  const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0

  // Avg completion time
  let avgCompletionDays = 0
  if (completed.length > 0) {
    const totalDays = completed.reduce((sum, o) => {
      if (o.completed_at && o.created_at) {
        return sum + (new Date(o.completed_at).getTime() - new Date(o.created_at).getTime()) / (1000 * 3600 * 24)
      }
      return sum
    }, 0)
    avgCompletionDays = Math.round(totalDays / completed.length)
  }

  // Task-level KPIs
  const activeIds = active.map(o => o.id)
  let overdueTasks = 0
  let dueThisWeek = 0

  if (activeIds.length > 0) {
    const { data: tasks } = await supabase
      .from('onboarding_tasks')
      .select('due_date, is_completed')
      .in('onboarding_id', activeIds)

    if (tasks) {
      const today = now.toISOString().split('T')[0]
      const weekEnd = weekFromNow.toISOString().split('T')[0]
      overdueTasks = tasks.filter(t => !t.is_completed && t.due_date && t.due_date < today).length
      dueThisWeek = tasks.filter(t => !t.is_completed && t.due_date && t.due_date >= today && t.due_date <= weekEnd).length
    }
  }

  return { activeCount, completionRate, dueThisWeek, overdueTasks, startingSoon, completedThisMonth, avgCompletionDays, atRiskCount }
}

// ============================================================================
// REALTIME
// ============================================================================

export function subscribeToOnboardingChanges(callback: () => void) {
  const supabase = createClient()
  const channel = supabase
    .channel('onboarding-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'onboardings' }, () => callback())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'onboarding_tasks' }, () => callback())
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// ============================================================================
// TEMPLATE TASK GENERATORS
// ============================================================================

export function getTemplateTasks(template: string, startDate: string): CreateOnboardingData['tasks'] {
  const start = new Date(startDate)
  const dayOffset = (days: number) => {
    const d = new Date(start)
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  }
  const preDate = (days: number) => {
    const d = new Date(start)
    d.setDate(d.getDate() - days)
    return d.toISOString().split('T')[0]
  }

  const preBoardingTasks: CreateOnboardingData['tasks'] = [
    { task_label: 'Send offer confirmation', category: 'documentation', phase: 'pre_boarding', priority: 'high', is_required: true, sort_order: 0, due_date: preDate(7), status: 'not_started' },
    { task_label: 'Collect signed documents', category: 'documentation', phase: 'pre_boarding', priority: 'high', is_required: true, sort_order: 1, due_date: preDate(5), status: 'not_started' },
    { task_label: 'Request equipment provisioning', category: 'equipment', phase: 'pre_boarding', priority: 'high', is_required: true, sort_order: 2, due_date: preDate(3), status: 'not_started' },
    { task_label: 'Create email/system accounts', category: 'it_systems', phase: 'pre_boarding', priority: 'critical', is_required: true, sort_order: 3, due_date: preDate(2), status: 'not_started' },
    { task_label: 'Send welcome package', category: 'orientation', phase: 'pre_boarding', priority: 'medium', is_required: false, sort_order: 4, due_date: preDate(1), status: 'not_started' },
    { task_label: 'Confirm start date with employee', category: 'orientation', phase: 'pre_boarding', priority: 'high', is_required: true, sort_order: 5, due_date: preDate(3), status: 'not_started' },
  ]

  const baseTasks: CreateOnboardingData['tasks'] = [
    { task_label: 'Company orientation session', category: 'orientation', phase: 'day_one', priority: 'high', is_required: true, sort_order: 10, due_date: dayOffset(0), status: 'not_started' },
    { task_label: 'Office tour & workspace setup', category: 'workspace', phase: 'day_one', priority: 'high', is_required: true, sort_order: 11, due_date: dayOffset(0), status: 'not_started' },
    { task_label: 'IT setup & system access', category: 'it_systems', phase: 'day_one', priority: 'critical', is_required: true, sort_order: 12, due_date: dayOffset(1), status: 'not_started' },
    { task_label: 'Team introductions', category: 'team_introduction', phase: 'day_one', priority: 'high', is_required: true, sort_order: 13, due_date: dayOffset(1), status: 'not_started' },
    { task_label: 'HR documentation review', category: 'documentation', phase: 'day_one', priority: 'high', is_required: true, sort_order: 14, due_date: dayOffset(2), status: 'not_started' },
    { task_label: 'Compliance & policies training', category: 'compliance', phase: 'day_one', priority: 'high', is_required: true, sort_order: 15, due_date: dayOffset(3), status: 'not_started' },
    { task_label: 'Benefits enrollment', category: 'finance', phase: 'day_one', priority: 'medium', is_required: true, sort_order: 16, due_date: dayOffset(5), status: 'not_started' },
    { task_label: 'Role-specific training', category: 'training', phase: 'day_one', priority: 'high', is_required: true, sort_order: 17, due_date: dayOffset(7), status: 'not_started' },
  ]

  const templateExtras: Record<string, CreateOnboardingData['tasks']> = {
    sales: [
      { task_label: 'CRM system training', category: 'training', phase: 'day_one', priority: 'critical', is_required: true, sort_order: 20, due_date: dayOffset(3), status: 'not_started' },
      { task_label: 'Sales process walkthrough', category: 'role_specific', phase: 'day_one', priority: 'high', is_required: true, sort_order: 21, due_date: dayOffset(5), status: 'not_started' },
      { task_label: 'Product/service knowledge session', category: 'training', phase: 'day_one', priority: 'high', is_required: true, sort_order: 22, due_date: dayOffset(7), status: 'not_started' },
      { task_label: 'Shadow experienced sales agent', category: 'role_specific', phase: 'day_one', priority: 'medium', is_required: false, sort_order: 23, due_date: dayOffset(10), status: 'not_started' },
    ],
    operations: [
      { task_label: 'Operations workflow training', category: 'role_specific', phase: 'day_one', priority: 'critical', is_required: true, sort_order: 20, due_date: dayOffset(3), status: 'not_started' },
      { task_label: 'Supplier management overview', category: 'role_specific', phase: 'day_one', priority: 'high', is_required: true, sort_order: 21, due_date: dayOffset(5), status: 'not_started' },
      { task_label: 'Quality assurance procedures', category: 'compliance', phase: 'day_one', priority: 'high', is_required: true, sort_order: 22, due_date: dayOffset(7), status: 'not_started' },
    ],
    finance: [
      { task_label: 'Accounting software training', category: 'training', phase: 'day_one', priority: 'critical', is_required: true, sort_order: 20, due_date: dayOffset(3), status: 'not_started' },
      { task_label: 'Financial policies review', category: 'compliance', phase: 'day_one', priority: 'high', is_required: true, sort_order: 21, due_date: dayOffset(5), status: 'not_started' },
      { task_label: 'Invoice & payment workflows', category: 'role_specific', phase: 'day_one', priority: 'high', is_required: true, sort_order: 22, due_date: dayOffset(7), status: 'not_started' },
    ],
    manager: [
      { task_label: 'Leadership framework overview', category: 'training', phase: 'day_one', priority: 'high', is_required: true, sort_order: 20, due_date: dayOffset(3), status: 'not_started' },
      { task_label: 'Meet direct reports', category: 'team_introduction', phase: 'day_one', priority: 'critical', is_required: true, sort_order: 21, due_date: dayOffset(2), status: 'not_started' },
      { task_label: 'Budget & resource overview', category: 'finance', phase: 'day_one', priority: 'high', is_required: true, sort_order: 22, due_date: dayOffset(5), status: 'not_started' },
      { task_label: 'Strategic objectives alignment', category: 'role_specific', phase: 'day_one', priority: 'high', is_required: true, sort_order: 23, due_date: dayOffset(7), status: 'not_started' },
    ],
  }

  const extras = templateExtras[template] || []
  return [...preBoardingTasks, ...baseTasks, ...extras]
}

// ============================================================================
// EXPORT
// ============================================================================

export function generateCSVExport(onboardings: OnboardingWithDetails[]): string {
  const headers = ['Employee', 'Department', 'Position', 'Status', 'Start Date', 'Progress %', 'Health Score', 'Total Tasks', 'Completed Tasks', 'Overdue Tasks']
  const rows = onboardings.map(o => {
    const total = o.tasks.length
    const done = o.tasks.filter(t => t.is_completed).length
    const overdue = o.tasks.filter(t => !t.is_completed && t.due_date && new Date(t.due_date) < new Date()).length
    const progress = total > 0 ? Math.round((done / total) * 100) : 0
    return [
      `${o.employee.first_name} ${o.employee.last_name}`,
      o.employee.department || '',
      o.employee.position || '',
      o.status,
      o.start_date || '',
      String(progress),
      String(o.health_score),
      String(total),
      String(done),
      String(overdue),
    ].join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}
