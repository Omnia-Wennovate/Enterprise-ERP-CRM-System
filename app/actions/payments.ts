'use server'

import * as dashSvc from '@/lib/services/payment-dashboard'
import type { PaymentFilter } from '@/types/finance'

// ── KPIs ─────────────────────────────────────────────────────────────────────
export async function fetchPaymentKPIs(
  startDate: string, endDate: string,
  prevStartDate: string, prevEndDate: string,
  periodLabel: string, compareLabel: string
) {
  return dashSvc.getPaymentKPIs(startDate, endDate, prevStartDate, prevEndDate, periodLabel, compareLabel)
}

// ── Charts ───────────────────────────────────────────────────────────────────
export async function fetchPaymentChartData(startDate: string, endDate: string) {
  return dashSvc.getPaymentChartData(startDate, endDate)
}

// ── Aging ────────────────────────────────────────────────────────────────────
export async function fetchPaymentAgingBuckets() {
  return dashSvc.getPaymentAgingBuckets()
}

// ── Collection Health Score ──────────────────────────────────────────────────
export async function fetchCollectionHealthScore() {
  return dashSvc.getCollectionHealthScore()
}

// ── Smart Summary ────────────────────────────────────────────────────────────
export async function fetchSmartCollectionSummary(
  startDate: string, endDate: string,
  prevStartDate: string, prevEndDate: string
) {
  return dashSvc.getSmartCollectionSummary(startDate, endDate, prevStartDate, prevEndDate)
}

// ── Payments Table (paginated, filtered) ─────────────────────────────────────
export async function fetchPaymentsWithRelations(filter: PaymentFilter) {
  return dashSvc.getPaymentsWithRelations(filter)
}

// ── Activity Feed ────────────────────────────────────────────────────────────
export async function fetchRecentPaymentActivity(limit?: number) {
  return dashSvc.getRecentPaymentActivity(limit)
}

// ── Cash Flow Forecast ───────────────────────────────────────────────────────
export async function fetchCashFlowForecast() {
  return dashSvc.getCashFlowForecast()
}

// ── Payment Method Reliability ───────────────────────────────────────────────
export async function fetchPaymentMethodReliability() {
  return dashSvc.getPaymentMethodReliability()
}

// ── Collections Intelligence ─────────────────────────────────────────────────
export async function fetchCollectionsIntelligence() {
  return dashSvc.getCollectionsIntelligence()
}

// ── Customer Leaderboard ─────────────────────────────────────────────────────
export async function fetchPaymentCustomerLeaderboard(startDate: string, endDate: string) {
  return dashSvc.getPaymentCustomerLeaderboard(startDate, endDate)
}

// ── Hero Summary ─────────────────────────────────────────────────────────────
export async function fetchPaymentHeroSummary() {
  return dashSvc.getPaymentHeroSummary()
}

// ── Record Payment (with multi-invoice allocation) ───────────────────────────
export async function recordPaymentAction(formData: {
  invoice_id?: string
  amount: number
  payment_method: string
  payment_date: string
  reference_number?: string
  notes?: string
  allocations?: Array<{ invoice_id: string; amount: number }>
}) {
  return dashSvc.recordPaymentWithAllocations(formData)
}

// ── Duplicate Detection ──────────────────────────────────────────────────────
export async function checkDuplicatePaymentAction(
  customerId: string,
  amount: number,
  paymentMethod: string
) {
  return dashSvc.checkDuplicatePayment(customerId, amount, paymentMethod)
}

// ── Payment Allocations ──────────────────────────────────────────────────────
export async function fetchPaymentAllocations(paymentId: string) {
  return dashSvc.getPaymentAllocations(paymentId)
}

// ── Customer Outstanding Invoices ────────────────────────────────────────────
export async function fetchCustomerOutstandingInvoices(customerId: string) {
  return dashSvc.getCustomerOutstandingInvoices(customerId)
}
