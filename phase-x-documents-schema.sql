-- ============================================================================
-- PHASE X — Enterprise Travel Document Management Center
-- Migration Script — Run in Supabase SQL Editor
-- Safe to run multiple times (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- ============================================================================

-- ── 1. EXTEND existing documents table ───────────────────────────────────────

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS document_type   text DEFAULT 'other';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS document_name   text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'draft';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS country         text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_type       text DEFAULT 'other';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_mime       text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS ai_extracted_data jsonb;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS ai_confidence   text DEFAULT 'unverified';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS legal_hold      boolean DEFAULT false;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS archive_after_date date;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS updated_at      timestamptz DEFAULT now();
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS updated_by      uuid REFERENCES public.profiles(id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS notes           text;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS shared_with     text[];
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS download_count  integer DEFAULT 0;

-- Back-fill document_name from file_name where null
UPDATE public.documents SET document_name = file_name WHERE document_name IS NULL;

-- ── 2. EXTEND existing document_versions table ────────────────────────────────

ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS reason_for_change   text;
ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS previous_version_id uuid REFERENCES public.document_versions(id);
ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS file_name           text;
ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS file_size_kb        integer;

-- ── 3. NEW TABLE: document_comments ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.document_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  author_id   uuid REFERENCES public.profiles(id),
  content     text NOT NULL,
  comment_type text DEFAULT 'comment', -- comment | internal_note | approval_note | rejection_note
  mentions    text[],
  is_edited   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_comments_document ON public.document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_author  ON public.document_comments(author_id);

-- ── 4. NEW TABLE: document_access_log ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.document_access_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  accessed_by uuid REFERENCES public.profiles(id),
  action      text NOT NULL,   -- view | download | print | share | replace | approve | reject | archive
  ip_address  text,
  device_info text,
  booking_id  uuid REFERENCES public.bookings(id),
  notes       text,
  accessed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_log_document   ON public.document_access_log(document_id);
CREATE INDEX IF NOT EXISTS idx_access_log_user       ON public.document_access_log(accessed_by);
CREATE INDEX IF NOT EXISTS idx_access_log_booking    ON public.document_access_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_access_log_accessed_at ON public.document_access_log(accessed_at DESC);

-- ── 5. NEW TABLE: booking_readiness_overrides ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.booking_readiness_overrides (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  overridden_by     uuid REFERENCES public.profiles(id),
  target_status     text NOT NULL,
  missing_documents text[],
  reason            text NOT NULL,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_readiness_overrides_booking ON public.booking_readiness_overrides(booking_id);

-- ── 6. NEW TABLE: document_reminders ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.document_reminders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  document_type text,          -- which doc type is missing
  days_before  integer NOT NULL, -- 60, 30, 14, 7
  due_fire_at  date NOT NULL,
  fired_at     timestamptz,    -- null = not yet sent
  sent_to      text[],         -- customer email + agent email
  escalated    boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_reminders_booking     ON public.document_reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_doc_reminders_fire_date  ON public.document_reminders(due_fire_at);

-- ── 7. NEW TABLE: document_system_settings ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.document_system_settings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key  text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  description  text,
  updated_by   uuid REFERENCES public.profiles(id),
  updated_at   timestamptz DEFAULT now()
);

-- Default retention policy: 365 days after return_date
INSERT INTO public.document_system_settings (setting_key, setting_value, description)
VALUES ('document_retention_days', '365', 'Number of days after booking return_date before documents are auto-archived')
ON CONFLICT (setting_key) DO NOTHING;

-- ── 8. RLS POLICIES ───────────────────────────────────────────────────────────

-- document_comments
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Operations full access to comments" ON public.document_comments;
CREATE POLICY "Operations full access to comments" ON public.document_comments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin','admin','operations'))
  );

DROP POLICY IF EXISTS "Sales Agent read own booking comments" ON public.document_comments;
CREATE POLICY "Sales Agent read own booking comments" ON public.document_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      JOIN public.bookings b ON b.id = d.booking_id
      WHERE d.id = document_comments.document_id
        AND b.assigned_to = auth.uid()::text
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'sales_agent')
    )
  );

-- document_access_log
ALTER TABLE public.document_access_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Operations full access to access log" ON public.document_access_log;
CREATE POLICY "Operations full access to access log" ON public.document_access_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin','admin','operations'))
  );

-- booking_readiness_overrides
ALTER TABLE public.booking_readiness_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to overrides" ON public.booking_readiness_overrides;
CREATE POLICY "Admin full access to overrides" ON public.booking_readiness_overrides
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin','admin'))
  );

DROP POLICY IF EXISTS "Operations read overrides" ON public.booking_readiness_overrides;
CREATE POLICY "Operations read overrides" ON public.booking_readiness_overrides
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'operations')
  );

