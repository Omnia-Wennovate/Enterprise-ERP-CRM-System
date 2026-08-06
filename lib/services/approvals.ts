'use server'

import { createClient } from '@/lib/supabase/server'
import type { InvoiceApproval } from '@/types/finance'

export async function getInvoiceApprovals(invoiceId: string): Promise<InvoiceApproval[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoice_approvals')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to fetch approvals: ${error.message}`)
  return data || []
}

export async function requestApproval(invoiceId: string): Promise<void> {
  const supabase = await createClient()

  // Define approval workflow
  const approvers = [
    { approver_role: 'Finance Officer' },
    { approver_role: 'Finance Manager' },
    { approver_role: 'Director' }
  ]

  const { error } = await supabase
    .from('invoice_approvals')
    .insert(
      approvers.map(a => ({
        invoice_id: invoiceId,
        approver_role: a.approver_role,
        status: 'pending'
      }))
    )

  if (error) throw new Error(`Failed to request approval: ${error.message}`)

  // Update invoice status to pending_approval
  await supabase
    .from('invoices')
    .update({ approval_status: 'pending' })
    .eq('id', invoiceId)
}

export async function submitApproval(approvalId: string, invoiceId: string, status: 'approved' | 'rejected', comments?: string): Promise<void> {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user?.id

  const { error } = await supabase
    .from('invoice_approvals')
    .update({
      status,
      comments,
      approver_id: user,
      approved_at: new Date().toISOString()
    })
    .eq('id', approvalId)

  if (error) throw new Error(`Failed to submit approval: ${error.message}`)

  if (status === 'rejected') {
    await supabase
      .from('invoices')
      .update({ approval_status: 'rejected' })
      .eq('id', invoiceId)
  } else {
    // Check if all approvals are complete
    const { data: pendingApprovals } = await supabase
      .from('invoice_approvals')
      .select('id')
      .eq('invoice_id', invoiceId)
      .eq('status', 'pending')

    if (!pendingApprovals || pendingApprovals.length === 0) {
      await supabase
        .from('invoices')
        .update({ approval_status: 'approved', status: 'sent' })
        .eq('id', invoiceId)
    }
  }
}

export async function getApprovalThreshold(): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('finance_settings')
    .select('approval_threshold_amount')
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch approval threshold: ${error.message}`)
  }

  return data?.approval_threshold_amount || 5000
}
