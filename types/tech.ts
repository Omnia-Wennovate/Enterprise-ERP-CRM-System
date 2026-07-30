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

// ============================================================================
// PROJECT ARCHIVE & DEPLOYMENT REPOSITORY TYPES
// ============================================================================

export type RepositoryVisibility = 'private' | 'public' | 'archived'
export type RepositoryStatus = 'active' | 'completed' | 'maintenance' | 'deprecated'
export type HostingPlatform = 'vercel' | 'netlify' | 'firebase' | 'aws' | 'azure' | 'digitalocean' | 'render' | 'railway' | 'other'
export type SSLStatus = 'active' | 'expired' | 'pending' | 'none'
export type DeploymentEnvironment = 'production' | 'staging' | 'development' | 'testing'
export type DeploymentStatus = 'active' | 'inactive' | 'failed' | 'rollback'
export type CredentialType = 'github_token' | 'database_password' | 'server_password' | 'api_key' | 'smtp' | 'firebase' | 'supabase' | 'cloudflare' | 'vercel' | 'aws' | 'ssh_key'
export type DocumentType = 'srs' | 'design_document' | 'api_documentation' | 'architecture_diagram' | 'database_erd' | 'deployment_guide' | 'runbook' | 'testing_report' | 'release_notes' | 'user_manual' | 'technical_documentation' | 'meeting_notes' | 'support_document'
export type MaintenanceType = 'maintenance' | 'bug_fix' | 'security_update' | 'version_upgrade' | 'feature_enhancement' | 'hotfix'
export type MaintenanceStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'
export type KnowledgeBaseEntryType = 'lessons_learned' | 'known_issues' | 'future_improvements' | 'technical_debt' | 'performance_notes' | 'architecture_decisions' | 'dependencies' | 'maintenance_instructions' | 'support_notes' | 'faq'
export type ProjectHealthLevel = 'healthy' | 'attention' | 'critical'
export type ReleaseDeploymentStatus = 'success' | 'failed' | 'rolled_back' | 'in_progress'

// ============================================================================
// PROJECT REPOSITORY
// ============================================================================

export interface ProjectRepository {
  id: string
  project_id: string
  repository_name: string
  github_url?: string
  organization?: string
  default_branch: string
  latest_commit?: string
  visibility: RepositoryVisibility
  repository_status: RepositoryStatus
  // Project metadata
  client?: string
  department?: string
  technologies_used?: string[]
  framework?: string
  database_type?: string
  hosting_provider?: string
  domain?: string
  production_url?: string
  staging_url?: string
  // Admin access references
  system_administrator?: string
  deployment_owner?: string
  technical_lead_username?: string
  github_username?: string
  server_username?: string
  database_username?: string
  api_owner?: string
  support_contact?: string
  created_at: string
  updated_at: string
  // Joined
  project_name?: string
}

// ============================================================================
// PROJECT DEPLOYMENT
// ============================================================================

export interface ProjectDeployment {
  id: string
  project_id: string
  hosting_platform: HostingPlatform
  server_ip?: string
  deployment_url?: string
  production_url?: string
  staging_url?: string
  domain?: string
  ssl_status: SSLStatus
  deployment_date?: string
  latest_deployment?: string
  deployment_notes?: string
  version?: string
  release_number?: string
  environment: DeploymentEnvironment
  deployment_status: DeploymentStatus
  created_by?: string
  created_at: string
  updated_at: string
  // Joined
  project_name?: string
  created_by_name?: string
}

// ============================================================================
// PROJECT CREDENTIAL (Vault)
// ============================================================================

export interface ProjectCredential {
  id: string
  project_id: string
  credential_name: string
  credential_type: CredentialType
  username?: string
  // encrypted_secret is never sent to client — only metadata
  environment: DeploymentEnvironment
  created_by?: string
  last_updated_by?: string
  expiry_date?: string
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
  // Joined
  project_name?: string
  created_by_name?: string
}

export interface CredentialAccessLog {
  id: string
  credential_id: string
  accessed_by: string
  action: string
  ip_address?: string
  user_agent?: string
  created_at: string
  // Joined
  accessed_by_name?: string
  credential_name?: string
}

