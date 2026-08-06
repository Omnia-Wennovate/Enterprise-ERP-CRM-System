'use server'

import { createClient } from '@/lib/supabase/server'

// Reuses the existing `notifications` table directly via the server client
// (lead-notifications.ts uses the browser client, so we duplicate the insert here)

async function createExpenseNotification(params: {
  title: string
  message: string
  type: string
  recipient_id?: string
  related_to_id?: string
  related_to_type?: string
}): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from('notifications').insert({
      title: params.title,
      message: params.message,
      type: params.type,
      recipient_id: params.recipient_id || null,
      related_to_id: params.related_to_id || null,
      related_to_type: params.related_to_type || null,
    })
  } catch {
    // Non-fatal — never block the main action if notification fails
  }
}

export async function notifyExpenseSubmitted(
  expenseNumber: string,
  expenseId: string,
  submitterName?: string
): Promise<void> {
  await createExpenseNotification({
    title: 'Expense Submitted',
    message: `${submitterName || 'An employee'} submitted expense ${expenseNumber} for approval`,
    type: 'expense_submitted',
    related_to_id: expenseId,
    related_to_type: 'expense',
  })
}

export async function notifyExpenseApproved(
  expenseNumber: string,
  expenseId: string,
  approverName?: string,
  recipientId?: string
): Promise<void> {
  await createExpenseNotification({
    title: 'Expense Approved',
    message: `Expense ${expenseNumber} was approved by ${approverName || 'Finance'}`,
    type: 'expense_approved',
    recipient_id: recipientId,
    related_to_id: expenseId,
    related_to_type: 'expense',
  })
}

export async function notifyExpenseRejected(
  expenseNumber: string,
  expenseId: string,
  reason?: string,
  recipientId?: string
): Promise<void> {
  await createExpenseNotification({
    title: 'Expense Rejected',
    message: `Expense ${expenseNumber} was rejected${reason ? `: ${reason}` : ''}`,
    type: 'expense_rejected',
    recipient_id: recipientId,
    related_to_id: expenseId,
    related_to_type: 'expense',
  })
}

export async function notifyBudgetLimitReached(
  department: string,
  category: string,
  percent: number
): Promise<void> {
  const threshold = percent >= 100 ? '100%' : percent >= 90 ? '90%' : '75%'
  await createExpenseNotification({
    title: 'Budget Limit Warning',
    message: `${department || 'Budget'} (${category || 'All'}) has reached ${threshold} of its budget`,
    type: 'budget_warning',
    related_to_type: 'budget',
  })
}

export async function notifyDocumentUploaded(
  expenseNumber: string,
  expenseId: string,
  fileName: string
): Promise<void> {
  await createExpenseNotification({
    title: 'Document Uploaded',
    message: `Document "${fileName}" was attached to expense ${expenseNumber}`,
    type: 'document_uploaded',
    related_to_id: expenseId,
    related_to_type: 'expense',
  })
}

export async function notifyExpensePaid(
  expenseNumber: string,
  expenseId: string,
  amount: number,
  currency = 'USD',
  recipientId?: string
): Promise<void> {
  await createExpenseNotification({
    title: 'Expense Paid',
    message: `Expense ${expenseNumber} of ${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)} has been marked as paid`,
    type: 'expense_paid',
    recipient_id: recipientId,
    related_to_id: expenseId,
    related_to_type: 'expense',
  })
}
