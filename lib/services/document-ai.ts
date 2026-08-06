'use server'

// ============================================================================
// DOCUMENT AI SERVICE — OCR, Type Detection, Conflict Resolution
// lib/services/document-ai.ts
// ============================================================================

import { getAIProvider } from './ai-provider'
import type { 
  AIExtractedDocumentData, 
  DocumentType, 
  OCRFieldComparison 
} from '@/types/documents'
import { createClient } from '@/lib/supabase/server'

export async function analyzeDocument(
  fileContentBase64: string,
  fileName: string,
  fileMime: string
): Promise<AIExtractedDocumentData> {
  const ai = getAIProvider()

  const prompt = `
    Analyze the following document (name: ${fileName}, mime: ${fileMime}).
    Extract the following information:
    1. Identify the document type. Must be one of: passport, visa, flight_ticket, hotel_voucher, travel_insurance, national_id, invitation_letter, employment_letter, bank_statement, vaccination_certificate, birth_certificate, marriage_certificate, driver_license, invoice, receipt, contract, internal, other.
    2. Extract key fields based on the document type (e.g. for a passport, extract name, passport number, expiry, nationality, DOB, MRZ; for a visa, extract visa number, valid from/until).
    3. Evaluate document quality (blurriness, readability, cropped edges) and list any issues.
    4. Provide a confidence score (0-100) for the overall extraction and per field.

    Respond ONLY with a JSON object matching this schema:
    {
      "detectedType": "passport" | "visa" | etc,
      "fullName": string | null,
      "passportNumber": string | null,
      "nationality": string | null,
      "dateOfBirth": string (YYYY-MM-DD) | null,
      "issueDate": string (YYYY-MM-DD) | null,
      "expiryDate": string (YYYY-MM-DD) | null,
      "issuingCountry": string | null,
      "gender": string | null,
      "mrz": string | null,
      "visaNumber": string | null,
      "visaType": string | null,
      "validFrom": string | null,
      "validUntil": string | null,
      "entries": string | null,
      "issuer": string | null,
      "documentNumber": string | null,
      "summary": string | null,
      "qualityIssues": ["issue1", "issue2"],
      "missingFields": ["field1", "field2"],
      "fieldConfidence": {
        "fullName": 95,
        "passportNumber": 80
      },
      "overallConfidence": 90
    }
  `

  try {
    // Note: In a real implementation with a vision-capable AI, you'd pass the image bytes.
    // We are simulating passing the base64 content in the prompt context.
    const result: any = await ai.generateJSON(
      "You are an expert AI Document OCR Assistant. You analyze travel documents and return precise JSON data.",
      prompt + `\n\n[FILE DATA OMITTED FOR SIMULATION]` // Mocked vision input
    )

    return result as AIExtractedDocumentData
  } catch (error: any) {
    throw new Error(`AI Document analysis failed: ${error.message}`)
  }
}

export async function checkOCRConflicts(
  bookingId: string | null,
  travelerId: string | null,
  extractedData: AIExtractedDocumentData
): Promise<OCRFieldComparison[]> {
  const supabase = await createClient()
  const comparisons: OCRFieldComparison[] = []

  if (!travelerId) return comparisons

  const { data: traveler } = await supabase
    .from('booking_travelers')
    .select('*')
    .eq('id', travelerId)
    .single()

  if (!traveler) return comparisons

  const compareField = (
    fieldId: string, 
    label: string, 
    aiVal: string | null | undefined, 
    dbVal: string | null | undefined
  ) => {
    if (aiVal) {
      const confidence = extractedData.fieldConfidence?.[fieldId] || 100
      const hasConflict = dbVal ? aiVal.toLowerCase().trim() !== dbVal.toLowerCase().trim() : false
      
      comparisons.push({
        field: fieldId,
        label,
        aiValue: aiVal,
        existingValue: dbVal || null,
        confidence,
        hasConflict,
        isLowConfidence: confidence < 75,
        confirmed: !hasConflict && confidence >= 75 // Auto-confirm if matching and high confidence
      })
    }
  }

  if (extractedData.detectedType === 'passport') {
    compareField('fullName', 'Full Name', extractedData.fullName, `${traveler.first_name} ${traveler.last_name}`)
    compareField('passportNumber', 'Passport Number', extractedData.passportNumber, traveler.passport_number)
    compareField('nationality', 'Nationality', extractedData.nationality, traveler.nationality)
    compareField('dateOfBirth', 'Date of Birth', extractedData.dateOfBirth, traveler.date_of_birth)
    compareField('expiryDate', 'Passport Expiry', extractedData.expiryDate, traveler.passport_expiry)
  }

  // Add Visa logic if needed by fetching visa_applications

  return comparisons
}

export async function applyConfirmedOCRData(
  travelerId: string,
  confirmedFields: OCRFieldComparison[]
): Promise<void> {
  const supabase = await createClient()
  
  const updates: any = {}
  
  confirmedFields.filter(f => f.confirmed).forEach(field => {
    const val = field.editedValue || field.aiValue
    if (field.field === 'passportNumber') updates.passport_number = val
    if (field.field === 'nationality') updates.nationality = val
    if (field.field === 'dateOfBirth') updates.date_of_birth = val
    if (field.field === 'expiryDate') updates.passport_expiry = val
    // Split full name if needed
    if (field.field === 'fullName' && val) {
      const parts = val.split(' ')
      updates.first_name = parts[0]
      if (parts.length > 1) {
        updates.last_name = parts.slice(1).join(' ')
      }
    }
  })

  if (Object.keys(updates).length > 0) {
    await supabase.from('booking_travelers').update(updates).eq('id', travelerId)
  }
}
