-- ============================================================================
-- FIX: Employee Expense RLS Policies
-- Adds policies so employees can select and insert their own expenses.
-- Resolves the issue where an expense "disappears" for the employee after submission.
-- ============================================================================

-- Allow employees to SELECT their own expenses
CREATE POLICY "employee_expenses_select" ON expenses
  FOR SELECT USING (
    auth.uid() = recorded_by OR auth.uid() = employee_id
  );

-- Allow employees to INSERT their own expenses
CREATE POLICY "employee_expenses_insert" ON expenses
  FOR INSERT WITH CHECK (
    auth.uid() = recorded_by OR auth.uid() = employee_id
  );

-- Allow employees to UPDATE their own expenses (e.g. while in 'pending' status)
CREATE POLICY "employee_expenses_update" ON expenses
  FOR UPDATE USING (
    (auth.uid() = recorded_by OR auth.uid() = employee_id)
    AND approval_status = 'pending'
  );
