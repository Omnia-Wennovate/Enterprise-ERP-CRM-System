'use server'

import {
  getExpenses,
  getExpensesByBooking,
  addExpense,
  getTotalExpensesByBooking,
  getExpensesByCategory,
} from '@/lib/services/expenses'
import {
  getSupplierPayments,
  getSupplierPaymentsByBooking,
  markSupplierPaymentAsPaid,
  getSupplierPaymentsByStatus,
  getOverdueSupplierPayments,
  getTotalSupplierPaymentsByBooking,
  createSupplierPayment,
  getSuppliers,
  createSupplier,
  deleteSupplier,
} from '@/lib/services/supplier-payments'
import {
  calculateTrueProfit,
  calculateTrueProfitForBookings,
  getProfitSummary,
} from '@/lib/services/profit-calculation'
import {
  getCommissions,
  getCommissionsByAgent,
  getCommissionStatement,
  getCommissionRules,
  updateCommissionStatus,
  approveCommissions,
  markCommissionsAsPaid,
  createCommissionForBooking,
} from '@/lib/services/commissions'
import {
  createCancellationRequest,
  getCancellationRequests,
  getCancellationRequestById,
  approveCancellationRequest,
  rejectCancellationRequest,
  createRefund,
  getRefunds,
  getRefundDetail,
  updateRefundStatus,
  markRefundsAsPaid,
} from '@/lib/services/refunds'
import type {
  Expense,
  SupplierPayment,
  Commission,
  Refund,
  CancellationRequest,
  CreateCancellationFormData,
  AddExpenseFormData,
  MarkSupplierPaymentFormData,
  ProcessRefundFormData,
  Supplier,
  CreateSupplierPaymentFormData,
} from '@/types/finance'
import type { Booking } from '@/types'

// ── EXPENSES — existing actions (kept for backward compat) ────────────────────
export async function fetchExpenses(): Promise<Expense[]> {
  return getExpenses()
}

export async function addExpenseAction(formData: AddExpenseFormData): Promise<Expense> {
  return addExpense(formData)
}

export async function fetchExpensesByCategory(): Promise<{ category: string; total: number }[]> {
  return getExpensesByCategory()
}

// ── EXPENSES — new enterprise actions ─────────────────────────────────────────

import * as expenseSvc from '@/lib/services/expenses'
import * as vendorSvc from '@/lib/services/expense-vendors'
import * as categorySvc from '@/lib/services/expense-categories'
import * as attachmentSvc from '@/lib/services/expense-attachments'
import * as approvalSvc from '@/lib/services/expense-approvals'
import * as budgetSvc from '@/lib/services/expense-budgets'
import * as reportSvc from '@/lib/services/expense-reports'
import * as aiSvc from '@/lib/services/expense-ai'

export async function fetchExpensesWithRelations(...args: Parameters<typeof expenseSvc.getExpensesWithRelations>) { return expenseSvc.getExpensesWithRelations(...args) }
export async function fetchExpenseById(...args: Parameters<typeof expenseSvc.getExpenseById>) { return expenseSvc.getExpenseById(...args) }
export async function createExpenseAction(...args: Parameters<typeof expenseSvc.createExpense>) { return expenseSvc.createExpense(...args) }
export async function updateExpenseAction(...args: Parameters<typeof expenseSvc.updateExpense>) { return expenseSvc.updateExpense(...args) }
export async function deleteExpenseAction(...args: Parameters<typeof expenseSvc.deleteExpense>) { return expenseSvc.deleteExpense(...args) }
export async function duplicateExpenseAction(...args: Parameters<typeof expenseSvc.duplicateExpense>) { return expenseSvc.duplicateExpense(...args) }
export async function archiveExpenseAction(...args: Parameters<typeof expenseSvc.archiveExpense>) { return expenseSvc.archiveExpense(...args) }
export async function markExpensePaidAction(...args: Parameters<typeof expenseSvc.markExpensePaid>) { return expenseSvc.markExpensePaid(...args) }
export async function generateExpenseNumberAction(...args: Parameters<typeof expenseSvc.generateExpenseNumber>) { return expenseSvc.generateExpenseNumber(...args) }
export async function fetchExpenseKPIs(...args: Parameters<typeof expenseSvc.getExpenseKPIs>) { return expenseSvc.getExpenseKPIs(...args) }
export async function fetchExpenseChartData(...args: Parameters<typeof expenseSvc.getExpenseChartData>) { return expenseSvc.getExpenseChartData(...args) }

