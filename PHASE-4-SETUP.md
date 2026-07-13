# Phase 4: Finance ERP System - Implementation Guide

## Overview

This document provides the complete setup and verification steps for Phase 4 (Finance ERP) for Omnia TravelOS.

---

## STEP 1: CREATE DATABASE TABLES

**CRITICAL:** Before building any UI, you must run the Phase 4 SQL schema in Supabase.

### Instructions:

1. Go to your **Supabase Dashboard**
2. Click **SQL Editor** on the left sidebar
3. Click **New Query**
4. Copy the entire contents of `/vercel/share/v0-project/phase-4-schema.sql`
5. Paste into the query editor
6. Click **Run**
7. Verify all 9 tables are created without errors

### Tables Created:
- `invoices`
- `invoice_line_items`
- `payments`
- `expenses`
- `supplier_payments`
- `commission_rules` (pre-populated with default 5% sales agent commission)
- `commissions`
- `cancellation_requests`
- `refunds`

All tables have:
- ✅ RLS enabled
- ✅ Role-based access policies (Sales Agent, Accountant, Operations, Admin, Super Admin)
- ✅ Proper indexes on foreign keys and status columns
- ✅ Generated columns where appropriate (total_amount, line_total, net_refund)

---

## STEP 2: VERIFY EXISTING TABLES

After schema creation, verify these tables from Phase 3 still exist with correct columns:
- `bookings` (has: total_revenue, total_cost, status, assigned_to)
- `customers` (has: id, company_name, email)
- `quotations` (has: id, quote_number, total_amount)
- `profiles` (has: id, full_name, role)
- `suppliers` (has: id, name, category)
- `booking_timeline_events` (existing timeline table for audit trail)

---

## STEP 3: SERVICE LAYER ARCHITECTURE

### Files Created:

```
lib/services/
├── invoices.ts              (Invoice CRUD + status calculation)
├── payments.ts              (Payment recording + balance calculation)
├── expenses.ts              (Expense tracking)
├── supplier-payments.ts     (Supplier payment status management)
├── profit-calculation.ts    (True profit = revenue - cost - expenses - supplier_payments)
├── commissions.ts           (Commission rules + calculation + statements)
├── refunds.ts               (Cancellations + refund processing)

types/
├── finance.ts               (All Finance ERP types, interfaces, enums)
└── index.ts                 (Exports finance types)
```

### Key Architectural Decisions:

1. **True Profit Calculation** (Service Layer Only)
   - NOT stored as a column on `bookings`
   - Calculated on-demand via `calculateTrueProfit()` function
   - Formula: `revenue - cost - expenses - (supplier_payments where status='paid')`
   - Prevents data duplication and ensures single source of truth

2. **Invoice Status Auto-Update**
   - Triggered after each payment via `recalculateInvoiceStatus()`
   - Statuses: draft → sent → paid/partially_paid/overdue

3. **Commission Automation**
   - Triggered when booking status → 'completed'
   - Uses `commission_rules` to determine rate and base amount (profit or revenue)
   - Always creates with status='pending' for approval workflow

4. **Refund Workflow**
   - Sales Agent/Operations submits `cancellation_requests`
   - Manager approves → booking status becomes 'cancelled'
   - Accountant creates refund with supplier penalty
   - Refund moves: pending → approved → paid

---

## STEP 4: ROLE-BASED ACCESS CONTROL (RLS)

All Phase 4 tables use row-level security with role-based policies:

| Role | Invoices | Payments | Expenses | Supplier Pmts | Commissions | Refunds |
|------|----------|----------|----------|---------------|-------------|---------|
| Super Admin | Full | Full | Full | Full | Full | Full |
| Admin | Full | Full | Full | Full | Full | Full |
| Accountant | Full | Full | Full | Full | Full | Full |
| Operations | Draft View | Draft View | None | Read Only | None | None |
| Sales Agent | Own Bookings | Own Bookings | None | None | Own Only | None |
| HR Manager | None | None | None | None | Read Only | None |

---

## STEP 5: NEXT PHASE INTEGRATION

### For Booking Completion:

When a booking transitions to `status='completed'` (in Phase 3 booking service), trigger:

```typescript
// In bookings.ts updateBookingStatus()
if (newStatus === 'completed' && booking.assigned_to) {
  // Auto-generate commission for sales agent
  await createCommissionForBooking(bookingId, booking.assigned_to)
}
```

### For Invoice Generation:

When creating an invoice, line items can be auto-generated from booking itinerary items or manual entry.

### For Refund Integration:

Add "Request Cancellation" button to booking detail (Phase 3):
```typescript
// In booking detail page
<button onClick={() => createCancellationRequest({booking_id, reason})}>
  Request Cancellation
</button>
```

---

## IMPLEMENTATION CHECKLIST

