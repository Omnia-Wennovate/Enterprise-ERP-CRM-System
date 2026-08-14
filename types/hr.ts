import { z } from 'zod'

// ============================================================================
// EMPLOYEE TYPES
// ============================================================================

export interface EmployeeProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  gender?: string
  date_of_birth?: string
  nationality?: string
  marital_status?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  address?: string
  department?: string
  position?: string
  job_title?: string
  branch?: string
  manager_id?: string
  employee_id?: string
  employee_type: 'full_time' | 'part_time' | 'contractor' | 'intern'
  employment_status: 'active' | 'on_leave' | 'suspended' | 'terminated'
  date_joined?: string
  probation_end_date?: string
  contract_end_date?: string
  basic_salary: number
  allowances: number
  commission_eligible: boolean
  payroll_type: 'monthly' | 'bi_weekly' | 'weekly'
  avatar_url?: string
  is_active: boolean
  updated_at?: string
}

export interface EmployeeDocument {
  id: string
  employee_id: string
  document_type: string
  file_name: string
  file_url: string
  expiry_date?: string
  uploaded_by?: string
  created_at: string
}

// ============================================================================
// ATTENDANCE TYPES
// ============================================================================

export interface AttendanceRecord {
  id: string
  employee_id: string
  date: string
  clock_in?: string
  clock_out?: string
  total_hours?: number
  late_minutes: number
  early_leave_minutes: number
  overtime_minutes: number
  status: 'present' | 'late' | 'absent' | 'half_day' | 'remote' | 'holiday' | 'weekend' | 'leave'
  notes?: string
  approved_by?: string
  created_at: string
  updated_at: string
}

// ============================================================================
// LEAVE TYPES
// ============================================================================

export interface LeaveType {
  id: string
  name: string
  days_allowed: number
  is_paid: boolean
  is_active: boolean
  created_at: string
}

export interface LeaveBalance {
  id: string
  employee_id: string
  leave_type_id: string
  year: number
  allocated: number
  used: number
  remaining: number
}

export interface LeaveRequest {
  id: string
  employee_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  days_requested: number
  reason?: string
  status: 'pending' | 'manager_approved' | 'hr_approved' | 'rejected'
  manager_id?: string
  manager_approved_at?: string
  hr_approved_by?: string
  hr_approved_at?: string
  rejected_by?: string
  rejected_reason?: string
  created_at: string
  updated_at: string
}

// ============================================================================
// PAYROLL TYPES
// ============================================================================

export interface PayrollRecord {
  id: string
  employee_id: string
  period_month: number
  period_year: number
  basic_salary: number
  allowances: number
  bonuses: number
  commission_amount: number
  deductions: number
  tax: number
  net_salary: number
  status: 'draft' | 'approved' | 'paid'
  approved_by?: string
  paid_date?: string
  payslip_url?: string
  created_at: string
  updated_at: string
}

// ============================================================================
// PERFORMANCE TYPES
// ============================================================================

export interface PerformanceReview {
  id: string
  employee_id: string
  reviewer_id?: string
  period_month?: number
  period_year: number
  review_type: 'monthly' | 'quarterly' | 'annual'
  kpi_score?: number
  target_score?: number
  achievement_percent?: number
  manager_notes?: string
  employee_notes?: string
  status: 'pending' | 'submitted' | 'acknowledged'
  created_at: string
  updated_at: string
}

// ============================================================================
// RECRUITMENT TYPES
// ============================================================================

export interface JobPosition {
  id: string
  title: string
  department: string
  description?: string
  requirements?: string
  status: 'open' | 'closed' | 'on_hold'
  posted_by?: string
  created_at: string
}

export interface Applicant {
  id: string
  job_position_id?: string
  full_name: string
  email: string
  phone?: string
  resume_url?: string
  stage: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'
  notes?: string
  created_at: string
  updated_at: string
}

// ============================================================================
// ONBOARDING TYPES
// ============================================================================

export type OnboardingTaskCategory =
  | 'orientation' | 'it_systems' | 'documentation' | 'training'
  | 'compliance' | 'finance' | 'team_introduction' | 'workspace'
  | 'role_specific' | 'equipment' | 'account' | 'documents'

export type OnboardingTaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'overdue'
export type OnboardingTaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type OnboardingTaskPhase = 'pre_boarding' | 'day_one'
export type OnboardingStatus = 'active' | 'at_risk' | 'overdue' | 'blocked' | 'completed' | 'cancelled'

