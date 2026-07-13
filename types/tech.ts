import { z } from 'zod'

// ============================================================================
// PROJECT TYPES
// ============================================================================

export type ProjectStatus = 'planning' | 'development' | 'testing' | 'review' | 'deployment' | 'completed' | 'archived'
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical'
export type ProjectRiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type ProjectHealthIndicator = 'on_track' | 'at_risk' | 'delayed' | 'blocked'
export type ProjectMemberRole = 'developer' | 'qa_engineer' | 'technical_lead' | 'devops_engineer' | 'project_manager'
export type SprintStatus = 'planned' | 'active' | 'completed'
export type ProjectTaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

export interface Project {
  id: string
  name: string
  description?: string
  owner_id?: string
  priority: ProjectPriority
  status: ProjectStatus
  progress_percent: number
  start_date?: string
  deadline?: string
  budget: number
  risk_level: ProjectRiskLevel
  health_indicator: ProjectHealthIndicator
  created_by?: string
  created_at: string
  updated_at: string
  // Joined fields
  owner_name?: string
  created_by_name?: string
  member_count?: number
  task_count?: number
}

export interface ProjectMember {
  id: string
  project_id: string
  profile_id: string
  role: ProjectMemberRole
  assigned_at: string
  // Joined fields
  first_name?: string
  last_name?: string
  email?: string
  avatar_url?: string
  position?: string
  workload_score?: number
}

export interface ProjectMilestone {
  id: string
  project_id: string
  title: string
  due_date?: string
  is_completed: boolean
  completed_at?: string
  sort_order: number
}

export interface ProjectSprint {
  id: string
  project_id: string
  sprint_name: string
  start_date: string
  end_date: string
  status: SprintStatus
  created_at: string
  // Computed
  task_count?: number
  completed_task_count?: number
}

export interface ProjectTask {
  id: string
  project_id: string
  sprint_id?: string
  title: string
  description?: string
  assigned_to?: string
  status: ProjectTaskStatus
  priority: ProjectPriority
  due_date?: string
  source_feature_request_id?: string
  created_at: string
  updated_at: string
  // Joined fields
  assigned_to_name?: string
  sprint_name?: string
  project_name?: string
}

export interface ProjectAttachment {
  id: string
  project_id: string
  file_name: string
  file_url: string
  uploaded_by?: string
  created_at: string
  uploaded_by_name?: string
}

export interface ProjectComment {
  id: string
  project_id: string
  author_id?: string
  content: string
  created_at: string
  author_name?: string
  author_avatar?: string
}

export interface ProjectActivityLog {
  id: string
  project_id: string
  action: string
  performed_by?: string
  details?: Record<string, any>
  created_at: string
  performed_by_name?: string
}

// ============================================================================
// FEATURE REQUEST TYPES
// ============================================================================

export type FeatureRequestStatus = 'requested' | 'approved' | 'development' | 'testing' | 'completed' | 'rejected'
export type FeatureRequestPriority = 'low' | 'medium' | 'high' | 'critical'
export type RequestingDepartment = 'sales' | 'finance' | 'hr' | 'operations' | 'marketing' | 'management'

export interface FeatureRequest {
  id: string
  title: string
  description?: string
  department: string
  priority: FeatureRequestPriority
  requested_by?: string
  assigned_developer?: string
  due_date?: string
  status: FeatureRequestStatus
  estimated_effort?: string
  business_impact?: string
  requested_date?: string
  approved_by?: string
  completion_percent: number
  notes?: string
  converted_project_id?: string
  conversation_id?: string
  created_at: string
  updated_at: string
  // Joined fields
  requested_by_name?: string
  assigned_developer_name?: string
  approved_by_name?: string
}

export interface FeatureRequestAttachment {
  id: string
  feature_request_id: string
  file_name: string
  file_url: string
  uploaded_by?: string
  created_at: string
  uploaded_by_name?: string
}

export interface FeatureRequestComment {
  id: string
  feature_request_id: string
  author_id?: string
  content: string
  created_at: string
  author_name?: string
  author_avatar?: string
}

// ============================================================================
// TECH AUDIT LOG
// ============================================================================

export interface TechAuditLog {
  id: string
  action: string
  table_name: string
  record_id?: string
  performed_by?: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  created_at: string
  performed_by_name?: string
}

// ============================================================================
// WORKLOAD TYPES
// ============================================================================

export type WorkloadLevel = 'available' | 'busy' | 'overloaded'