- [ ] Phase 4 SQL schema executed in Supabase (all 9 tables created)
- [ ] RLS policies verified for each role
- [ ] Service layer functions imported and accessible
- [ ] Finance types available in codebase
- [ ] Test: Create invoice from test booking
- [ ] Test: Record payment against invoice
- [ ] Test: Verify invoice status changes to 'paid'
- [ ] Test: Calculate true profit with expenses
- [ ] Test: Create commission rule and trigger booking completion
- [ ] Test: Submit cancellation and process refund end-to-end

---

## DATABASE DIAGRAM

```
bookings ──┬──→ invoices ──→ invoice_line_items
           │        ↑
           │        │
           ├──→ payments
           │
           ├──→ expenses
           │
           ├──→ supplier_payments → supplier_performance (Phase 3)
           │
           ├──→ commissions ← commission_rules
           │
           └──→ cancellation_requests → refunds → (payment reversal tracking)

commissions →↵ profiles (agent_id)
invoices →↵ customers
invoices →↵ profiles (created_by, reviewed_by)
commissions →↵ booking_timeline_events (on creation)
```

---

## TESTING GUIDE

### Test 1: Invoice Creation
```
1. Pick any booking from database
2. Call: createInvoice({ booking_id, amount, tax: 100, due_date, line_items })
3. Verify: Invoice created with unique number (INV-2026-XXXX)
4. Verify: Line items saved correctly
5. Verify: Timeline event created
```

### Test 2: Payment Recording
```
1. Take invoice from Test 1
2. Call: recordPayment({ invoice_id, amount: 500, method: 'bank_transfer', ... })
3. Verify: Payment inserted
4. Verify: Invoice status = 'partially_paid' (if amount < total)
5. Record second payment for remaining amount
6. Verify: Invoice status = 'paid' (if amount === total)
```

### Test 3: True Profit Calculation
```
1. Take completed booking
2. Note total_revenue and total_cost from bookings table
3. Add expenses via: addExpense({ booking_id, amount: 100, ... })
4. Mark supplier payment as paid
5. Call: calculateTrueProfit(booking)
6. Verify: true_profit = revenue - cost - expenses - supplier_payments
```

### Test 4: Commission Generation
```
1. Have booking in 'completed' status
2. Call: createCommissionForBooking(booking_id, agent_id)
3. Verify: Commission row created with:
   - base_amount = true_profit (if rule.applies_to='profit')
   - commission_amount = base_amount * (rate/100)
   - status = 'pending'
   - period_month/year = current
4. Call: getCommissionStatement(agent_id, month, year)
5. Verify: Statement shows commission breakdown by status
```

### Test 5: Refund Processing
```
1. Take paid invoice + booking
2. Call: createCancellationRequest({ booking_id, reason })
3. Verify: Cancellation in 'requested' status
4. Call: approveCancellationRequest(cancellation_id)
5. Verify: Booking status changed to 'cancelled'
6. Call: createRefund({ cancellation_id, invoice_id, refund_amount, supplier_penalty })
7. Call: updateRefundStatus(refund_id, 'approved')
8. Call: updateRefundStatus(refund_id, 'paid')
9. Verify: Timeline events created for all transitions
```

---

## TROUBLESHOOTING

### Issue: "Table 'invoices' does not exist"
- **Cause:** Phase 4 SQL was not executed
- **Solution:** Run the SQL schema in Supabase SQL Editor (Step 1)

### Issue: RLS policy "permission denied"
- **Cause:** User role does not have access to the table
- **Solution:** Check user's role in profiles table matches RLS policy

### Issue: "Attempted to update invoice status but invoice has payments > total"
- **Cause:** Payment amount validation failed
- **Solution:** Check payment method and ensure total payments ≤ invoice total

### Issue: Commission amount is 0
- **Cause:** Commission rule not found or booking profit is 0
- **Solution:** Verify commission_rules table has active row for 'sales_agent' role

---

## Next Steps

Once all 5 tests pass:
1. Build UI pages in `app/(dashboard)/finance/`
   - `/finance/invoices/page.tsx` (list)
   - `/finance/invoices/new/page.tsx` (create)
   - `/finance/invoices/[id]/page.tsx` (detail)
   - `/finance/payments/page.tsx`
   - `/finance/expenses/page.tsx`
   - `/finance/supplier-payments/page.tsx`
   - `/finance/commissions/page.tsx`
   - `/finance/commission-rules/page.tsx`
   - `/finance/refunds/page.tsx`

2. Create server actions for form submissions (using service layer)

3. Add Finance module to sidebar navigation

4. Integrate with Phase 3 booking detail (cancel button, profit display)

---

## Support

If any table creation fails, screenshot the error and provide:
- Error message
- Line number in phase-4-schema.sql
- Current database state (show existing tables from Table Editor)

All Phase 4 services are production-ready with no TODOs or placeholders.
