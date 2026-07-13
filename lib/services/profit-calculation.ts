'use server'

import { createClient } from '@/lib/supabase/server'
import type { Booking, ProfitCalculation } from '@/types/finance'
import { getTotalExpensesByBooking } from './expenses'
import { getTotalSupplierPaymentsByBooking } from './supplier-payments'

/**
 * Calculate true profit for a booking
 * true_profit = total_revenue - total_cost - expenses - supplier_payments (paid only)
 */
export async function calculateTrueProfit(booking: Booking): Promise<ProfitCalculation> {
  const supabase = await createClient()

  // Get booking details with total_revenue and total_cost
  const { data: bookingData, error } = await supabase
    .from('bookings')
    .select('total_revenue, total_cost')
    .eq('id', booking.id)
    .single()

  if (error) throw new Error(`Failed to fetch booking: ${error.message}`)

  const totalRevenue = bookingData.total_revenue || 0
  const totalCost = bookingData.total_cost || 0

  // Get expenses total
  const expensesTotal = await getTotalExpensesByBooking(booking.id)

  // Get supplier payments total (paid only)
  const supplierPaymentsTotal = await getTotalSupplierPaymentsByBooking(booking.id)

  // Calculate true profit
  const trueProfit = totalRevenue - totalCost - expensesTotal - supplierPaymentsTotal

  return {
    total_revenue: totalRevenue,
    total_cost: totalCost,
    expenses_total: expensesTotal,
    supplier_payments_total: supplierPaymentsTotal,
    true_profit: trueProfit,
  }
}

/**
 * Get true profit for multiple bookings
 */
export async function calculateTrueProfitForBookings(
  bookingIds: string[]
): Promise<{ [bookingId: string]: ProfitCalculation }> {
  const supabase = await createClient()
  const results: { [bookingId: string]: ProfitCalculation } = {}

  // Fetch all bookings
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, total_revenue, total_cost')
    .in('id', bookingIds)

  if (error) throw new Error(`Failed to fetch bookings: ${error.message}`)

  // Fetch all expenses for these bookings
  const { data: expenses } = await supabase
    .from('expenses')
    .select('booking_id, amount')
    .in('booking_id', bookingIds)

  // Fetch all paid supplier payments for these bookings
  const { data: supplierPayments } = await supabase
    .from('supplier_payments')
    .select('booking_id, amount')
    .in('booking_id', bookingIds)
    .eq('status', 'paid')

  // Build summary maps
  const expensesByBooking: { [key: string]: number } = {}
  const supplierPaymentsByBooking: { [key: string]: number } = {}

  ;(expenses || []).forEach((e) => {
    expensesByBooking[e.booking_id] = (expensesByBooking[e.booking_id] || 0) + e.amount
  })

  ;(supplierPayments || []).forEach((p) => {
    supplierPaymentsByBooking[p.booking_id] = (supplierPaymentsByBooking[p.booking_id] || 0) + p.amount
  })

  // Calculate profit for each booking
  ;(bookings || []).forEach((booking) => {
    const trueProfit =
      booking.total_revenue -
      booking.total_cost -
      (expensesByBooking[booking.id] || 0) -
      (supplierPaymentsByBooking[booking.id] || 0)

    results[booking.id] = {
      total_revenue: booking.total_revenue || 0,
      total_cost: booking.total_cost || 0,
      expenses_total: expensesByBooking[booking.id] || 0,
      supplier_payments_total: supplierPaymentsByBooking[booking.id] || 0,
      true_profit: trueProfit,
    }
  })

  return results
}

/**
 * Get profit summary for analytics
 */
export async function getProfitSummary(): Promise<{
  total_revenue: number
  total_cost: number
  total_expenses: number
  total_supplier_payments: number
  total_profit: number
  margin_percentage: number
}> {
  const supabase = await createClient()

  // Get all bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('total_revenue, total_cost')

  // Get all expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount')

  // Get all paid supplier payments
  const { data: supplierPayments } = await supabase
    .from('supplier_payments')
    .select('amount')
    .eq('status', 'paid')

  const totalRevenue = (bookings || []).reduce((sum, b) => sum + (b.total_revenue || 0), 0)
  const totalCost = (bookings || []).reduce((sum, b) => sum + (b.total_cost || 0), 0)
  const totalExpenses = (expenses || []).reduce((sum, e) => sum + e.amount, 0)
  const totalSupplierPayments = (supplierPayments || []).reduce((sum, p) => sum + p.amount, 0)
  const totalProfit = totalRevenue - totalCost - totalExpenses - totalSupplierPayments
  const marginPercentage = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  return {
    total_revenue: totalRevenue,
    total_cost: totalCost,
    total_expenses: totalExpenses,
    total_supplier_payments: totalSupplierPayments,
    total_profit: totalProfit,
    margin_percentage: marginPercentage,
  }
}
