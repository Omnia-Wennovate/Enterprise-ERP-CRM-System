'use server'

import { createClient } from '@/lib/supabase/server'
import type { ExpenseApproval } from '@/types/finance'
import { notifyExpenseApproved, notifyExpenseRejected } from '@/lib/services/expense-notifications'

const APPROVAL_WORKFLOW = [
  { step: 1, approver_role: 'Department Manager' },
  { step: 2, approver_role: 'Finance Officer' },
  { step: 3, approver_role: 'Finance Manager' },
  { step: 4, approver_role: 'Director' },
]

// ── Create approval chain for expense ────────────────────────────────────────

export async function createExpenseApprovalChain(expenseId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('expense_approvals')
    .insert(
      APPROVAL_WORKFLOW.map((step) => ({
        expense_id: expenseId,
        step: step.step,
        approver_role: step.approver_role,
        status: 'pending',
      }))
    )

  if (error) throw new Error(`Failed to create approval chain: ${error.message}`)

  await supabase
    .from('expenses')
    .update({ approval_status: 'pending' })
    .eq('id', expenseId)
}

// ── Get approval timeline ─────────────────────────────────────────────────────

export async function getExpenseApprovals(expenseId: string): Promise<ExpenseApproval[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expense_approvals')
    .select(`*, profiles!expense_approvals_approver_id_fkey(first_name, last_name)`)
    .eq('expense_id', expenseId)
    .order('step')

  if (error) throw new Error(`Failed to fetch approvals: ${error.message}`)

  return (data || []).map((row: Record<string, unknown>) => {
    const profile = row.profiles as { first_name?: string; last_name?: string } | null
    return {
      ...row,
      approver_name: profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || null
        : null,
    } as ExpenseApproval
  })
}

// ── Submit approval step ──────────────────────────────────────────────────────

export async function submitExpenseApproval(
  approvalId: string,
  expenseId: string,
  status: 'approved' | 'rejected' | 'returned',
  comments?: string
): Promise<void> {
  const supabase = await createClient()
  const userId = (await supabase.auth.getUser()).data.user?.id

  const { error } = await supabase
    .from('expense_approvals')
    .update({
      status,
      comments,
      approver_id: userId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', approvalId)

  if (error) throw new Error(`Failed to submit approval: ${error.message}`)

  if (status === 'rejected' || status === 'returned') {
    await supabase
      .from('expenses')
      .update({ approval_status: status })
      .eq('id', expenseId)

    // Notify submitting employee
    try {
      const { data: exp } = await supabase
        .from('expenses')
        .select('expense_number, employee_id')
        .eq('id', expenseId)
        .single()
      if (exp?.employee_id && exp.expense_number) {
        await notifyExpenseRejected(exp.expense_number, expenseId, comments, exp.employee_id)
      }
    } catch { /* non-fatal */ }
  } else {
    // Check if all steps complete
    const { data: pending } = await supabase
      .from('expense_approvals')
      .select('id')
      .eq('expense_id', expenseId)
      .eq('status', 'pending')

    if (!pending || pending.length === 0) {
      await supabase
        .from('expenses')
        .update({ approval_status: 'approved' })
        .eq('id', expenseId)

      // Notify submitting employee of approval
      try {
        const { data: exp } = await supabase
          .from('expenses')
          .select('expense_number, employee_id')
          .eq('id', expenseId)
          .single()
        const { data: approverProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', userId || '')
          .single()
        const approverName = approverProfile
          ? `${approverProfile.first_name || ''} ${approverProfile.last_name || ''}`.trim()
          : 'Finance'
        if (exp?.employee_id && exp.expense_number) {
          await notifyExpenseApproved(exp.expense_number, expenseId, approverName, exp.employee_id)
        }
      } catch { /* non-fatal */ }
    }
  }
}

// ── Direct Finance Controls ──────────────────────────────────────────────────

export async function directApproveExpense(expenseId: string): Promise<void> {
  const supabase = await createClient()
  const userId = (await supabase.auth.getUser()).data.user?.id

  const { error } = await supabase
    .from('expenses')
    .update({ approval_status: 'approved' })
    .eq('id', expenseId)

  if (error) throw new Error(`Failed to approve: ${error.message}`)

  // Mark pending steps as approved or skipped
  await supabase
    .from('expense_approvals')
    .update({ status: 'approved', approver_id: userId, approved_at: new Date().toISOString(), comments: 'Approved directly by Finance' })
    .eq('expense_id', expenseId)
    .eq('status', 'pending')

  // Notify
  try {
    const { data: exp } = await supabase.from('expenses').select('expense_number, employee_id').eq('id', expenseId).single()
    const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', userId || '').single()
    const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Finance'
    if (exp?.employee_id && exp.expense_number) {
      await notifyExpenseApproved(exp.expense_number, expenseId, name, exp.employee_id)
    }
  } catch { /* ignore */ }
}

export async function directRejectExpense(expenseId: string, reason: string): Promise<void> {
  const supabase = await createClient()
  const userId = (await supabase.auth.getUser()).data.user?.id

  const { error } = await supabase
    .from('expenses')
    .update({ approval_status: 'rejected' })
    .eq('id', expenseId)

  if (error) throw new Error(`Failed to reject: ${error.message}`)

  // Mark pending steps as rejected
  await supabase
    .from('expense_approvals')
    .update({ status: 'rejected', approver_id: userId, approved_at: new Date().toISOString(), comments: reason })
    .eq('expense_id', expenseId)
    .eq('status', 'pending')

  // Notify
  try {
    const { data: exp } = await supabase.from('expenses').select('expense_number, employee_id').eq('id', expenseId).single()
    if (exp?.employee_id && exp.expense_number) {
      await notifyExpenseRejected(exp.expense_number, expenseId, reason, exp.employee_id)
    }
  } catch { /* ignore */ }
}