// ============================================================================
// PROJECT DOCUMENT
// ============================================================================

export interface ProjectDocument {
  id: string
  project_id: string
  document_name: string
  document_type: DocumentType
  file_url: string
  file_size?: number
  mime_type?: string
  version: string
  description?: string
  uploaded_by?: string
  created_at: string
  updated_at: string
  // Joined
  uploaded_by_name?: string
  project_name?: string
}

// ============================================================================
// PROJECT RELEASE
// ============================================================================

export interface ProjectRelease {
  id: string
  project_id: string
  release_version: string
  release_date: string
  developer_id?: string
  environment: DeploymentEnvironment
  bug_fixes?: string
  features?: string
  breaking_changes?: string
  rollback_available: boolean
  deployment_status: ReleaseDeploymentStatus
  release_notes?: string
  created_at: string
  // Joined
  developer_name?: string
  project_name?: string
}

// ============================================================================
// PROJECT KNOWLEDGE BASE
// ============================================================================

export interface ProjectKnowledgeBaseEntry {
  id: string
  project_id: string
  entry_type: KnowledgeBaseEntryType
  title: string
  content: string
  severity: 'info' | 'warning' | 'critical'
  author_id?: string
  is_resolved: boolean
  created_at: string
  updated_at: string
  // Joined
  author_name?: string
  project_name?: string
}

// ============================================================================
// PROJECT MAINTENANCE REQUEST
// ============================================================================

export interface ProjectMaintenanceRequest {
  id: string
  project_id: string
  maintenance_type: MaintenanceType
  title: string
  description?: string
  developer_id?: string
  requested_by?: string
  reason?: string
  time_spent_hours: number
  status: MaintenanceStatus
  priority: ProjectPriority
  completed_at?: string
  created_at: string
  updated_at: string
  // Joined
  developer_name?: string
  requested_by_name?: string
  project_name?: string
}

// ============================================================================
// PROJECT HEALTH SCORE
// ============================================================================

export interface ProjectHealthScore {
  project_id: string
  repository_activity: ProjectHealthLevel
  deployment_health: ProjectHealthLevel
  bug_count: number
  open_tasks: number
  maintenance_status: ProjectHealthLevel
  documentation_score: ProjectHealthLevel
  security_status: ProjectHealthLevel
  overall_health: ProjectHealthLevel
}

// ============================================================================
// PROJECT TIMELINE EVENT
// ============================================================================

export interface ProjectTimelineEvent {
  id: string
  project_id: string
  event_type: string    // created, planning, development, testing, deployment, production, maintenance, archived, status_change, member_added, release, etc.
  title: string
  description?: string
  performed_by?: string
  performed_by_name?: string
  created_at: string
}

// ============================================================================
// ARCHIVE ANALYTICS
// ============================================================================

export interface ArchiveAnalytics {
  completedProjects: number
  archivedProjects: number
  maintenanceProjects: number
  mostUsedTechnologies: { name: string; count: number }[]
  averageCompletionDays: number
  averageBudget: number
  deploymentSuccessRate: number
  openBugs: number
  technicalDebtScore: number
  repositoryHealth: number
}

// ============================================================================
// ARCHIVE FORM SCHEMAS
// ============================================================================

export const RepositoryFormSchema = z.object({
  repository_name: z.string().min(1, 'Repository name is required'),
  github_url: z.string().optional(),
  organization: z.string().optional(),
  default_branch: z.string().default('main'),
  visibility: z.enum(['private', 'public', 'archived']).default('private'),
  repository_status: z.enum(['active', 'completed', 'maintenance', 'deprecated']).default('active'),
  client: z.string().optional(),
  department: z.string().optional(),
  technologies_used: z.array(z.string()).optional(),
  framework: z.string().optional(),
  database_type: z.string().optional(),
  hosting_provider: z.string().optional(),
  domain: z.string().optional(),
  production_url: z.string().optional(),
  staging_url: z.string().optional(),
  system_administrator: z.string().optional(),
  deployment_owner: z.string().optional(),
  technical_lead_username: z.string().optional(),
  github_username: z.string().optional(),
  server_username: z.string().optional(),
  database_username: z.string().optional(),
  api_owner: z.string().optional(),
  support_contact: z.string().optional(),
})

