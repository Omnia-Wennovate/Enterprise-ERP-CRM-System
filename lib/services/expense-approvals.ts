'use server'

import { createClient } from '@/lib/supabase/server'
import type { ExpenseApproval } from '@/types/finance'

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
    }
  }
}

// ── Skip approval (Finance Admin override) ────────────────────────────────────

export async function skipExpenseApproval(expenseId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('expenses')
    .update({ approval_status: 'approved' })
    .eq('id', expenseId)

  if (error) throw new Error(`Failed to skip approval: ${error.message}`)
}