export interface OnboardingTask {
  id: string
  employee_id: string
  onboarding_id?: string
  task_label: string
  description?: string
  category: OnboardingTaskCategory
  responsible_person_id?: string
  due_date?: string
  priority: OnboardingTaskPriority
  status: OnboardingTaskStatus
  phase: OnboardingTaskPhase
  is_required: boolean
  is_completed: boolean
  sort_order: number
  notes?: string
  completed_by?: string
  completed_at?: string
  created_at: string
  updated_at?: string
  // Joined fields
  responsible_person?: { first_name: string; last_name: string; avatar_url?: string }
}

export interface Onboarding {
  id: string
  employee_id: string
  buddy_id?: string
  template: string
  status: OnboardingStatus
  health_score: number
  start_date?: string
  target_end_date?: string
  completed_at?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface OnboardingWithDetails extends Onboarding {
  employee: {
    id: string
    first_name: string
    last_name: string
    email: string
    department?: string
    position?: string
    date_joined?: string
    manager_id?: string
    avatar_url?: string
    employment_status: string
  }
  buddy?: {
    id: string
    first_name: string
    last_name: string
    avatar_url?: string
  }
  creator?: {
    first_name: string
    last_name: string
  }
  tasks: OnboardingTask[]
}

export interface OnboardingKPIs {
  activeCount: number
  completionRate: number
  dueThisWeek: number
  overdueTasks: number
  startingSoon: number
  completedThisMonth: number
  avgCompletionDays: number
  atRiskCount: number
}

export interface OnboardingHealthBreakdown {
  score: number
  taskCompletion: number
  overdueImpact: number
  blockedImpact: number
  deadlineProximity: number
  requiredCompletion: number
  recommendations: string[]
}

export interface CreateOnboardingData {
  employee_id: string
  buddy_id?: string
  template: string
  start_date: string
  target_end_date?: string
  created_by?: string
  tasks: Omit<OnboardingTask, 'id' | 'employee_id' | 'onboarding_id' | 'created_at' | 'updated_at' | 'is_completed' | 'completed_by' | 'completed_at' | 'responsible_person'>[]
}

export const ONBOARDING_TEMPLATES = [
  { value: 'standard', label: 'Standard Employee', icon: 'User' },
  { value: 'sales', label: 'Sales Agent', icon: 'TrendingUp' },
  { value: 'operations', label: 'Operations Officer', icon: 'Settings' },
  { value: 'finance', label: 'Finance Staff', icon: 'DollarSign' },
  { value: 'manager', label: 'Manager', icon: 'Users' },
  { value: 'custom', label: 'Custom', icon: 'Wrench' },
] as const

export const TASK_CATEGORIES: { value: OnboardingTaskCategory; label: string }[] = [
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

// ============================================================================
// ASSET TYPES
// ============================================================================

export interface Asset {
  id: string
  asset_type: string
  asset_name: string
  asset_code?: string
  barcode?: string
  qr_code?: string
  brand?: string
  model?: string
  category?: string
  purchase_date?: string
  purchase_price?: number
  supplier?: string
  warranty_expiry?: string
  department?: string
  current_location?: string
  serial_number?: string
  condition: 'good' | 'fair' | 'poor' | 'damaged' | 'excellent' | string
  status: 'available' | 'assigned' | 'maintenance' | 'damaged' | 'lost' | 'retired' | 'disposed' | string
  quantity: number
  available_quantity: number
  assigned_quantity: number
  is_assigned: boolean
  notes?: string
  attachments?: string[]
  photos?: string[]
  created_at: string
}

export interface AssetAssignment {
  id: string
  asset_id: string
  employee_id: string
  department?: string
  issued_date: string
  expected_return_date?: string
  return_date?: string
  condition_on_issue?: string
  condition_on_return?: string
  accessories_included?: string
  approval_status?: string
  digital_signature?: string
  damage_notes?: string
  missing_accessories?: string
  photos?: string[]
  return_signature?: string
  notes?: string
  created_at: string
}

export interface AssetMaintenance {
  id: string
  asset_id: string
  maintenance_type: string
  maintenance_date: string
  vendor?: string
  technician?: string
  cost?: number
  invoice_url?: string
  next_maintenance_date?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | string
  notes?: string
  attachments?: string[]
  created_at: string
  updated_at: string
}

export interface AssetTransfer {
  id: string
  asset_id: string
  transfer_date: string
  from_employee_id?: string
  to_employee_id?: string
  from_department?: string
  to_department?: string
  from_location?: string
  to_location?: string
  reason?: string
  status: string
  notes?: string
  created_by?: string
  created_at: string
}

// ============================================================================
// SHIFT TYPES
// ============================================================================

export interface Shift {
  id: string
  name: string
  start_time: string
  end_time: string
  is_recurring: boolean
  created_at: string
}

export interface ShiftAssignment {
  id: string
  employee_id: string
  shift_id: string
  date: string
  created_at: string
}

// ============================================================================
// TRAINING & LMS TYPES
// ============================================================================

export type CourseStatus = 'active' | 'draft' | 'archived'
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type CourseContentType = 'self_paced' | 'instructor_led' | 'blended' | 'workshop'
export type EnrollmentStatus = 'assigned' | 'in_progress' | 'completed' | 'expired' | 'dropped'
export type QuestionType = 'mcq' | 'true_false' | 'short_answer' | 'practical'
export type SessionType = 'workshop' | 'seminar' | 'exam' | 'webinar' | 'lab' | 'orientation'
export type CertificateStatus = 'active' | 'expired' | 'revoked' | 'renewed'
export type ExternalTrainingStatus = 'pending' | 'manager_approved' | 'finance_approved' | 'approved' | 'rejected' | 'completed'
export type RefresherStatus = 'pending' | 'confident' | 'needs_refresher' | 'expired'

export const COURSE_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'compliance', label: 'Compliance & Safety' },
  { value: 'technical', label: 'Technical Skills' },
  { value: 'sales', label: 'Sales & Revenue' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'operations', label: 'Operations' },
  { value: 'travel', label: 'Travel Industry' },
  { value: 'finance', label: 'Finance & Accounting' },
  { value: 'hr', label: 'HR & People' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'technology', label: 'Technology' },
  { value: 'onboarding', label: 'Onboarding' },
] as const