export interface WorkloadScore {
  profile_id: string
  first_name: string
  last_name: string
  position: string
  active_tasks: number
  active_feature_requests: number
  total_items: number
  level: WorkloadLevel
  color: string
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export interface TechDashboardStats {
  activeProjects: number
  projectsNearDeadline: number
  delayedProjects: number
  completedProjects: number
  totalRequests: number
  pendingApproval: number
  inDevelopment: number
  completedRequests: number
  rejectedRequests: number
  teamSize: number
}

// ============================================================================
// FORM VALIDATION SCHEMAS
// ============================================================================

export const ProjectFormSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  owner_id: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['planning', 'development', 'testing', 'review', 'deployment', 'completed', 'archived']).default('planning'),
  start_date: z.string().optional(),
  deadline: z.string().optional(),
  budget: z.number().min(0).default(0),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
})

export const ProjectTaskFormSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  due_date: z.string().optional(),
  sprint_id: z.string().optional(),
})

export const MilestoneFormSchema = z.object({
  title: z.string().min(1, 'Milestone title is required'),
  due_date: z.string().optional(),
  sort_order: z.number().min(0).default(0),
})

export const SprintFormSchema = z.object({
  sprint_name: z.string().min(1, 'Sprint name is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  status: z.enum(['planned', 'active', 'completed']).default('planned'),
})

export const FeatureRequestFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  due_date: z.string().optional(),
  estimated_effort: z.string().optional(),
  business_impact: z.string().optional(),
  notes: z.string().optional(),
})

export type ProjectFormInput = z.infer<typeof ProjectFormSchema>
export type ProjectTaskFormInput = z.infer<typeof ProjectTaskFormSchema>
export type MilestoneFormInput = z.infer<typeof MilestoneFormSchema>
export type SprintFormInput = z.infer<typeof SprintFormSchema>
export type FeatureRequestFormInput = z.infer<typeof FeatureRequestFormSchema>

// ============================================================================
// STATUS / PRIORITY LABEL MAPS
// ============================================================================

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planning',
  development: 'Development',
  testing: 'Testing',
  review: 'Review',
  deployment: 'Deployment',
  completed: 'Completed',
  archived: 'Archived',
}

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: '#6366F1',
  development: '#3B82F6',
  testing: '#F59E0B',
  review: '#8B5CF6',
  deployment: '#0A8FA8',
  completed: '#10B981',
  archived: '#6B7280',
}

export const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const PRIORITY_COLORS: Record<ProjectPriority, string> = {
  low: '#6B7280',
  medium: '#3B82F6',
  high: '#F59E0B',
  critical: '#EF4444',
}

export const TASK_STATUS_LABELS: Record<ProjectTaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
}

export const TASK_STATUS_COLORS: Record<ProjectTaskStatus, string> = {
  todo: '#6B7280',
  in_progress: '#3B82F6',
  review: '#8B5CF6',
  done: '#10B981',
}

export const FR_STATUS_LABELS: Record<FeatureRequestStatus, string> = {
  requested: 'Requested',
  approved: 'Approved',
  development: 'In Development',
  testing: 'Testing',
  completed: 'Completed',
  rejected: 'Rejected',
}

export const FR_STATUS_COLORS: Record<FeatureRequestStatus, string> = {
  requested: '#F59E0B',
  approved: '#3B82F6',
  development: '#8B5CF6',
  testing: '#0A8FA8',
  completed: '#10B981',
  rejected: '#EF4444',
}

export const HEALTH_LABELS: Record<ProjectHealthIndicator, string> = {
  on_track: 'On Track',
  at_risk: 'At Risk',
  delayed: 'Delayed',
  blocked: 'Blocked',
}

export const HEALTH_COLORS: Record<ProjectHealthIndicator, string> = {
  on_track: '#10B981',
  at_risk: '#F59E0B',
  delayed: '#EF4444',
  blocked: '#6B7280',
}

export const RISK_LABELS: Record<ProjectRiskLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const MEMBER_ROLE_LABELS: Record<ProjectMemberRole, string> = {
  developer: 'Developer',
  qa_engineer: 'QA Engineer',
  technical_lead: 'Technical Lead',
  devops_engineer: 'DevOps Engineer',
  project_manager: 'Project Manager',
}

export const DEPARTMENT_LABELS: Record<string, string> = {
  sales: 'Sales',
  finance: 'Finance',
  hr: 'HR',
  operations: 'Operations',
  marketing: 'Marketing',
  management: 'Management',
  technology: 'Technology',
}
