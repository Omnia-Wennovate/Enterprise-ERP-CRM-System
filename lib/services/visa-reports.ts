'use server'

// ============================================================================
// VISA REPORTS SERVICE
// lib/services/visa-reports.ts
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import type { VisaApplication } from '@/types/visa'

export async function generateVisaReport(startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('visa_applications')
    .select(`
      id, booking_id, destination_country, visa_type, status, priority,
      submission_date, expected_decision_date, decision_date, created_at,
      booking_travelers!visa_applications_traveler_id_fkey(first_name, last_name, nationality, passport_number)
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to generate report: ${error.message}`)
  
  return data.map((row: any) => ({
    'Application ID': row.id,
    'Traveler': `${row.booking_travelers?.first_name} ${row.booking_travelers?.last_name}`,
    'Nationality': row.booking_travelers?.nationality,
    'Passport': row.booking_travelers?.passport_number,
    'Destination': row.destination_country,
    'Visa Type': row.visa_type,
    'Status': row.status,
    'Priority': row.priority,
    'Submission Date': row.submission_date || 'N/A',
    'Decision Date': row.decision_date || 'N/A',
    'Processing Days': row.submission_date && row.decision_date 
      ? Math.ceil((new Date(row.decision_date).getTime() - new Date(row.submission_date).getTime()) / (1000 * 60 * 60 * 24))
      : 'N/A'
  }))
}

export async function generateRevenueReport(startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('visa_fees')
    .select(`
      *,
      visa_applications!inner(destination_country, visa_type, created_at)
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .eq('payment_status', 'paid')

  if (error) throw new Error(`Failed to generate revenue report: ${error.message}`)

  let totalRevenue = 0
  let totalProfit = 0
  
  const formattedData = data.map((row: any) => {
    totalRevenue += row.total_amount || 0
    totalProfit += (row.agency_fee || 0) + (row.service_fee || 0)
    
    return {
      'Destination': row.visa_applications.destination_country,
      'Visa Type': row.visa_applications.visa_type,
      'Gov Fee': row.government_fee,
      'Agency Fee': row.agency_fee,
      'Service Fee': row.service_fee,
      'Total Amount': row.total_amount,
      'Payment Date': row.payment_date || row.created_at
    }
  })

  return { data: formattedData, summary: { totalRevenue, totalProfit } }
}