-- document_reminders
ALTER TABLE public.document_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Operations full access to reminders" ON public.document_reminders;
CREATE POLICY "Operations full access to reminders" ON public.document_reminders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin','admin','operations'))
  );

-- document_system_settings
ALTER TABLE public.document_system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages system settings" ON public.document_system_settings;
CREATE POLICY "Admin manages system settings" ON public.document_system_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin','admin'))
  );

DROP POLICY IF EXISTS "Operations reads system settings" ON public.document_system_settings;
CREATE POLICY "Operations reads system settings" ON public.document_system_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin','admin','operations'))
  );

-- ── 9. INDEXES on documents for search performance ────────────────────────────

CREATE INDEX IF NOT EXISTS idx_documents_booking        ON public.documents(booking_id);
CREATE INDEX IF NOT EXISTS idx_documents_traveler       ON public.documents(traveler_id);
CREATE INDEX IF NOT EXISTS idx_documents_type           ON public.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_approval_status ON public.documents(approval_status);
CREATE INDEX IF NOT EXISTS idx_documents_expiry         ON public.documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_documents_legal_hold     ON public.documents(legal_hold);
CREATE INDEX IF NOT EXISTS idx_documents_archive_after  ON public.documents(archive_after_date);

-- ── 10. AUTO-ARCHIVE FUNCTION ─────────────────────────────────────────────────
-- Called by a Supabase pg_cron job or manually: SELECT auto_archive_documents();

CREATE OR REPLACE FUNCTION public.auto_archive_documents()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  retention_days integer;
  archived_count integer := 0;
BEGIN
  -- Get configured retention days
  SELECT setting_value::integer INTO retention_days
  FROM public.document_system_settings
  WHERE setting_key = 'document_retention_days';

  IF retention_days IS NULL THEN
    retention_days := 365;
  END IF;

  -- Auto-archive documents where:
  -- 1. Linked booking return_date + retention_days has passed
  -- 2. Document is NOT on legal hold
  -- 3. No open cancellation_requests or refunds on the booking
  UPDATE public.documents d
  SET approval_status = 'archived',
      updated_at = now()
  FROM public.bookings b
  WHERE d.booking_id = b.id
    AND d.approval_status NOT IN ('archived', 'rejected')
    AND d.legal_hold = false
    AND b.trip_end_date IS NOT NULL
    AND (b.trip_end_date + (retention_days || ' days')::interval)::date <= CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.cancellation_requests cr
      WHERE cr.booking_id = b.id AND cr.status NOT IN ('resolved','rejected')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.refunds r
      WHERE r.booking_id = b.id AND r.status NOT IN ('completed','rejected')
    );

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$;

-- ── 11. LEGAL HOLD AUTO-TRIGGER ───────────────────────────────────────────────
-- When an open refund or cancellation exists, put docs on legal hold

CREATE OR REPLACE FUNCTION public.check_document_legal_hold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a new refund or cancellation is created/updated, place legal hold
  -- on all documents for that booking
  IF TG_TABLE_NAME IN ('refunds','cancellation_requests') THEN
    IF NEW.status NOT IN ('completed','rejected') THEN
      UPDATE public.documents
      SET legal_hold = true, updated_at = now()
      WHERE booking_id = NEW.booking_id AND legal_hold = false;
    ELSE
      -- Release hold when resolved — but only if no OTHER open records exist
      UPDATE public.documents d
      SET legal_hold = false, updated_at = now()
      WHERE d.booking_id = NEW.booking_id
        AND d.legal_hold = true
        AND NOT EXISTS (
          SELECT 1 FROM public.refunds r
          WHERE r.booking_id = NEW.booking_id AND r.status NOT IN ('completed','rejected')
            AND r.id != NEW.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM public.cancellation_requests cr
          WHERE cr.booking_id = NEW.booking_id AND cr.status NOT IN ('resolved','rejected')
            AND cr.id != NEW.id
        );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to refunds (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'refunds') THEN
    DROP TRIGGER IF EXISTS trg_legal_hold_refunds ON public.refunds;
    CREATE TRIGGER trg_legal_hold_refunds
      AFTER INSERT OR UPDATE ON public.refunds
      FOR EACH ROW EXECUTE FUNCTION public.check_document_legal_hold();
  END IF;
END $$;

-- Attach trigger to cancellation_requests (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cancellation_requests') THEN
    DROP TRIGGER IF EXISTS trg_legal_hold_cancellations ON public.cancellation_requests;
    CREATE TRIGGER trg_legal_hold_cancellations
      AFTER INSERT OR UPDATE ON public.cancellation_requests
      FOR EACH ROW EXECUTE FUNCTION public.check_document_legal_hold();
  END IF;
END $$;
