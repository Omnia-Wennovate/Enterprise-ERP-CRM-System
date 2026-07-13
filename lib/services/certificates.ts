import { createClient } from '@/lib/supabase/client'
import type { TrainingCertificate } from '@/types/hr'

export async function getCertificates(employeeId?: string, courseId?: string) {
  const supabase = createClient()
  let query = supabase
    .from('training_certificates')
    .select(`
      *,
      course:training_courses(id, title, category),
      employee:profiles(id, first_name, last_name, department, avatar_url)
    `)
    .order('issued_at', { ascending: false })

  if (employeeId) query = query.eq('employee_id', employeeId)
  if (courseId) query = query.eq('course_id', courseId)

  const { data, error } = await query
  if (error) throw error
  return (data || []) as TrainingCertificate[]
}

export async function issueCertificate(employeeId: string, courseId: string, assignmentId?: string, expiryMonths?: number) {
  const supabase = createClient()

  const certNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  let expiresAt: string | undefined
  if (expiryMonths && expiryMonths > 0) {
    const d = new Date()
    d.setMonth(d.getMonth() + expiryMonths)
    expiresAt = d.toISOString()
  }

  const { data, error } = await supabase
    .from('training_certificates')
    .insert([{
      employee_id: employeeId,
      course_id: courseId,
      assignment_id: assignmentId,
      certificate_number: certNumber,
      expires_at: expiresAt,
      renewal_required: !!expiryMonths,
      status: 'active',
    }])
    .select()
    .single()

  if (error) throw error
  return data as TrainingCertificate
}

export async function revokeCertificate(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('training_certificates')
    .update({ status: 'revoked' })
    .eq('id', id)

  if (error) throw error
}

export async function renewCertificate(id: string, newExpiryMonths: number) {
  const supabase = createClient()
  const d = new Date()
  d.setMonth(d.getMonth() + newExpiryMonths)

  const { data, error } = await supabase
    .from('training_certificates')
    .update({
      status: 'renewed',
      expires_at: d.toISOString(),
      issued_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as TrainingCertificate
}

export async function getExpiringCertificates(daysAhead: number = 30) {
  const supabase = createClient()
  const now = new Date()
  const future = new Date()
  future.setDate(future.getDate() + daysAhead)

  const { data, error } = await supabase
    .from('training_certificates')
    .select(`
      *,
      course:training_courses(id, title),
      employee:profiles(id, first_name, last_name, department)
    `)
    .eq('status', 'active')
    .gte('expires_at', now.toISOString())
    .lte('expires_at', future.toISOString())
    .order('expires_at', { ascending: true })

  if (error) throw error
  return (data || []) as TrainingCertificate[]
}
