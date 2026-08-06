# Enterprise Expense Module — Task List

## Phase 1: Database Schema
- [x] Create expense-module-schema.sql

## Phase 2: TypeScript Types
- [x] Extend types/finance.ts with new expense types

## Phase 3: Services
- [x] Extend lib/services/expenses.ts
- [x] Create lib/services/expense-vendors.ts
- [x] Create lib/services/expense-categories.ts
- [x] Create lib/services/expense-attachments.ts
- [x] Create lib/services/expense-approvals.ts
- [x] Create lib/services/expense-budgets.ts
- [x] Create lib/services/expense-notifications.ts
- [x] Create lib/services/expense-reports.ts
- [x] Create lib/services/expense-ai.ts
- [x] Create lib/utils/expense-pdf.ts (shared utility)

## Phase 4: Server Actions
- [x] Extend app/actions/finance.ts

## Phase 5: Components
- [x] components/finance/expenses/ExpenseKPICard.tsx
- [x] app/(dashboard)/finance/expenses/components/SearchFilterBar.tsx
- [x] app/(dashboard)/finance/expenses/components/ExpenseDashboard.tsx
- [x] app/(dashboard)/finance/expenses/components/ExpenseList.tsx
- [x] app/(dashboard)/finance/expenses/components/AddExpenseModal.tsx
- [x] app/(dashboard)/finance/expenses/components/ExpenseDetailPanel.tsx
- [x] app/(dashboard)/finance/expenses/components/VendorManagement.tsx
- [x] app/(dashboard)/finance/expenses/components/CategoryManagement.tsx
- [x] app/(dashboard)/finance/expenses/components/BudgetTracking.tsx
- [x] app/(dashboard)/finance/expenses/components/ExpenseReports.tsx

## Phase 6: Main Page
- [x] Replace app/(dashboard)/finance/expenses/page.tsx

## Phase 7: Verification
- [x] TypeScript check — zero errors in expense module
- [x] Fixed all 5 type errors introduced by our new files
- [x] Pre-existing errors in HR/refunds/tech are NOT from our changes
