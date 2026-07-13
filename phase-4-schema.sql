-- PHASE 4: FINANCE ERP SYSTEM
-- All 9 tables for Invoices, Payments, Expenses, Commissions, and Refunds

-- ============================================================================
-- PART 1 (4A): INVOICES & PAYMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) GENERATED ALWAYS AS (amount + tax) STORED,
  status text NOT NULL DEFAULT 'draft',
  due_date date NOT NULL,
  issued_date date DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_booking ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL,
  line_total numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL,
  payment_method text NOT NULL,
  payment_date date DEFAULT CURRENT_DATE,
  reference_number text,
  recorded_by uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- ============================================================================
-- PART 2 (4B): EXPENSES & SUPPLIER PAYMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  expense_date date DEFAULT CURRENT_DATE,
  recorded_by uuid REFERENCES profiles(id),
  receipt_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_booking ON expenses(booking_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);

CREATE TABLE IF NOT EXISTS supplier_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  paid_date date,
  payment_method text,
  reference_number text,
  recorded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier ON supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_booking ON supplier_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_status ON supplier_payments(status);

-- ============================================================================
-- PART 3 (4C): COMMISSION ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  rule_type text NOT NULL DEFAULT 'percentage',
  rate numeric(5,2) NOT NULL,
  applies_to text NOT NULL DEFAULT 'profit',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  agent_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  rule_id uuid REFERENCES commission_rules(id),
  base_amount numeric(12,2) NOT NULL,
  commission_amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  period_month integer NOT NULL,
  period_year integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commissions_booking ON commissions(booking_id);
CREATE INDEX IF NOT EXISTS idx_commissions_agent ON commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_period ON commissions(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

-- ============================================================================
-- PART 4 (4D): REFUNDS & CANCELLATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS cancellation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  requested_by uuid NOT NULL REFERENCES profiles(id),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  requested_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_cancellation_requests_booking ON cancellation_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_requests_status ON cancellation_requests(status);

CREATE TABLE IF NOT EXISTS refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cancellation_id uuid NOT NULL REFERENCES cancellation_requests(id) ON DELETE RESTRICT,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  refund_amount numeric(12,2) NOT NULL,
  supplier_penalty numeric(12,2) DEFAULT 0,
  net_refund numeric(12,2) GENERATED ALWAYS AS (refund_amount - supplier_penalty) STORED,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES profiles(id),
  paid_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refunds_cancellation ON refunds(cancellation_id);
CREATE INDEX IF NOT EXISTS idx_refunds_invoice ON refunds(invoice_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

-- ============================================================================
-- ENABLE RLS FOR ALL TABLES
-- ============================================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - INVOICES
-- ============================================================================

-- Super Admin & Admin: full access
CREATE POLICY "admin_invoices_full" ON invoices
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('super_admin', 'admin')
  ));

-- Accountant: full access to all invoices
CREATE POLICY "accountant_invoices_full" ON invoices
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'accountant'
  ));

-- Sales Agent: read-only on invoices for their bookings
CREATE POLICY "sales_agent_invoices_read" ON invoices
  FOR SELECT USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'sales_agent'
  ) AND booking_id IN (
    SELECT id FROM bookings WHERE assigned_to = (
      SELECT id FROM profiles WHERE auth.uid() = id
    )
  ));

-- ============================================================================
-- RLS POLICIES - PAYMENTS
-- ============================================================================

CREATE POLICY "admin_payments_full" ON payments
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('super_admin', 'admin')
  ));

CREATE POLICY "accountant_payments_full" ON payments
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'accountant'
  ));

CREATE POLICY "sales_agent_payments_read" ON payments
  FOR SELECT USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'sales_agent'
  ) AND invoice_id IN (
    SELECT id FROM invoices WHERE booking_id IN (
      SELECT id FROM bookings WHERE assigned_to = (
        SELECT id FROM profiles WHERE auth.uid() = id
      )
    )
  ));

-- ============================================================================
-- RLS POLICIES - EXPENSES
-- ============================================================================

CREATE POLICY "admin_expenses_full" ON expenses
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('super_admin', 'admin')
  ));

CREATE POLICY "accountant_expenses_full" ON expenses
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'accountant'
  ));

-- ============================================================================
-- RLS POLICIES - SUPPLIER PAYMENTS
-- ============================================================================

CREATE POLICY "admin_supplier_payments_full" ON supplier_payments
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('super_admin', 'admin')
  ));

CREATE POLICY "accountant_supplier_payments_full" ON supplier_payments
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'accountant'
  ));

CREATE POLICY "operations_supplier_payments_read" ON supplier_payments
  FOR SELECT USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'operations'
  ));

-- ============================================================================
-- RLS POLICIES - COMMISSIONS
-- ============================================================================

CREATE POLICY "admin_commissions_full" ON commissions
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('super_admin', 'admin')
  ));

CREATE POLICY "accountant_commissions_full" ON commissions
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'accountant'
  ));

CREATE POLICY "sales_agent_commissions_read" ON commissions
  FOR SELECT USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'sales_agent'
  ) AND agent_id = auth.uid());

CREATE POLICY "hr_commissions_read" ON commissions
  FOR SELECT USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'hr_manager'
  ));

-- ============================================================================
-- RLS POLICIES - CANCELLATION REQUESTS
-- ============================================================================

CREATE POLICY "admin_cancellations_full" ON cancellation_requests
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('super_admin', 'admin')
  ));

CREATE POLICY "operations_cancellations_full" ON cancellation_requests
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'operations'
  ));

CREATE POLICY "sales_agent_cancellations_own" ON cancellation_requests
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'sales_agent'
  ) AND requested_by = auth.uid());

-- ============================================================================
-- RLS POLICIES - REFUNDS
-- ============================================================================

CREATE POLICY "admin_refunds_full" ON refunds
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('super_admin', 'admin')
  ));

CREATE POLICY "accountant_refunds_full" ON refunds
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'accountant'
  ));

-- ============================================================================
-- RLS POLICIES - INVOICE LINE ITEMS & COMMISSION RULES
-- ============================================================================

CREATE POLICY "admin_invoice_items_full" ON invoice_line_items
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('super_admin', 'admin')
  ));

CREATE POLICY "accountant_invoice_items_full" ON invoice_line_items
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'accountant'
  ));

CREATE POLICY "admin_commission_rules_full" ON commission_rules
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('super_admin', 'admin')
  ));

CREATE POLICY "accountant_commission_rules_full" ON commission_rules
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'accountant'
  ));

-- ============================================================================
-- INSERT DEFAULT COMMISSION RULES
-- ============================================================================

INSERT INTO commission_rules (role, rule_type, rate, applies_to, is_active)
VALUES 
  ('sales_agent', 'percentage', 5.00, 'profit', true)
ON CONFLICT DO NOTHING;
