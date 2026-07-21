'use server'

import { createClient } from '@/lib/supabase/server'
import type { Commission, CommissionRule, CommissionStatement, CommissionStatus } from '@/types/finance'
import { calculateTrueProfit } from './profit-calculation'

// Get active commission rule
export async function getActiveCommissionRule(role: string): Promise<CommissionRule | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('commission_rules')
    .select('*')
    .eq('role', role)
    .eq('is_active', true)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch commission rule: ${error.message}`)
  }

  return data || null
}

// Calculate and create commission for completed booking
export async function createCommissionForBooking(bookingId: string, agentId: string): Promise<Commission> {
  const supabase = await createClient()

  // Get booking details
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (bookingError) throw new Error(`Booking not found`)

  // Get commission rule
  const rule = await getActiveCommissionRule('sales_agent')
  if (!rule) throw new Error(`No active commission rule for sales agents`)

  // Calculate base amount
  let baseAmount = booking.total_revenue
  if (rule.applies_to === 'profit') {
    const profitCalc = await calculateTrueProfit(booking)
    baseAmount = profitCalc.true_profit
  }

  // Calculate commission
  const commissionAmount = rule.rule_type === 'percentage' ? (baseAmount * rule.rate) / 100 : rule.rate

  // Get current period
  const now = new Date()
  const periodMonth = now.getMonth() + 1
  const periodYear = now.getFullYear()

  // Create commission
  const { data: commission, error: commissionError } = await supabase
    .from('commissions')
    .insert([
      {
        booking_id: bookingId,
        agent_id: agentId,
        rule_id: rule.id,
        base_amount: baseAmount,
        commission_amount: commissionAmount,
        status: 'pending',
        period_month: periodMonth,
        period_year: periodYear,
      },
    ])
    .select()
    .single()

  if (commissionError) throw new Error(`Failed to create commission: ${commissionError.message}`)

  // Create timeline event
  await supabase.from('booking_timeline_events').insert([
    {
      booking_id: bookingId,
      event_type: 'commission_calculated',
      description: `Commission calculated: ${commissionAmount}`,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    },
  ])

  return commission
}

// Get commissions
export async function getCommissions(): Promise<Commission[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('commissions')
    .select('*')
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })

  if (error) throw new Error(`Failed to fetch commissions: ${error.message}`)
  return data || []
}

// Get commissions by agent
export async function getCommissionsByAgent(agentId: string): Promise<Commission[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('agent_id', agentId)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })

  if (error) throw new Error(`Failed to fetch commissions: ${error.message}`)
  return data || []
}

// Get commission statement for agent (monthly)
export async function getCommissionStatement(agentId: string, month: number, year: number): Promise<CommissionStatement> {
  const supabase = await createClient()

  // Get profile info
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', agentId)
    .single()

  // Get commissions for period
  const { data: commissions } = await supabase
    .from('commissions')
    .select('*')
    .eq('agent_id', agentId)
    .eq('period_month', month)
    .eq('period_year', year)

  const commissionsList = commissions || []
  const totalBaseAmount = commissionsList.reduce((sum, c) => sum + c.base_amount, 0)
  const totalCommission = commissionsList.reduce((sum, c) => sum + c.commission_amount, 0)

  const statusBreakdown = {
    pending: commissionsList.filter((c) => c.status === 'pending').length,
    approved: commissionsList.filter((c) => c.status === 'approved').length,
    paid: commissionsList.filter((c) => c.status === 'paid').length,
  }

  return {
    agent_id: agentId,
    agent_name: profile?.full_name || 'Unknown',
    period_month: month,
    period_year: year,
    total_base_amount: totalBaseAmount,
    total_commission: totalCommission,
    status_breakdown: statusBreakdown,
    commissions: commissionsList,
  }
}

// Update commission status
export async function updateCommissionStatus(commissionId: string, status: CommissionStatus): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('commissions')
    .update({ status })
    .eq('id', commissionId)

  if (error) throw new Error(`Failed to update commission: ${error.message}`)
}

// Approve commissions (bulk)
export async function approveCommissions(commissionIds: string[]): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('commissions')
    .update({ status: 'approved' })
    .in('id', commissionIds)

  if (error) throw new Error(`Failed to approve commissions: ${error.message}`)
}

// Mark commissions as paid (bulk)
export async function markCommissionsAsPaid(commissionIds: string[]): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('commissions')
    .update({ status: 'paid' })
    .in('id', commissionIds)

  if (error) throw new Error(`Failed to mark commissions as paid: ${error.message}`)
}

// Get commission rules
export async function getCommissionRules(): Promise<CommissionRule[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('commission_rules')
    .select('*')
    .order('role')

  if (error) throw new Error(`Failed to fetch commission rules: ${error.message}`)
  return data || []
}

// Update commission rule
export async function updateCommissionRule(
  ruleId: string,
  updates: Partial<CommissionRule>
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('commission_rules')
    .update(updates)
    .eq('id', ruleId)

  if (error) throw new Error(`Failed to update commission rule: ${error.message}`)
}
