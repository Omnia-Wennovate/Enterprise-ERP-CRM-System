import { createClient } from '@/lib/supabase/client'
import type { QuotationItem } from '@/types/quotation'

export async function getQuotationItems(quotationId: string): Promise<QuotationItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('quotation_items')
    .select('*')
    .eq('quotation_id', quotationId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Failed to fetch quotation items: ${error.message}`)
  return (data ?? []) as QuotationItem[]
}

export async function upsertQuotationItems(
  quotationId: string,
  items: Omit<QuotationItem, 'id' | 'quotation_id' | 'created_at'>[]
): Promise<QuotationItem[]> {
  const supabase = createClient()

  // Delete existing
  await supabase.from('quotation_items').delete().eq('quotation_id', quotationId)

  if (items.length === 0) return []

  const payload = items.map((item, idx) => ({
    quotation_id: quotationId,
    service:      item.service,
    description:  item.description ?? '',
    quantity:     item.quantity,
    unit_price:   item.unit_price,
    discount:     item.discount,
    tax_rate:     item.tax_rate,
    total:        item.total,
    sort_order:   idx,
  }))

  const { data, error } = await supabase
    .from('quotation_items')
    .insert(payload)
    .select()

  if (error) throw new Error(`Failed to upsert quotation items: ${error.message}`)
  return (data ?? []) as QuotationItem[]
}