export async function fetchVendors(...args: Parameters<typeof vendorSvc.getVendors>) { return vendorSvc.getVendors(...args) }
export async function createVendorAction(...args: Parameters<typeof vendorSvc.createVendor>) { return vendorSvc.createVendor(...args) }
export async function updateVendorAction(...args: Parameters<typeof vendorSvc.updateVendor>) { return vendorSvc.updateVendor(...args) }
export async function deleteVendorAction(...args: Parameters<typeof vendorSvc.deleteVendor>) { return vendorSvc.deleteVendor(...args) }

export async function fetchExpenseCategories(...args: Parameters<typeof categorySvc.getExpenseCategories>) { return categorySvc.getExpenseCategories(...args) }
export async function createExpenseCategoryAction(...args: Parameters<typeof categorySvc.createExpenseCategory>) { return categorySvc.createExpenseCategory(...args) }
export async function updateExpenseCategoryAction(...args: Parameters<typeof categorySvc.updateExpenseCategory>) { return categorySvc.updateExpenseCategory(...args) }
export async function deleteExpenseCategoryAction(...args: Parameters<typeof categorySvc.deleteExpenseCategory>) { return categorySvc.deleteExpenseCategory(...args) }

export async function fetchExpenseAttachments(...args: Parameters<typeof attachmentSvc.getExpenseAttachments>) { return attachmentSvc.getExpenseAttachments(...args) }
export async function uploadExpenseAttachmentAction(...args: Parameters<typeof attachmentSvc.uploadExpenseAttachment>) { return attachmentSvc.uploadExpenseAttachment(...args) }
export async function deleteExpenseAttachmentAction(...args: Parameters<typeof attachmentSvc.deleteExpenseAttachment>) { return attachmentSvc.deleteExpenseAttachment(...args) }
export async function findDuplicateAttachmentAction(...args: Parameters<typeof attachmentSvc.findDuplicateAttachment>) { return attachmentSvc.findDuplicateAttachment(...args) }
export async function reorderAttachmentPagesAction(...args: Parameters<typeof attachmentSvc.reorderAttachmentPages>) { return attachmentSvc.reorderAttachmentPages(...args) }

export async function fetchExpenseApprovals(...args: Parameters<typeof approvalSvc.getExpenseApprovals>) { return approvalSvc.getExpenseApprovals(...args) }
export async function submitExpenseApprovalAction(...args: Parameters<typeof approvalSvc.submitExpenseApproval>) { return approvalSvc.submitExpenseApproval(...args) }


export async function fetchExpenseBudgets(...args: Parameters<typeof budgetSvc.getExpenseBudgets>) { return budgetSvc.getExpenseBudgets(...args) }
export async function createExpenseBudgetAction(...args: Parameters<typeof budgetSvc.createExpenseBudget>) { return budgetSvc.createExpenseBudget(...args) }
export async function updateExpenseBudgetAction(...args: Parameters<typeof budgetSvc.updateExpenseBudget>) { return budgetSvc.updateExpenseBudget(...args) }
export async function deleteExpenseBudgetAction(...args: Parameters<typeof budgetSvc.deleteExpenseBudget>) { return budgetSvc.deleteExpenseBudget(...args) }
export async function fetchBudgetUtilization(...args: Parameters<typeof budgetSvc.getTotalBudgetUtilization>) { return budgetSvc.getTotalBudgetUtilization(...args) }

export async function generateExpenseReportAction(...args: Parameters<typeof reportSvc.generateReportData>) { return reportSvc.generateReportData(...args) }
export async function exportExpensesCSVAction(...args: Parameters<typeof reportSvc.exportExpensesCSV>) { return reportSvc.exportExpensesCSV(...args) }

export async function extractReceiptDataAction(...args: Parameters<typeof aiSvc.extractReceiptData>) { return aiSvc.extractReceiptData(...args) }
export async function checkPolicyComplianceAction(...args: Parameters<typeof aiSvc.checkPolicyCompliance>) { return aiSvc.checkPolicyCompliance(...args) }
export async function suggestExpenseCategoryAction(...args: Parameters<typeof aiSvc.suggestExpenseCategory>) { return aiSvc.suggestExpenseCategory(...args) }

// SUPPLIER PAYMENTS
export async function fetchSupplierPayments(): Promise<SupplierPayment[]> {
  return getSupplierPayments()
}

export async function markSupplierPaymentPaidAction(
  formData: MarkSupplierPaymentFormData
): Promise<void> {
  return markSupplierPaymentAsPaid(formData)
}

export async function fetchOverdueSupplierPayments(): Promise<SupplierPayment[]> {
  return getOverdueSupplierPayments()
}

// ── OPERATIONS: Supplier Payments ─────────────────────────────────────────────

