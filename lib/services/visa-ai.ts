'use server'

// ============================================================================
// VISA AI ASSISTANT SERVICE
// lib/services/visa-ai.ts
// Uses existing Gemini provider for intelligent visa assistance
// ============================================================================

import { getAIProvider } from './ai-provider'
import { getCountryRule } from './visa'
import type { VisaAIResponse, PassportExtractedData } from '@/types/visa'

// Section 22 Guardrail text
const ESTIMATE_DISCLAIMER = "Informational estimate only, not a guarantee. AI predictions do not replace official consular decisions."
const PASSPORT_DISCLAIMER = "AI extracts visible text for convenience only. Does not assess document authenticity, validity, or detect fraud."
const SUGGESTION_DISCLAIMER = "AI suggestion only. Review carefully before applying to application."

export async function estimateApprovalProbability(
  nationality: string, 
  destination: string, 
  visaType: string,
  historySummary?: string
): Promise<VisaAIResponse> {
  const ai = getAIProvider()
  
  const prompt = `
    You are an expert visa consultant. Estimate the approval probability for:
    Nationality: ${nationality}
    Destination: ${destination}
    Visa Type: ${visaType}
    ${historySummary ? `Previous History: ${historySummary}` : ''}
    
    Return a JSON object:
    {
      "probability": number (0-100),
      "reasoning": "brief explanation",
      "riskFactors": ["factor1", "factor2"],
      "positiveFactors": ["factor1"]
    }
  `
  
  try {
    const result: any = await ai.generateJSON(
      "You are a strict, realistic visa processing expert.",
      prompt
    )
    
    return {
      type: 'probability',
      content: `${result.probability}% - ${result.reasoning}\n\nRisks: ${result.riskFactors?.join(', ')}\nPositives: ${result.positiveFactors?.join(', ')}`,
      confidence: result.probability,
      disclaimer: ESTIMATE_DISCLAIMER,
      isAIGenerated: true
    }
  } catch (error: any) {
    throw new Error(`AI estimate failed: ${error.message}`)
  }
}

export async function generateEmbassyChecklist(nationality: string, destination: string, purpose: string): Promise<VisaAIResponse> {
  const ai = getAIProvider()
  const rule = await getCountryRule(nationality, destination)
  
  const prompt = `
    Generate a highly detailed, applicant-facing embassy document checklist for:
    Nationality: ${nationality}
    Destination: ${destination}
    Purpose: ${purpose}
    
    Standard required docs are: ${rule?.required_documents?.join(', ') || 'unknown'}
    
    Return a JSON object:
    {
      "checklist": ["detailed item 1", "detailed item 2"],
      "tips": ["tip1", "tip2"]
    }
  `
  
  try {
    const result: any = await ai.generateJSON(
      "You are a meticulous visa document expert.",
      prompt
    )
    
    return {
      type: 'checklist',
      content: result.checklist.map((c: string) => `• ${c}`).join('\n') + '\n\nPro Tips:\n' + result.tips.map((t: string) => `💡 ${t}`).join('\n'),
      suggestions: result.checklist,
      disclaimer: SUGGESTION_DISCLAIMER,
      isAIGenerated: true
    }
  } catch (error: any) {
    throw new Error(`AI checklist failed: ${error.message}`)
  }
}

// Note: Real OCR requires a vision model or OCR service.
// This is a stub for the architecture assuming a vision-capable provider or pre-extracted text.
export async function analyzePassportData(extractedText: string): Promise<VisaAIResponse & { extractedData: PassportExtractedData }> {
  const ai = getAIProvider()
  
  const prompt = `
    Extract passport data from the following raw OCR text:
    ${extractedText}
    
    Return a JSON object matching this structure EXACTLY (use null if not found):
    {
      "fullName": string | null,
      "passportNumber": string | null,
      "nationality": string | null,
      "dateOfBirth": string (YYYY-MM-DD) | null,
      "issueDate": string (YYYY-MM-DD) | null,
      "expiryDate": string (YYYY-MM-DD) | null,
      "issuingCountry": string | null,
      "gender": "M" | "F" | "X" | null,
      "mrz": string | null
    }
  `
  
  try {
    const result: any = await ai.generateJSON(
      "You are a precise data extraction bot. Do NOT invent data. If you can't find it, return null.",
      prompt
    )
    
    return {
      type: 'passport_data',
      content: `Extracted passport data for ${result.fullName || 'Unknown'} (${result.passportNumber || 'No #'}). Review carefully.`,
      extractedData: {
        fullName: result.fullName,
        passportNumber: result.passportNumber,
        nationality: result.nationality,
        dateOfBirth: result.dateOfBirth,
        issueDate: result.issueDate,
        expiryDate: result.expiryDate,
        issuingCountry: result.issuingCountry,
        gender: result.gender,
        mrz: result.mrz
      },
      disclaimer: PASSPORT_DISCLAIMER,
      isAIGenerated: true
    }
  } catch (error: any) {
    throw new Error(`AI passport analysis failed: ${error.message}`)
  }
}
