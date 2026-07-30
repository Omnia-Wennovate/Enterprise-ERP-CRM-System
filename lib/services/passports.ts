'use server'

// ============================================================================
// PASSPORT SERVICE — Manages passports linked to visa applications
// lib/services/passports.ts
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { getCountryRule } from './visa'

export async function getPassportsByBooking(bookingId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('booking_travelers')
    .select('id, first_name, last_name, passport_number, passport_expiry, nationality')
    .eq('booking_id', bookingId)

  if (error) throw new Error(`Failed to fetch travelers: ${error.message}`)
  return data || []
}

export async function checkPassportValidity(travelerId: string, destinationCountry: string) {
  const supabase = await createClient()

  const { data: traveler, error: tErr } = await supabase
    .from('booking_travelers')
    .select('passport_expiry, nationality')
    .eq('id', travelerId)
    .single()

  if (tErr) throw new Error(`Failed to fetch traveler: ${tErr.message}`)
  if (!traveler.passport_expiry || !traveler.nationality) return { valid: false, reason: 'Missing passport data' }

  const rule = await getCountryRule(traveler.nationality, destinationCountry)
  if (!rule) return { valid: true, warning: 'No rule found for destination' }

  const expiry = new Date(traveler.passport_expiry)
  const today = new Date()
  const diffMonths = (expiry.getFullYear() - today.getFullYear()) * 12 + (expiry.getMonth() - today.getMonth())

  if (diffMonths < rule.min_passport_validity_months) {
    return {
      valid: false,
      reason: `Passport expires in ${diffMonths} months. Destination requires ${rule.min_passport_validity_months} months.`,
      rule,
    }
  }

  return { valid: true, rule }
}

export async function getExpiringPassports(monthsAhead = 6) {
  const supabase = await createClient()

  // Get active visa applications to find relevant travelers
  const { data: apps } = await supabase
    .from('visa_applications')
    .select('traveler_id')
    .not('status', 'in', '("completed","cancelled","rejected","expired")')

  const travelerIds = (apps || []).map(a => a.traveler_id).filter(Boolean)
  if (travelerIds.length === 0) return []

  const today = new Date()
  const future = new Date()
  future.setMonth(today.getMonth() + monthsAhead)
  
  const todayStr = today.toISOString().split('T')[0]
  const futureStr = future.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('booking_travelers')
    .select('id, first_name, last_name, passport_number, passport_expiry, email, phone')
    .in('id', travelerIds)
    .gte('passport_expiry', todayStr)
    .lte('passport_expiry', futureStr)
    .order('passport_expiry', { ascending: true })

  if (error) throw new Error(`Failed to fetch expiring passports: ${error.message}`)
  return data || []
}
