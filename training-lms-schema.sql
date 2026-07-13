-- ============================================================================
-- TRAINING LMS SCHEMA UPGRADE
-- Run AFTER verifying training_courses and training_assignments exist
-- Uses ALTER TABLE to preserve existing data
-- ============================================================================

-- ============================================================================
-- 1. ALTER training_courses — Add enterprise LMS fields
-- ============================================================================

ALTER TABLE public.training_courses
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS instructor_name text,
  ADD COLUMN IF NOT EXISTS instructor_email text,
  ADD COLUMN IF NOT EXISTS instructor_bio text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_mandatory boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS passing_score integer DEFAULT 70,
  ADD COLUMN IF NOT EXISTS max_attempts integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'self_paced',
  ADD COLUMN IF NOT EXISTS objectives text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS prerequisites text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS enrollment_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_modules integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_hours numeric(6,1),
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_training_courses_category ON public.training_courses(category);
CREATE INDEX IF NOT EXISTS idx_training_courses_department ON public.training_courses(department);
CREATE INDEX IF NOT EXISTS idx_training_courses_status ON public.training_courses(status);
CREATE INDEX IF NOT EXISTS idx_training_courses_mandatory ON public.training_courses(is_mandatory) WHERE is_mandatory = true;

-- ============================================================================
-- 2. ALTER training_assignments — Add progress tracking
-- ============================================================================

ALTER TABLE public.training_assignments
  ADD COLUMN IF NOT EXISTS score numeric(5,2),
  ADD COLUMN IF NOT EXISTS learning_hours numeric(6,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS progress_percent integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_modules integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS assigned_by uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================================
-- 3. NEW TABLE: training_modules (course content)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content_type text NOT NULL DEFAULT 'text',
  content_url text,
  content_text text,
  duration_minutes integer DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_required boolean DEFAULT true,
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_modules_course ON public.training_modules(course_id);

-- ============================================================================
-- 4. NEW TABLE: training_sessions (calendar events)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.training_courses(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  session_type text NOT NULL DEFAULT 'workshop',
  instructor_name text,
  location text,
  meeting_link text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  max_attendees integer,
  current_attendees integer DEFAULT 0,
  status text DEFAULT 'scheduled',
  department text,
  is_recurring boolean DEFAULT false,
  recurrence_rule text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_sessions_course ON public.training_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON public.training_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON public.training_sessions(status);

-- ============================================================================
-- 5. NEW TABLE: training_session_attendees
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_session_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'registered',
  attended boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, employee_id)
);

-- ============================================================================
-- 6. NEW TABLE: training_quizzes
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  passing_score integer DEFAULT 70,
  max_attempts integer DEFAULT 3,
  time_limit_minutes integer,
  is_active boolean DEFAULT true,
  question_count integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_quizzes_course ON public.training_quizzes(course_id);

-- ============================================================================
-- 7. NEW TABLE: training_quiz_questions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.training_quizzes(id) ON DELETE CASCADE,
  question_type text NOT NULL DEFAULT 'mcq',
  question_text text NOT NULL,
  options jsonb DEFAULT '[]',
  correct_answer text NOT NULL,
  explanation text,
  points integer DEFAULT 1,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_quiz_questions_quiz ON public.training_quiz_questions(quiz_id);

-- ============================================================================
-- 8. NEW TABLE: training_quiz_attempts
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.training_quizzes(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score numeric(5,2),
  total_points integer,
  passed boolean DEFAULT false,
  answers jsonb DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  time_spent_seconds integer
);

CREATE INDEX IF NOT EXISTS idx_training_quiz_attempts_quiz ON public.training_quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_training_quiz_attempts_employee ON public.training_quiz_attempts(employee_id);

-- ============================================================================
-- 9. NEW TABLE: training_certificates
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES public.training_assignments(id) ON DELETE SET NULL,
  certificate_number text UNIQUE NOT NULL,
  issued_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  renewal_required boolean DEFAULT false,
  status text DEFAULT 'active',
  pdf_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_certificates_employee ON public.training_certificates(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_certificates_course ON public.training_certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_training_certificates_status ON public.training_certificates(status);

-- ============================================================================
-- 10. NEW TABLE: training_discussions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.training_discussions(id) ON DELETE CASCADE,
  content text NOT NULL,
  attachments jsonb DEFAULT '[]',
  is_announcement boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_discussions_course ON public.training_discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_training_discussions_author ON public.training_discussions(author_id);

-- ============================================================================
-- 11. NEW TABLE: learning_paths
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  department text,
  position text,
  is_mandatory boolean DEFAULT true,
  is_active boolean DEFAULT true,
  course_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_paths_department ON public.learning_paths(department);

-- ============================================================================
-- 12. NEW TABLE: learning_path_courses
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.learning_path_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE(learning_path_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_path_courses_path ON public.learning_path_courses(learning_path_id);

-- ============================================================================
-- 13. NEW TABLE: employee_learning_paths
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.employee_learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  learning_path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  current_course_index integer DEFAULT 0,
  is_compliant boolean DEFAULT false,
  completed_at timestamptz,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, learning_path_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_learning_paths_employee ON public.employee_learning_paths(employee_id);

-- ============================================================================
-- 14. NEW TABLE: training_refresher_checks
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_refresher_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  response text,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresher_checks_employee ON public.training_refresher_checks(employee_id);
CREATE INDEX IF NOT EXISTS idx_refresher_checks_status ON public.training_refresher_checks(status);

-- ============================================================================
-- 15. NEW TABLE: learning_leaderboard_opt_out
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.learning_leaderboard_opt_out (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  opted_out boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 16. NEW TABLE: external_training_requests
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.external_training_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_name text NOT NULL,
  provider text,
  cost numeric(12,2) DEFAULT 0,
  start_date date,
  end_date date,
  justification text,
  reference_link text,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES public.profiles(id),
  approved_at timestamptz,
  linked_expense_id uuid REFERENCES public.expenses(id) ON DELETE SET NULL,
  certificate_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_training_employee ON public.external_training_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_external_training_status ON public.external_training_requests(status);

-- ============================================================================
-- 17. ENABLE RLS ON ALL NEW TABLES
-- ============================================================================

ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_session_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_refresher_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_leaderboard_opt_out ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_training_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 18. RLS POLICIES — permissive (matching existing HR pattern)
-- ============================================================================

CREATE POLICY "training_modules_policy" ON public.training_modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "training_sessions_policy" ON public.training_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "training_session_attendees_policy" ON public.training_session_attendees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "training_quizzes_policy" ON public.training_quizzes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "training_quiz_questions_policy" ON public.training_quiz_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "training_quiz_attempts_policy" ON public.training_quiz_attempts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "training_certificates_policy" ON public.training_certificates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "training_discussions_policy" ON public.training_discussions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "learning_paths_policy" ON public.learning_paths FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "learning_path_courses_policy" ON public.learning_path_courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "employee_learning_paths_policy" ON public.employee_learning_paths FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "training_refresher_checks_policy" ON public.training_refresher_checks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "learning_leaderboard_opt_out_policy" ON public.learning_leaderboard_opt_out FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "external_training_requests_policy" ON public.external_training_requests FOR ALL USING (true) WITH CHECK (true);
