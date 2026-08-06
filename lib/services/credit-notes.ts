'use server'

import { createClient } from '@/lib/supabase/server'
import type { CreditNote } from '@/types/finance'

export async function getCreditNotes(invoiceId?: string): Promise<CreditNote[]> {
  const supabase = await createClient()
  
  let query = supabase.from('credit_notes').select('*').order('created_at', { ascending: false })
  
  if (invoiceId) {
    query = query.eq('original_invoice_id', invoiceId)
  }

  const { data, error } = await query

  if (error) throw new Error(`Failed to fetch credit notes: ${error.message}`)
  return data || []
}

export async function issueCreditNote(invoiceId: string, amount: number, reason: string): Promise<CreditNote> {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user?.id

  // Generate credit note number
  const today = new Date()
  const year = today.getFullYear()
  const { count } = await supabase
    .from('credit_notes')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`)
    
  const sequence = String((count || 0) + 1).padStart(4, '0')
  const creditNumber = `CN-${year}-${sequence}`

  const { data, error } = await supabase
    .from('credit_notes')
    .insert([
      {
        original_invoice_id: invoiceId,
        credit_number: creditNumber,
        amount,
        reason,
        issued_by: user
      }
    ])
    .select()
    .single()

  if (error) throw new Error(`Failed to issue credit note: ${error.message}`)

  // Subtract amount from invoice total or handle outstanding balance
  // (In a real system, we might update the invoice total or keep it separate as an adjustment)

  return data
}
