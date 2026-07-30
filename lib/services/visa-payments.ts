'use server'

// ============================================================================
// VISA PAYMENTS SERVICE
// lib/services/visa-payments.ts
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import type { VisaFee } from '@/types/visa'

export async function getVisaFee(visaApplicationId: string): Promise<VisaFee | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('visa_fees')
    .select('*')
    .eq('visa_application_id', visaApplicationId)
    .maybeSingle()

  if (error) throw new Error(`Failed to fetch fee: ${error.message}`)
  return data
}

export async function upsertVisaFee(fee: Partial<VisaFee>): Promise<VisaFee> {
  const supabase = await createClient()
  
  // Check if exists
  const { data: existing } = await supabase
    .from('visa_fees')
    .select('id')
    .eq('visa_application_id', fee.visa_application_id)
    .maybeSingle()

  let result
  if (existing) {
    const { data, error } = await supabase
      .from('visa_fees')
      .update({ ...fee, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw new Error(`Failed to update fee: ${error.message}`)
    result = data
  } else {
    const { data, error } = await supabase
      .from('visa_fees')
      .insert([fee])
      .select()
      .single()
    if (error) throw new Error(`Failed to create fee: ${error.message}`)
    result = data
  }

  await supabase.from('visa_timeline_events').insert([{
    visa_application_id: fee.visa_application_id,
    event_type: 'fee_updated',
    title: 'Fees Updated',
    description: `Payment status: ${result.payment_status}, Total: $${result.total_amount}`,
  }])

  return result
}