export const DeploymentFormSchema = z.object({
  hosting_platform: z.enum(['vercel', 'netlify', 'firebase', 'aws', 'azure', 'digitalocean', 'render', 'railway', 'other']),
  server_ip: z.string().optional(),
  deployment_url: z.string().optional(),
  production_url: z.string().optional(),
  staging_url: z.string().optional(),
  domain: z.string().optional(),
  ssl_status: z.enum(['active', 'expired', 'pending', 'none']).default('active'),
  deployment_notes: z.string().optional(),
  version: z.string().optional(),
  release_number: z.string().optional(),
  environment: z.enum(['production', 'staging', 'development', 'testing']).default('production'),
})

export const CredentialFormSchema = z.object({
  credential_name: z.string().min(1, 'Credential name is required'),
  credential_type: z.enum(['github_token', 'database_password', 'server_password', 'api_key', 'smtp', 'firebase', 'supabase', 'cloudflare', 'vercel', 'aws', 'ssh_key']),
  username: z.string().optional(),
  secret: z.string().min(1, 'Secret is required'),
  environment: z.enum(['production', 'staging', 'development']).default('production'),
  expiry_date: z.string().optional(),
  notes: z.string().optional(),
})

export const DocumentFormSchema = z.object({
  document_name: z.string().min(1, 'Document name is required'),
  document_type: z.enum(['srs', 'design_document', 'api_documentation', 'architecture_diagram', 'database_erd', 'deployment_guide', 'runbook', 'testing_report', 'release_notes', 'user_manual', 'technical_documentation', 'meeting_notes', 'support_document']),
  description: z.string().optional(),
  version: z.string().default('1.0'),
})

export const ReleaseFormSchema = z.object({
  release_version: z.string().min(1, 'Version is required'),
  environment: z.enum(['production', 'staging', 'development', 'testing']).default('production'),
  bug_fixes: z.string().optional(),
  features: z.string().optional(),
  breaking_changes: z.string().optional(),
  rollback_available: z.boolean().default(true),
  release_notes: z.string().optional(),
})

export const KnowledgeBaseFormSchema = z.object({
  entry_type: z.enum(['lessons_learned', 'known_issues', 'future_improvements', 'technical_debt', 'performance_notes', 'architecture_decisions', 'dependencies', 'maintenance_instructions', 'support_notes', 'faq']),
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  severity: z.enum(['info', 'warning', 'critical']).default('info'),
})

export const MaintenanceFormSchema = z.object({
  maintenance_type: z.enum(['maintenance', 'bug_fix', 'security_update', 'version_upgrade', 'feature_enhancement', 'hotfix']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  reason: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
})

export type RepositoryFormInput = z.infer<typeof RepositoryFormSchema>
export type DeploymentFormInput = z.infer<typeof DeploymentFormSchema>
export type CredentialFormInput = z.infer<typeof CredentialFormSchema>
export type DocumentFormInput = z.infer<typeof DocumentFormSchema>
export type ReleaseFormInput = z.infer<typeof ReleaseFormSchema>
export type KnowledgeBaseFormInput = z.infer<typeof KnowledgeBaseFormSchema>
export type MaintenanceFormInput = z.infer<typeof MaintenanceFormSchema>

// ============================================================================
// ARCHIVE LABEL / COLOR MAPS
// ============================================================================

export const REPOSITORY_VISIBILITY_LABELS: Record<RepositoryVisibility, string> = {
  private: 'Private',
  public: 'Public',
  archived: 'Archived',
}

export const REPOSITORY_STATUS_LABELS: Record<RepositoryStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  maintenance: 'Maintenance',
  deprecated: 'Deprecated',
}

export const REPOSITORY_STATUS_COLORS: Record<RepositoryStatus, string> = {
  active: '#10B981',
  completed: '#3B82F6',
  maintenance: '#F59E0B',
  deprecated: '#EF4444',
}

export const HOSTING_PLATFORM_LABELS: Record<HostingPlatform, string> = {
  vercel: 'Vercel',
  netlify: 'Netlify',
  firebase: 'Firebase',
  aws: 'AWS',
  azure: 'Azure',
  digitalocean: 'DigitalOcean',
  render: 'Render',
  railway: 'Railway',
  other: 'Other',
}

