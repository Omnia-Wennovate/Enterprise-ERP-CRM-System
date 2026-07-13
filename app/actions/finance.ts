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
} from '@/types/finance'
import type { Booking } from '@/types'

// EXPENSES
export async function fetchExpenses(): Promise<Expense[]> {
  return getExpenses()
}

export async function addExpenseAction(formData: AddExpenseFormData): Promise<Expense> {
  return addExpense(formData)
}

export async function fetchExpensesByCategory(): Promise<{ category: string; total: number }[]> {
  return getExpensesByCategory()
}

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
