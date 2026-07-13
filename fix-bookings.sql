-- Complete repair for the bookings table
-- Adds all missing columns safely without deleting data

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_reference character varying,
  ADD COLUMN IF NOT EXISTS customer_id uuid,
  ADD COLUMN IF NOT EXISTS customer_name character varying,
  ADD COLUMN IF NOT EXISTS destination character varying,
  ADD COLUMN IF NOT EXISTS trip_start_date date,
  ADD COLUMN IF NOT EXISTS trip_end_date date,
  ADD COLUMN IF NOT EXISTS status character varying DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS total_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency character varying DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS num_travelers integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS booking_type character varying DEFAULT 'tour',
  ADD COLUMN IF NOT EXISTS special_requests text,
  ADD COLUMN IF NOT EXISTS assigned_to character varying,
  ADD COLUMN IF NOT EXISTS assigned_to_name character varying,
  ADD COLUMN IF NOT EXISTS created_by character varying,
  ADD COLUMN IF NOT EXISTS notes text;

-- Fill in required fields for any existing rows to prevent null errors
UPDATE public.bookings SET 
  booking_reference = COALESCE(booking_reference, 'BK-' || upper(substr(md5(random()::text), 1, 6))),
  customer_id = COALESCE(customer_id, '00000000-0000-0000-0000-000000000000'::uuid),
  customer_name = COALESCE(customer_name, 'Unknown Customer'),
  destination = COALESCE(destination, 'Unknown Destination'),
  trip_start_date = COALESCE(trip_start_date, CURRENT_DATE),
  trip_end_date = COALESCE(trip_end_date, CURRENT_DATE + interval '7 days')
WHERE booking_reference IS NULL OR customer_id IS NULL OR destination IS NULL;

-- Now that data is safe, apply the UNIQUE constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_booking_reference_key'
  ) THEN
    ALTER TABLE public.bookings ADD CONSTRAINT bookings_booking_reference_key UNIQUE (booking_reference);
  END IF;
END $$;