export const CREDENTIAL_TYPE_LABELS: Record<CredentialType, string> = {
  github_token: 'GitHub Token',
  database_password: 'Database Password',
  server_password: 'Server Password',
  api_key: 'API Key',
  smtp: 'SMTP',
  firebase: 'Firebase',
  supabase: 'Supabase',
  cloudflare: 'Cloudflare',
  vercel: 'Vercel',
  aws: 'AWS',
  ssh_key: 'SSH Key',
}

export const CREDENTIAL_TYPE_COLORS: Record<CredentialType, string> = {
  github_token: '#171515',
  database_password: '#336791',
  server_password: '#6B7280',
  api_key: '#8B5CF6',
  smtp: '#F59E0B',
  firebase: '#FFCA28',
  supabase: '#3ECF8E',
  cloudflare: '#F48120',
  vercel: '#000000',
  aws: '#FF9900',
  ssh_key: '#0A8FA8',
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  srs: 'SRS',
  design_document: 'Design Document',
  api_documentation: 'API Documentation',
  architecture_diagram: 'Architecture Diagram',
  database_erd: 'Database ERD',
  deployment_guide: 'Deployment Guide',
  runbook: 'Runbook',
  testing_report: 'Testing Report',
  release_notes: 'Release Notes',
  user_manual: 'User Manual',
  technical_documentation: 'Technical Documentation',
  meeting_notes: 'Meeting Notes',
  support_document: 'Support Document',
}

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  maintenance: 'Maintenance',
  bug_fix: 'Bug Fix',
  security_update: 'Security Update',
  version_upgrade: 'Version Upgrade',
  feature_enhancement: 'Feature Enhancement',
  hotfix: 'Hotfix',
}

export const MAINTENANCE_TYPE_COLORS: Record<MaintenanceType, string> = {
  maintenance: '#3B82F6',
  bug_fix: '#EF4444',
  security_update: '#F59E0B',
  version_upgrade: '#8B5CF6',
  feature_enhancement: '#10B981',
  hotfix: '#DC2626',
}

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const MAINTENANCE_STATUS_COLORS: Record<MaintenanceStatus, string> = {
  open: '#F59E0B',
  in_progress: '#3B82F6',
  completed: '#10B981',
  cancelled: '#6B7280',
}

export const KB_ENTRY_TYPE_LABELS: Record<KnowledgeBaseEntryType, string> = {
  lessons_learned: 'Lessons Learned',
  known_issues: 'Known Issues',
  future_improvements: 'Future Improvements',
  technical_debt: 'Technical Debt',
  performance_notes: 'Performance Notes',
  architecture_decisions: 'Architecture Decisions',
  dependencies: 'Dependencies',
  maintenance_instructions: 'Maintenance Instructions',
  support_notes: 'Support Notes',
  faq: 'FAQ',
}

export const HEALTH_LEVEL_LABELS: Record<ProjectHealthLevel, string> = {
  healthy: '🟢 Healthy',
  attention: '🟡 Attention',
  critical: '🔴 Critical',
}

export const HEALTH_LEVEL_COLORS: Record<ProjectHealthLevel, string> = {
  healthy: '#10B981',
  attention: '#F59E0B',
  critical: '#EF4444',
}

export const DEPLOYMENT_ENV_LABELS: Record<DeploymentEnvironment, string> = {
  production: 'Production',
  staging: 'Staging',
  development: 'Development',
  testing: 'Testing',
}

export const DEPLOYMENT_ENV_COLORS: Record<DeploymentEnvironment, string> = {
  production: '#10B981',
  staging: '#F59E0B',
  development: '#3B82F6',
  testing: '#8B5CF6',
}

export const RELEASE_STATUS_LABELS: Record<ReleaseDeploymentStatus, string> = {
  success: 'Success',
  failed: 'Failed',
  rolled_back: 'Rolled Back',
  in_progress: 'In Progress',
}

export const RELEASE_STATUS_COLORS: Record<ReleaseDeploymentStatus, string> = {
  success: '#10B981',
  failed: '#EF4444',
  rolled_back: '#F59E0B',
  in_progress: '#3B82F6',
}
