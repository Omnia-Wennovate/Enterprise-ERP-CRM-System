'use server'

import { createClient } from '@/lib/supabase/server'

export interface AgingReport {
  bucket: '1-15' | '16-30' | '31-60' | '60+'
  total_amount: number
  invoice_count: number
}

export async function getAgingReport(): Promise<AgingReport[]> {
  const supabase = await createClient()
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('id, total_amount, due_date')
    .in('status', ['sent', 'partially_paid', 'overdue'])

  if (error) throw new Error(`Failed to fetch aging report data: ${error.message}`)

  const now = new Date()
  const report: Record<string, AgingReport> = {
    '1-15': { bucket: '1-15', total_amount: 0, invoice_count: 0 },
    '16-30': { bucket: '16-30', total_amount: 0, invoice_count: 0 },
    '31-60': { bucket: '31-60', total_amount: 0, invoice_count: 0 },
    '60+': { bucket: '60+', total_amount: 0, invoice_count: 0 }
  }

  // Pre-calculate outstanding for all invoices
  // In a real app we'd fetch payments or compute outstanding using SQL views
  for (const inv of invoices || []) {
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('invoice_id', inv.id)
      
    const paid = (payments || []).reduce((acc, p) => acc + p.amount, 0)
    const outstanding = inv.total_amount - paid
    
    if (outstanding <= 0) continue

    const dueDate = new Date(inv.due_date)
    const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24))

    if (diffDays > 0) {
      let bucketKey = ''
      if (diffDays <= 15) bucketKey = '1-15'
      else if (diffDays <= 30) bucketKey = '16-30'
      else if (diffDays <= 60) bucketKey = '31-60'
      else bucketKey = '60+'

      report[bucketKey].total_amount += outstanding
      report[bucketKey].invoice_count += 1
    }
  }

  return Object.values(report)
}
