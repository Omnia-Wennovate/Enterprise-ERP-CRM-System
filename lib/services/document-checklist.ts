'use server'

import { createClient } from '@/lib/supabase/server'
import { getCountryRule } from './visa'
import { calculateBookingReadiness } from './document-approval'
import type { MissingDocument, ReadinessCategoryStatus } from '@/types/documents'

// Get per-booking document checklist
export async function getBookingDocumentChecklist(bookingId: string) {
  return calculateBookingReadiness(bookingId)
}

// Provide a detailed missing document list with specifics from visa rules
export async function getDetailedMissingDocuments(bookingId: string, nationality?: string, destination?: string) {
  const readiness = await calculateBookingReadiness(bookingId)
  const missing = readiness.missingDocuments

  if (nationality && destination) {
    const rule = await getCountryRule(nationality, destination)
    if (rule && rule.required_documents) {
        // We could map specific visa rules here if needed
        return {
           missing,
           specificVisaDocs: rule.required_documents
        }
    }
  }

  return { missing, specificVisaDocs: [] }
}
