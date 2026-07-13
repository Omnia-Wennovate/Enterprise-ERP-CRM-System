import { createClient } from '@/lib/supabase/client'
import type { ExternalTrainingRequest } from '@/types/hr'

export async function getExternalRequests(employeeId?: string, status?: string) {
  const supabase = createClient()
  let query = supabase
    .from('external_training_requests')
    .select(`
      *,
      employee:profiles!external_training_requests_employee_id_fkey(id, first_name, last_name, department, position)
    `)
    .order('created_at', { ascending: false })

  if (employeeId) query = query.eq('employee_id', employeeId)
  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error
  return (data || []) as ExternalTrainingRequest[]
}

export async function createExternalRequest(request: Partial<ExternalTrainingRequest>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('external_training_requests')
    .insert([request])
    .select()
    .single()

  if (error) throw error
  return data as ExternalTrainingRequest
}

export async function approveExternalRequest(id: string, approvedBy: string) {
  const supabase = createClient()

  // Get the request
  const { data: req } = await supabase
    .from('external_training_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (!req) throw new Error('Request not found')

  let newStatus = 'approved'
  let linkedExpenseId = req.linked_expense_id

  // If cost > 0, create an expense entry
  if (req.cost > 0 && !linkedExpenseId) {
    const { data: expense } = await supabase
      .from('expenses')
      .insert([{
        category: 'training',
        description: `External Training: ${req.course_name} (${req.provider || 'External'})`,
        amount: req.cost,
        expense_date: req.start_date || new Date().toISOString().split('T')[0],
        recorded_by: approvedBy,
      }])
      .select()
      .single()

    if (expense) linkedExpenseId = expense.id
    newStatus = 'finance_approved'
  }

  const { data, error } = await supabase
    .from('external_training_requests')
    .update({
      status: newStatus,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      linked_expense_id: linkedExpenseId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as ExternalTrainingRequest
}

export async function rejectExternalRequest(id: string, approvedBy: string, notes?: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('external_training_requests')
    .update({
      status: 'rejected',
      approved_by: approvedBy,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as ExternalTrainingRequest
}

export async function completeExternalTraining(id: string, certificateUrl?: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('external_training_requests')
    .update({
      status: 'completed',
      certificate_url: certificateUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as ExternalTrainingRequest
}

export async function deleteExternalRequest(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('external_training_requests').delete().eq('id', id)
  if (error) throw error
}