export const DEPARTMENTS = [
  'Sales', 'Operations', 'Finance', 'HR', 'Marketing', 'Technology', 'Management', 'Customer Service',
] as const

export interface TrainingCourse {
  id: string
  title: string
  description?: string
  duration_hours?: number
  expiry_months?: number
  category: string
  instructor_name?: string
  instructor_email?: string
  instructor_bio?: string
  department?: string
  difficulty: CourseDifficulty
  cover_image_url?: string
  tags: string[]
  is_mandatory: boolean
  is_active: boolean
  status: CourseStatus
  passing_score: number
  max_attempts: number
  content_type: CourseContentType
  objectives: string[]
  skills: string[]
  prerequisites: string[]
  rating: number
  rating_count: number
  enrollment_count: number
  completion_count: number
  total_modules: number
  estimated_hours?: number
  language: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface TrainingAssignment {
  id: string
  employee_id: string
  course_id: string
  assigned_date: string
  completed_date?: string
  certificate_url?: string
  expiry_date?: string
  status: EnrollmentStatus
  score?: number
  learning_hours: number
  progress_percent: number
  completed_modules: number
  started_at?: string
  last_accessed_at?: string
  notes?: string
  assigned_by?: string
  created_at: string
  updated_at: string
  // Joined
  course?: TrainingCourse
  employee?: EmployeeProfile
}

export interface TrainingModule {
  id: string
  course_id: string
  title: string
  description?: string
  content_type: 'text' | 'video' | 'pdf' | 'pptx' | 'docx' | 'image' | 'link' | 'external' | 'recording'
  content_url?: string
  content_text?: string
  duration_minutes: number
  sort_order: number
  is_required: boolean
  attachments: { name: string; url: string; type: string }[]
  created_at: string
  updated_at: string
}

export interface TrainingSession {
  id: string
  course_id?: string
  title: string
  description?: string
  session_type: SessionType
  instructor_name?: string
  location?: string
  meeting_link?: string
  start_time: string
  end_time: string
  max_attendees?: number
  current_attendees: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  department?: string
  is_recurring: boolean
  recurrence_rule?: string
  created_by?: string
  created_at: string
  updated_at: string
  // Joined
  course?: TrainingCourse
}

export interface TrainingSessionAttendee {
  id: string
  session_id: string
  employee_id: string
  status: 'registered' | 'confirmed' | 'cancelled'
  attended: boolean
  created_at: string
  employee?: EmployeeProfile
}

export interface TrainingQuiz {
  id: string
  course_id: string
  title: string
  description?: string
  passing_score: number
  max_attempts: number
  time_limit_minutes?: number
  is_active: boolean
  question_count: number
  sort_order: number
  created_at: string
  updated_at: string
  questions?: TrainingQuizQuestion[]
}

export interface TrainingQuizQuestion {
  id: string
  quiz_id: string
  question_type: QuestionType
  question_text: string
  options: { id: string; text: string }[]
  correct_answer: string
  explanation?: string
  points: number
  sort_order: number
  created_at: string
}

export interface TrainingQuizAttempt {
  id: string
  quiz_id: string
  employee_id: string
  score?: number
  total_points?: number
  passed: boolean
  answers: Record<string, string>
  started_at: string
  completed_at?: string
  time_spent_seconds?: number
  employee?: EmployeeProfile
}

export interface TrainingCertificate {
  id: string
  employee_id: string
  course_id: string
  assignment_id?: string
  certificate_number: string
  issued_at: string
  expires_at?: string
  renewal_required: boolean
  status: CertificateStatus
  pdf_url?: string
  created_at: string
  // Joined
  course?: TrainingCourse
  employee?: EmployeeProfile
}

export interface TrainingDiscussion {
  id: string
  course_id: string
  author_id: string
  parent_id?: string
  content: string
  attachments: { name: string; url: string }[]
  is_announcement: boolean
  is_pinned: boolean
  created_at: string
  updated_at: string
  // Joined
  author?: EmployeeProfile
  replies?: TrainingDiscussion[]
}

export interface LearningPath {
  id: string
  name: string
  description?: string
  department?: string
  position?: string
  is_mandatory: boolean
  is_active: boolean
  course_count: number
  created_by?: string
  created_at: string
  updated_at: string
  // Joined
  courses?: LearningPathCourse[]
}

export interface LearningPathCourse {
  id: string
  learning_path_id: string
  course_id: string
  sort_order: number
  course?: TrainingCourse
}

export interface EmployeeLearningPath {
  id: string
  employee_id: string
  learning_path_id: string
  current_course_index: number
  is_compliant: boolean
  completed_at?: string
  assigned_at: string
  // Joined
  learning_path?: LearningPath
  employee?: EmployeeProfile
}

export interface TrainingRefresherCheck {
  id: string
  employee_id: string
  course_id: string
  scheduled_for: string
  status: RefresherStatus
  response?: string
  responded_at?: string
  created_at: string
  course?: TrainingCourse
}

export interface LeaderboardEntry {
  employee_id: string
  employee_name: string
  department: string
  avatar_url?: string
  learning_hours: number
  courses_completed: number
  certificates_earned: number
  avg_score: number
  rank: number
}

export interface ExternalTrainingRequest {
  id: string
  employee_id: string
  course_name: string
  provider?: string
  cost: number
  start_date?: string
  end_date?: string
  justification?: string
  reference_link?: string
  status: ExternalTrainingStatus
  approved_by?: string
  approved_at?: string
  linked_expense_id?: string
  certificate_url?: string
  notes?: string
  created_at: string
  updated_at: string
  employee?: EmployeeProfile
}

export interface TrainingKPIs {
  totalCourses: number
  activeCourses: number
  totalEnrollments: number
  completionRate: number
  certificatesIssued: number
  overdueTraining: number
  upcomingSessions: number
  avgAssessmentScore: number
  expiringCerts: number
  nonCompliantEmployees: number
}

export interface TrainingFilters {
  search: string
  status: string
  category: string
  department: string
  difficulty: string
  mandatory: string
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export interface AuditLog {
  id: string
  action: string
  table_name: string
  record_id?: string
  performed_by?: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  created_at: string
}

// ============================================================================
// FORM VALIDATION SCHEMAS
// ============================================================================

export const EmployeeFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  position: z.string().min(1, 'Position is required'),
  job_title: z.string().optional(),
  basic_salary: z.number().min(0),
  allowances: z.number().min(0).default(0),
  commission_eligible: z.boolean().default(false),
  employee_type: z.enum(['full_time', 'part_time', 'contractor', 'intern']),
  date_joined: z.string(),
})

export const AttendanceFormSchema = z.object({
  date: z.string(),
  clock_in: z.string().optional(),
  clock_out: z.string().optional(),
  status: z.enum(['present', 'late', 'absent', 'half_day', 'remote', 'holiday', 'weekend', 'leave']),
  notes: z.string().optional(),
})

export const LeaveRequestSchema = z.object({
  leave_type_id: z.string().min(1, 'Leave type is required'),
  start_date: z.string(),
  end_date: z.string(),
  reason: z.string().optional(),
})

export const PayrollSchema = z.object({
  period_month: z.number().min(1).max(12),
  period_year: z.number(),
  bonuses: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
})

export type EmployeeFormInput = z.infer<typeof EmployeeFormSchema>
export type AttendanceFormInput = z.infer<typeof AttendanceFormSchema>
export type LeaveRequestInput = z.infer<typeof LeaveRequestSchema>
export type PayrollInput = z.infer<typeof PayrollSchema>
