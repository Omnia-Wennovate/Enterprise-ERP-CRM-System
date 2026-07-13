-- Fixed Database Setup - Safe to run multiple times
-- This script handles existing tables and policies gracefully

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_reference character varying NOT NULL UNIQUE,
  customer_id character varying NOT NULL,
  customer_name character varying NOT NULL,
  destination character varying NOT NULL,
  trip_start_date date NOT NULL,
  trip_end_date date NOT NULL,
  status character varying NOT NULL DEFAULT 'pending',
  total_cost numeric DEFAULT 0,
  currency character varying DEFAULT 'USD',
  num_travelers integer DEFAULT 1,
  booking_type character varying DEFAULT 'tour',
  special_requests text,
  assigned_to character varying,
  assigned_to_name character varying,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  created_by character varying,
  notes text,
  PRIMARY KEY (id)
);

-- Create booking_travelers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.booking_travelers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  email character varying,
  phone character varying,
  date_of_birth date,
  passport_number character varying,
  passport_expiry date,
  nationality character varying,
  room_type character varying,
  meal_plan character varying,
  special_requirements text,
  created_at timestamp without time zone DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE
);

-- Create booking_checklists table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.booking_checklists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  item_name character varying NOT NULL,
  category character varying,
  is_completed boolean DEFAULT false,
  assigned_to character varying,
  due_date date,
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE
);

-- Create booking_timeline_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.booking_timeline_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  event_type character varying NOT NULL,
  description text NOT NULL,
  event_date timestamp without time zone DEFAULT now(),
  created_by character varying,
  related_to character varying,
  created_at timestamp without time zone DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE
);

-- Create booking_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.booking_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  note_text text NOT NULL,
  created_by character varying,
  note_type character varying DEFAULT 'general',
  is_private boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE
);

-- Create visa_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.visa_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid,
  traveler_id uuid,
  destination_country text NOT NULL,
  visa_type text NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  submission_date date,
  appointment_date date,
  decision_date date,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  FOREIGN KEY (traveler_id) REFERENCES public.booking_travelers(id)
);

-- Create documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid,
  traveler_id uuid,
  folder text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size_kb integer,
  status text NOT NULL DEFAULT 'missing',
  expiry_date date,
  version integer DEFAULT 1,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  FOREIGN KEY (traveler_id) REFERENCES public.booking_travelers(id)
);

-- Create document_versions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.document_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid,
  file_url text NOT NULL,
  version integer NOT NULL,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (document_id) REFERENCES public.documents(id)
);

-- Create itineraries table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.itineraries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid,
  title text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);

-- Create itinerary_days table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.itinerary_days (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  itinerary_id uuid,
  day_number integer NOT NULL,
  date date,
  title text,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  FOREIGN KEY (itinerary_id) REFERENCES public.itineraries(id)
);

-- Create itinerary_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.itinerary_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  day_id uuid,
  type text NOT NULL,
  time text,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  FOREIGN KEY (day_id) REFERENCES public.itinerary_days(id)
);

-- Create suppliers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  contact_person text,
  email text,
  phone text,
  country text,
  rating numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create supplier_contacts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.supplier_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  supplier_id uuid,
  name text NOT NULL,
  role text,
  email text,
  phone text,
  PRIMARY KEY (id),
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id)
);

-- Create supplier_performance table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.supplier_performance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  supplier_id uuid,
  booking_id uuid,
  on_time boolean,
  issue_reported boolean DEFAULT false,
  issue_notes text,
  recorded_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id),
  FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);

-- Enable RLS on all tables (safe to run multiple times)
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.booking_travelers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.booking_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.booking_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.booking_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.visa_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.supplier_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.supplier_performance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (so we can recreate them)
DROP POLICY IF EXISTS "Allow all access" ON public.bookings;
DROP POLICY IF EXISTS "Allow all access" ON public.booking_travelers;
DROP POLICY IF EXISTS "Allow all access" ON public.booking_checklists;
DROP POLICY IF EXISTS "Allow all access" ON public.booking_timeline_events;
DROP POLICY IF EXISTS "Allow all access" ON public.booking_notes;
DROP POLICY IF EXISTS "Allow all access" ON public.visa_applications;
DROP POLICY IF EXISTS "Allow all access" ON public.documents;
DROP POLICY IF EXISTS "Allow all access" ON public.document_versions;
DROP POLICY IF EXISTS "Allow all access" ON public.itineraries;
DROP POLICY IF EXISTS "Allow all access" ON public.itinerary_days;
DROP POLICY IF EXISTS "Allow all access" ON public.itinerary_items;
DROP POLICY IF EXISTS "Allow all access" ON public.suppliers;
DROP POLICY IF EXISTS "Allow all access" ON public.supplier_contacts;
DROP POLICY IF EXISTS "Allow all access" ON public.supplier_performance;

-- Create RLS policies (permissive for now)
CREATE POLICY "Allow all access" ON public.bookings FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.booking_travelers FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.booking_checklists FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.booking_timeline_events FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.booking_notes FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.visa_applications FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.documents FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.document_versions FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.itineraries FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.itinerary_days FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.itinerary_items FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.suppliers FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.supplier_contacts FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.supplier_performance FOR ALL USING (true);

-- Create indexes for better performance (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_booking_travelers_booking ON public.booking_travelers(booking_id);
CREATE INDEX IF NOT EXISTS idx_checklist_booking ON public.booking_checklists(booking_id);
CREATE INDEX IF NOT EXISTS idx_visa_booking ON public.visa_applications(booking_id);
CREATE INDEX IF NOT EXISTS idx_documents_booking ON public.documents(booking_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_booking ON public.itineraries(booking_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON public.suppliers(category);
