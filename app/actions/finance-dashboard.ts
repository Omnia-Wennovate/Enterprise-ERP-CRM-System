'use server'

import {
  getFinanceDashboardKPIs,
  getCashFlowData,
  getFinancialAlerts,
  getFinanceActivityTimeline,
  getReconciliationCheck,
  getExecutiveNarrative,
  getRevenueCurrencyBreakdown,
} from '@/lib/services/finance-dashboard'

import {
  getPeriodLocks,
  isPeriodLocked,
  lockPeriod,
  unlockPeriod,
  checkRecordInLockedPeriod,
} from '@/lib/services/finance-period-locks'

export async function fetchFinanceDashboardKPIs(baseCurrency?: string) {
  return getFinanceDashboardKPIs(baseCurrency)
}

export async function fetchCashFlowData(period: '7d' | '30d' | '3m' | '6m' | '12m') {
  return getCashFlowData(period)
}

export async function fetchFinancialAlerts() {
  return getFinancialAlerts()
}

export async function fetchFinanceActivityTimeline(limit?: number) {
  return getFinanceActivityTimeline(limit)
}

export async function fetchReconciliationCheck() {
  return getReconciliationCheck()
}

export async function fetchRevenueCurrencyBreakdown() {
  return getRevenueCurrencyBreakdown()
}

export async function buildExecutiveNarrative(kpis: Awaited<ReturnType<typeof getFinanceDashboardKPIs>>) {
  return getExecutiveNarrative(kpis)
}

// Period locks
export async function fetchPeriodLocks() { return getPeriodLocks() }
export async function checkPeriodLocked(month: number, year: number) { return isPeriodLocked(month, year) }
export async function lockPeriodAction(month: number, year: number) { return lockPeriod(month, year) }
export async function unlockPeriodAction(month: number, year: number, reason: string) { return unlockPeriod(month, year, reason) }
export async function checkRecordPeriodLock(dateStr: string) { return checkRecordInLockedPeriod(dateStr) }
