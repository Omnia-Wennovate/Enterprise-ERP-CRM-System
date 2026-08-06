'use server'

import type { OCRExtractedData } from '@/types/finance'
import { getCategoryPolicyLimit } from '@/lib/services/expense-categories'

// ── Receipt OCR via Gemini Vision ─────────────────────────────────────────────

export async function extractReceiptData(base64Image: string, mimeType = 'image/jpeg'): Promise<OCRExtractedData> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    // Graceful degradation — no API key, skip OCR
    return { confidence: 0 }
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genai = new GoogleGenerativeAI(apiKey)
    const model = genai.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are a receipt parser. Extract the following fields from this receipt image:
- vendor: The business name or vendor
- amount: The total amount paid (number only, no currency symbol)
- date: The transaction date in YYYY-MM-DD format
- tax: The tax amount if itemized (number only, or null)
- currency: The 3-letter currency code (USD, EUR, AED, etc.)
- confidence: A number from 0 to 1 indicating how confident you are (1 = crystal clear printed receipt, 0 = handwritten or unreadable)

Return ONLY a JSON object like: {"vendor":"...", "amount":123.45, "date":"2026-01-15", "tax":10.00, "currency":"USD", "confidence":0.9}
If you cannot reliably read a field, set it to null. If confidence < 0.5, set all other fields to null and return {"confidence":0.3}.`

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
      prompt,
    ])

    const text = result.response.text().trim()
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { confidence: 0 }

    const parsed = JSON.parse(jsonMatch[0]) as OCRExtractedData

    // If confidence too low, return empty (don't guess)
    if (!parsed.confidence || parsed.confidence < 0.5) {
      return { confidence: parsed.confidence || 0 }
    }

    return parsed
  } catch {
    // Silently fail — file still attaches normally
    return { confidence: 0 }
  }
}

// ── Spending policy compliance check ─────────────────────────────────────────

export async function checkPolicyCompliance(
  amount: number,
  category: string
): Promise<{ exceeded: boolean; limit: number | null; message: string | null }> {
  const limits = await getCategoryPolicyLimit(category)

  if (limits.per_transaction_limit && amount > limits.per_transaction_limit) {
    return {
      exceeded: true,
      limit: limits.per_transaction_limit,
      message: `Exceeds standard policy limit of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(limits.per_transaction_limit)} for ${category} — requires explicit approval note`,
    }
  }

  return { exceeded: false, limit: null, message: null }
}

// ── Category suggestion (based on description keyword matching) ───────────────

export async function suggestExpenseCategory(description: string): Promise<string | null> {
  const desc = description.toLowerCase()
  const rules: Array<{ keywords: string[]; category: string }> = [
    { keywords: ['flight', 'airline', 'airfare', 'plane', 'ticket'], category: 'Flights' },
    { keywords: ['hotel', 'accommodation', 'lodging', 'hostel', 'resort'], category: 'Hotels' },
    { keywords: ['visa', 'embassy', 'consulate'], category: 'Visa' },
    { keywords: ['taxi', 'uber', 'lyft', 'cab', 'transport', 'bus', 'train'], category: 'Transportation' },
    { keywords: ['fuel', 'petrol', 'gas', 'gasoline'], category: 'Fuel' },
    { keywords: ['restaurant', 'meal', 'lunch', 'dinner', 'breakfast', 'food', 'coffee', 'cafe'], category: 'Meals' },
    { keywords: ['office', 'stationery', 'supplies', 'printer', 'paper'], category: 'Office Supplies' },
    { keywords: ['marketing', 'advertising', 'campaign', 'ads', 'social media'], category: 'Marketing' },
    { keywords: ['electricity', 'water', 'utility', 'utilities'], category: 'Utilities' },
    { keywords: ['internet', 'broadband', 'wifi', 'fiber'], category: 'Internet' },
    { keywords: ['phone', 'mobile', 'sim', 'telecom', 'telephone'], category: 'Phone' },
    { keywords: ['training', 'course', 'workshop', 'seminar', 'conference'], category: 'Training' },
    { keywords: ['software', 'subscription', 'license', 'saas', 'app'], category: 'Software' },
    { keywords: ['equipment', 'hardware', 'laptop', 'computer', 'device'], category: 'Equipment' },
    { keywords: ['maintenance', 'repair', 'service'], category: 'Maintenance' },
    { keywords: ['insurance', 'premium', 'coverage'], category: 'Insurance' },
    { keywords: ['tax', 'vat', 'customs', 'duty'], category: 'Taxes' },
  ]

  for (const rule of rules) {
    if (rule.keywords.some((kw) => desc.includes(kw))) {
      return rule.category
    }
  }

  return null
}

// ── Currency conversion (reuses existing currency service pattern) ─────────────

function convertCurrency(amount: number, fromCurrency: string, toCurrency = 'USD', exchangeRate?: number): number {
  if (fromCurrency === toCurrency) return amount

  if (exchangeRate) {
    return amount / exchangeRate
  }

  // Static rates fallback (same as existing currency.ts)
  const rates: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    AED: 3.67,
    SAR: 3.75,
    ETB: 57.50,
    TRY: 32.0,
    EGP: 30.9,
  }

  const fromRate = rates[fromCurrency] || 1
  const toRate = rates[toCurrency] || 1
  return (amount / fromRate) * toRate
}
