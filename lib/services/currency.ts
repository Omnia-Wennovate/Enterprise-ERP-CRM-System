'use server'

import { createClient } from '@/lib/supabase/server'

export async function normalizeCurrency(amount: number, fromCurrency: string, toCurrency: string = 'USD', exchangeRate?: number): Promise<number> {
  if (fromCurrency === toCurrency) return amount;
  
  if (exchangeRate) {
    // Assuming exchange rate is relative to Base (e.g. 1 USD = 3.67 AED).
    // To convert AED to USD: AED / 3.67.
    // If fromCurrency is base, multiply. If toCurrency is base, divide.
    // Here we'll treat exchange_rate as (1 Base Currency = X fromCurrency) if toCurrency is Base.
    return amount / exchangeRate;
  }

  // Fallback static rates for demonstration purposes if exchange_rate isn't provided.
  // In a real application, you'd fetch this from a live API.
  const rates: Record<string, number> = {
    'USD': 1,
    'EUR': 0.92,
    'GBP': 0.79,
    'AED': 3.67,
    'SAR': 3.75,
    'ETB': 57.50
  }

  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  
  const baseAmount = amount / fromRate;
  return baseAmount * toRate;
}

export async function updateExchangeRateSnapshot(invoiceId: string, rate: number): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('invoices')
    .update({ exchange_rate: rate })
    .eq('id', invoiceId)

  if (error) throw new Error(`Failed to update exchange rate: ${error.message}`)
}