/**
 * Load real suppliers from the suppliers table for the Operations payment form.
 * Never returns fake/hardcoded data — authenticated via server session.
 */
export async function fetchSuppliersAction(): Promise<Supplier[]> {
  return getSuppliers()
}

export async function createSupplierAction(payload: {
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  category?: string
}): Promise<Supplier> {
  return createSupplier(payload)
}

export async function deleteSupplierAction(id: string): Promise<void> {
  return deleteSupplier(id)
}

/**
 * Create ONE supplier payment record in the existing supplier_payments table.
 * The authenticated user's ID is resolved server-side — never hardcoded.
 * Status is set to 'pending' so Finance immediately sees it.
 */
export async function createSupplierPaymentAction(
  formData: CreateSupplierPaymentFormData
): Promise<SupplierPayment> {
  return createSupplierPayment(formData)
}

/**
 * Operations views the same supplier_payments table as Finance.
 * One source of truth — no duplication.
 */
export async function fetchMySupplierPaymentsAction(): Promise<SupplierPayment[]> {
  return getSupplierPayments()
}


// PROFIT CALCULATION
export async function calculateTrueProfitAction(booking: Booking) {
  return calculateTrueProfit(booking)
}

export async function fetchProfitSummary() {
  return getProfitSummary()
}

// COMMISSIONS
export async function fetchCommissions(): Promise<Commission[]> {
  return getCommissions()
}

export async function fetchCommissionRules() {
  return getCommissionRules()
}

export async function approveCommissionsAction(commissionIds: string[]): Promise<void> {
  return approveCommissions(commissionIds)
}

export async function markCommissionsAsPaidAction(commissionIds: string[]): Promise<void> {
  return markCommissionsAsPaid(commissionIds)
}

export async function createCommissionAction(bookingId: string, agentId: string): Promise<Commission> {
  return createCommissionForBooking(bookingId, agentId)
}

// CANCELLATIONS
export async function createCancellationAction(
  formData: CreateCancellationFormData
): Promise<CancellationRequest> {
  return createCancellationRequest(formData)
}

export async function fetchCancellationRequests(): Promise<CancellationRequest[]> {
  return getCancellationRequests()
}

export async function approveCancellationAction(cancellationId: string): Promise<void> {
  return approveCancellationRequest(cancellationId)
}

export async function rejectCancellationAction(cancellationId: string): Promise<void> {
  return rejectCancellationRequest(cancellationId)
}

// REFUNDS
export async function createRefundAction(formData: ProcessRefundFormData): Promise<Refund> {
  return createRefund(formData)
}

export async function fetchRefunds(): Promise<Refund[]> {
  return getRefunds()
}

export async function fetchRefundDetail(refundId: string) {
  return getRefundDetail(refundId)
}

export async function updateRefundStatusAction(refundId: string, status: any): Promise<void> {
  return updateRefundStatus(refundId, status)
}

export async function markRefundsPaidAction(refundIds: string[]): Promise<void> {
  return markRefundsAsPaid(refundIds)
}

// ── DEPARTMENT EXPENSE ACTIONS ─────────────────────────────────────────────────

import * as deptInsightSvc from '@/lib/services/dept-expense-insight'

export async function getDeptExpenseSummaryAction(department: string) {
  return deptInsightSvc.getDeptExpenseSummary(department)
}

export async function getDeptSpendingInsightAction(department: string) {
  return deptInsightSvc.getDeptSpendingInsight(department)
}

export async function getDeptBudgetIndicatorAction(department: string, category: string) {
  return deptInsightSvc.getDeptBudgetIndicator(department, category)
}

/** Fetch expenses scoped to a specific department with optional filters */
export async function fetchDeptExpensesAction(params: {
  department: string
  approval_status?: string
  category?: string
  date_from?: string
  date_to?: string
  search?: string
  limit?: number
  offset?: number
}) {
  return expenseSvc.getExpensesWithRelations(params)
}

/**
 * Department employee submits an expense.
 * Delegates to the existing createExpense() — same table, same record.
 * Sets submission_source='department' so Finance can filter.
 */
export async function submitDeptExpenseAction(
  ...args: Parameters<typeof expenseSvc.createExpense>
) {
  // createExpense handles approval chain creation and threshold routing
  return expenseSvc.createExpense(...args)
}

export async function directApproveExpenseAction(expenseId: string) {
  return await approvalSvc.directApproveExpense(expenseId)
}

export async function directRejectExpenseAction(expenseId: string, reason: string) {
  return await approvalSvc.directRejectExpense(expenseId, reason)
}
