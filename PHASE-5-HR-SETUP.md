# Phase 5: HR Management System - Setup Guide

## Overview

Phase 5 adds a complete Enterprise HR Management System to Omnia TravelOS with 15 major features:

1. Employee Management
2. Attendance Tracking
3. Leave Management
4. Payroll Processing
5. Performance Reviews
6. Recruitment
7. Onboarding
8. Asset Management
9. Shift Scheduling
10. Training Management
11. Commission Integration
12. Self-Service Portal
13. Organization Chart
14. HR Analytics Dashboard
15. Audit Logging

## Prerequisites

Before starting, ensure you have:
- ✅ Phase 1-4 completed (Auth, Bookings, Finance)
- ✅ Supabase connection active
- ✅ All existing tables created (profiles, bookings, commissions, etc.)

## Database Setup Instructions

### Step 1: Copy SQL Code

The complete SQL schema is in `/vercel/share/v0-project/phase-5-hr-schema.sql`

This file contains:
- ALTER TABLE statements to extend `profiles` with HR columns
- 15 new HR management tables
- Indexes on all foreign keys
- RLS policies for all tables
- Sample data (leave types, shifts, training courses)

### Step 2: Execute in Supabase

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `phase-5-hr-schema.sql`
4. Click **Run**

The SQL will execute all migrations in one transaction. If any step fails, the entire transaction rolls back.

### Step 3: Verify Tables Created

Run this query in Supabase to verify all HR tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'employee_documents', 'attendance', 'leave_types', 'leave_balances',
    'leave_requests', 'payroll', 'performance_reviews', 'job_positions',
    'applicants', 'onboarding_tasks', 'assets', 'asset_assignments',
    'shifts', 'shift_assignments', 'training_courses', 'training_assignments',
    'hr_audit_log'
  )
ORDER BY table_name;
```

Expected result: 17 rows (all tables created)

## TypeScript Types & Services

### Types
- Location: `/vercel/share/v0-project/types/hr.ts`
- Contains: All interfaces, validation schemas, form types
- Exported from: Main types index

### Service Layer
- Location: `/vercel/share/v0-project/lib/services/hr.ts`
- Contains: All database operations for HR features
- Functions: CRUD operations, calculations, analytics

## File Structure

```
app/(dashboard)/hr/
├── page.tsx                    # HR Dashboard
├── employees/
│   ├── page.tsx               # Employee List
│   ├── new/page.tsx           # Create Employee
│   └── [id]/page.tsx          # Employee Detail
├── attendance/page.tsx        # Attendance Management
├── leave/page.tsx             # Leave Management
├── payroll/page.tsx           # Payroll Processing
├── performance/page.tsx       # Performance Reviews
├── recruitment/page.tsx       # Recruitment
├── onboarding/page.tsx        # Onboarding
├── assets/page.tsx            # Asset Management
├── shifts/page.tsx            # Shift Scheduling
├── training/page.tsx          # Training Management
├── org-chart/page.tsx         # Organization Chart
└── self-service/page.tsx      # Employee Self-Service

components/hr/
├── EmployeeForm.tsx
├── EmployeeTable.tsx
├── AttendanceCard.tsx
├── LeaveRequestForm.tsx
├── PayrollTable.tsx
├── PerformanceChart.tsx
└── ... (other HR components)

actions/
└── hr-actions.ts              # Server actions for HR operations
```

## Key Features by Module

### 1. Employee Management
- Create/Edit/Delete employees
- Auto-generate Employee IDs (EMP-0001 format)
- Upload documents (passport, contracts, etc.)
- Track employment history
- Manage salary and commission eligibility

### 2. Attendance
- Clock in/Clock out functionality
- Manual attendance recording
- Late arrival tracking
- Overtime calculation
- Monthly attendance calendar
- Attendance reports

### 3. Leave Management
- 7 built-in leave types (Annual, Sick, Maternity, etc.)
- Multi-step approval workflow (Manager → HR)
- Leave balance tracking per year
- Automatic leave deduction on approval
- Leave calendar visualization

### 4. Payroll
- Monthly payroll calculation
- Automatic commission integration
- Salary components (basic + allowances + bonuses - deductions - tax)
- Payslip generation
- Payroll approval workflow

### 5. Performance Reviews
- Monthly, Quarterly, Annual reviews
- KPI tracking
- Achievement percentage calculation
- Manager and employee notes
- Performance history

### 6. Recruitment
- Job position management
- Applicant tracking (7 stages)
- Resume storage
- Hiring workflow
- Candidate pipeline

### 7. Onboarding
- 23 standard onboarding tasks
- 4 task categories (account, documents, equipment, training)
- Progress tracking
- Task completion audit

### 8. Asset Management
- Asset inventory (laptop, phone, SIM, etc.)
- Issue/Return tracking
- Condition monitoring
- Assignment history

### 9. Shifts
- Predefined shifts (Morning, Evening, Night)
- Recurring shift patterns
- Shift assignment calendar
- Conflict detection

### 10. Training
- Training course library
- Assignment tracking
- Certificate management
- Expiry date tracking

## Permissions Matrix

| Role | Access |
|------|--------|
| Super Admin | Full access to all HR features |
| HR Manager | Full access to all HR tables (except delete profiles) |
| Manager | View/Edit direct reports only |
| Employee | View own profile, request leave, clock in/out |
| Accountant | Read-only access to payroll & commissions |
| Sales Agent | View own commission, attendance |

## Integration with Existing Systems

### Finance Integration (Phase 4)
- Payroll pulls commission data from `commissions` table
- Commission records link to employee payroll

### Booking Integration (Phase 3)
- Attendance links to employee assignments
- Performance reviews can track booking metrics
- Leave requests update employee availability

## Testing

### Sample Data Included

The SQL script includes:
- 7 Leave types (Annual, Sick, Emergency, Maternity, Paternity, Compassionate, Unpaid)
- 4 Shifts (Morning 08:00-16:00, Evening 16:00-00:00, Night 00:00-08:00, Flexible)
- 4 Training courses (Travel Basics, Customer Service, Compliance, Booking Systems)

### Quick Test Flow

1. Create an employee via Employee Management page
2. Clock in/out to test Attendance
3. Request leave to test Leave workflow
4. Generate payroll to test Payroll module
5. View dashboard for analytics

## Troubleshooting

### Error: "Table does not exist"
- Run the SQL migration again
- Verify Supabase connection is active
- Check that public schema is selected

### Error: "RLS policy denied"
- RLS is set to permissive mode for development
- In production, update policies in Phase 5 setup for role-based access

### Commission not showing in Payroll
- Verify commissions table has records for that employee/period
- Check commission status is 'approved' or 'paid'

## Production Considerations

1. **RLS Policies**: Current policies are permissive. Update for production with role-based restrictions.
2. **Audit Logging**: All HR mutations are logged in `hr_audit_log` table for compliance.
3. **Data Privacy**: Employee documents are stored in Supabase Storage - add encryption for sensitive files.
4. **Notifications**: Integrate with existing notification system for leave approvals, payroll updates, etc.

## Next Steps

After SQL execution:
1. Build Employee Management UI pages
2. Build Attendance tracking pages
3. Build Leave Management workflow
4. Build Payroll dashboard
5. Build HR Analytics

---

**Status**: Phase 5 Backend Ready ✅
**SQL Execution**: Required before UI build
**Estimated Time**: 2-3 hours for full implementation
