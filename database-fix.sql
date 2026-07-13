-- Simple fix - just ensure policies are permissive
-- Run this if you get "policy already exists" errors

-- For bookings table
DROP POLICY IF EXISTS "Allow all access" ON public.bookings;
CREATE POLICY "Allow all" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

-- For booking_travelers table
DROP POLICY IF EXISTS "Allow all access" ON public.booking_travelers;
CREATE POLICY "Allow all" ON public.booking_travelers FOR ALL USING (true) WITH CHECK (true);

-- For booking_checklists table
DROP POLICY IF EXISTS "Allow all access" ON public.booking_checklists;
CREATE POLICY "Allow all" ON public.booking_checklists FOR ALL USING (true) WITH CHECK (true);

-- For booking_timeline_events table
DROP POLICY IF EXISTS "Allow all access" ON public.booking_timeline_events;
CREATE POLICY "Allow all" ON public.booking_timeline_events FOR ALL USING (true) WITH CHECK (true);

-- For booking_notes table
DROP POLICY IF EXISTS "Allow all access" ON public.booking_notes;
CREATE POLICY "Allow all" ON public.booking_notes FOR ALL USING (true) WITH CHECK (true);

-- For visa_applications table
DROP POLICY IF EXISTS "Allow all access" ON public.visa_applications;
CREATE POLICY "Allow all" ON public.visa_applications FOR ALL USING (true) WITH CHECK (true);

-- For documents table
DROP POLICY IF EXISTS "Allow all access" ON public.documents;
CREATE POLICY "Allow all" ON public.documents FOR ALL USING (true) WITH CHECK (true);

-- For document_versions table
DROP POLICY IF EXISTS "Allow all access" ON public.document_versions;
CREATE POLICY "Allow all" ON public.document_versions FOR ALL USING (true) WITH CHECK (true);

-- For itineraries table
DROP POLICY IF EXISTS "Allow all access" ON public.itineraries;
CREATE POLICY "Allow all" ON public.itineraries FOR ALL USING (true) WITH CHECK (true);

-- For itinerary_days table
DROP POLICY IF EXISTS "Allow all access" ON public.itinerary_days;
CREATE POLICY "Allow all" ON public.itinerary_days FOR ALL USING (true) WITH CHECK (true);

-- For itinerary_items table
DROP POLICY IF EXISTS "Allow all access" ON public.itinerary_items;
CREATE POLICY "Allow all" ON public.itinerary_items FOR ALL USING (true) WITH CHECK (true);

-- For suppliers table
DROP POLICY IF EXISTS "Allow all access" ON public.suppliers;
CREATE POLICY "Allow all" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);

-- For supplier_contacts table
DROP POLICY IF EXISTS "Allow all access" ON public.supplier_contacts;
CREATE POLICY "Allow all" ON public.supplier_contacts FOR ALL USING (true) WITH CHECK (true);

-- For supplier_performance table
DROP POLICY IF EXISTS "Allow all access" ON public.supplier_performance;
CREATE POLICY "Allow all" ON public.supplier_performance FOR ALL USING (true) WITH CHECK (true);
