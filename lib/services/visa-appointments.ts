'use server'

// ============================================================================
// VISA APPOINTMENTS SERVICE
// lib/services/visa-appointments.ts
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import type { VisaAppointment } from '@/types/visa'

export async function getVisaAppointments(visaApplicationId: string): Promise<VisaAppointment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('visa_appointments')
    .select('*')
    .eq('visa_application_id', visaApplicationId)
    .order('scheduled_datetime', { ascending: true })

  if (error) throw new Error(`Failed to fetch appointments: ${error.message}`)
  return data || []
}

export async function createVisaAppointment(appointment: Partial<VisaAppointment>): Promise<VisaAppointment> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('visa_appointments')
    .insert([appointment])
    .select()
    .single()

  if (error) throw new Error(`Failed to create appointment: ${error.message}`)

  await supabase.from('visa_timeline_events').insert([{
    visa_application_id: appointment.visa_application_id,
    event_type: 'appointment_scheduled',
    title: 'Appointment Scheduled',
    description: `Scheduled ${appointment.appointment_type} for ${new Date(appointment.scheduled_datetime!).toLocaleString()}`,
  }])

  return data
}

export async function updateVisaAppointment(id: string, updates: Partial<VisaAppointment>): Promise<VisaAppointment> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('visa_appointments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update appointment: ${error.message}`)
  
  await supabase.from('visa_timeline_events').insert([{
    visa_application_id: data.visa_application_id,
    event_type: `appointment_${updates.status || 'updated'}`,
    title: 'Appointment Updated',
    description: `Appointment ${data.appointment_type} updated. Status: ${data.status}`,
  }])

  return data
}

export async function deleteVisaAppointment(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('visa_appointments').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete appointment: ${error.message}`)
}
