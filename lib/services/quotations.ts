import { createClient } from '@/lib/supabase/client'
import type {
  QuotationRow,
  QuotationWithItems,
  QuotationFormData,
  QuotationItem,
  QuotationStatus,
} from '@/types/quotation'

// ============================================================================
// GENERATE QUOTE NUMBER  (QT-YYYY-NNN)
// ============================================================================

export async function generateQuoteNumber(): Promise<string> {
  const supabase = createClient()
  const year = new Date().getFullYear()

  const { count } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`)
    .lte('created_at', `${year}-12-31T23:59:59`)

  const seq = String((count ?? 0) + 1).padStart(3, '0')
  return `QT-${year}-${seq}`
}

// ============================================================================
// GET ALL QUOTATIONS
// ============================================================================

export async function getQuotations(): Promise<QuotationWithItems[]> {
  const supabase = createClient()

  const { data: quotes, error } = await supabase
    .from('quotations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch quotations: ${error.message}`)
  if (!quotes || quotes.length === 0) return []

  const ids = quotes.map((q) => q.id)
  const { data: items } = await supabase
    .from('quotation_items')
    .select('*')
    .in('quotation_id', ids)
    .order('sort_order', { ascending: true })

  // Fetch creator names
  const creatorIds = [...new Set(quotes.map((q) => q.created_by).filter(Boolean))] as string[]
  let creatorsMap: Record<string, string> = {}
  if (creatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', creatorIds)
    if (profiles) {
      creatorsMap = Object.fromEntries(profiles.map((p) => [p.id, p.full_name]))
    }
  }

  const itemsByQuote: Record<string, QuotationItem[]> = {}
  for (const item of items ?? []) {
    if (!itemsByQuote[item.quotation_id]) itemsByQuote[item.quotation_id] = []
    itemsByQuote[item.quotation_id].push(item as QuotationItem)
  }

  return quotes.map((q) => ({
    ...(q as QuotationRow),
    items: itemsByQuote[q.id] ?? [],
    creator_name: q.created_by ? (creatorsMap[q.created_by] ?? null) : null,
  }))
}

// ============================================================================
// GET SINGLE QUOTATION
// ============================================================================

export async function getQuotationById(id: string): Promise<QuotationWithItems | null> {
  const supabase = createClient()

  const { data: quote, error } = await supabase
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch quotation: ${error.message}`)
  if (!quote) return null

  const { data: items } = await supabase
    .from('quotation_items')
    .select('*')
    .eq('quotation_id', id)
    .order('sort_order', { ascending: true })

  let creator_name: string | null = null
  if (quote.created_by) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', quote.created_by)
      .single()
    creator_name = profile?.full_name ?? null
  }

  return {
    ...(quote as QuotationRow),
    items: (items ?? []) as QuotationItem[],
    creator_name,
  }
}

// ============================================================================
// CREATE QUOTATION
// ============================================================================

export async function createQuotation(
  data: QuotationFormData,
  createdBy?: string
): Promise<QuotationWithItems> {
  const supabase = createClient()
  const quote_number = await generateQuoteNumber()

  const insertPayload = {
    quote_number,
    quote_type:         data.quote_type,
    lead_id:            data.lead_id || null,
    customer_name:      data.customer_name,
    company:            data.company || null,
    contact_person:     data.contact_person || null,
    email:              data.email || null,
    phone:              data.phone || null,
    quote_title:        data.quote_title,
    destination:        data.destination,
    country:            data.country || null,
    city:               data.city || null,
    travel_type:        data.travel_type || null,
    departure_date:     data.departure_date,
    return_date:        data.return_date,
    adults:             data.adults,
    children:           data.children,
    infants:            data.infants,
    currency:           data.currency,
    subtotal:           data.subtotal,
    discount_amount:    data.discount_amount,
    tax_amount:         data.tax_amount,
    grand_total:        data.grand_total,
    quotation_date:     data.quotation_date || new Date().toISOString().split('T')[0],
    valid_until:        data.valid_until,
    payment_terms:      data.payment_terms || null,
    cancellation_policy: data.cancellation_policy || null,
    notes:              data.notes || null,
    internal_notes:     data.internal_notes || null,
    status:             data.status,
    attachment_urls:    [] as string[],
    created_by:         createdBy || null,
  }

  const { data: quote, error } = await supabase
    .from('quotations')
    .insert(insertPayload)
    .select()
    .single()

  if (error) throw new Error(`Failed to create quotation: ${error.message}`)

  // Insert line items
  const savedItems: QuotationItem[] = []
  if (data.items && data.items.length > 0) {
    const itemsPayload = data.items.map((item, idx) => ({
      quotation_id: quote.id,
      service:      item.service,
      description:  item.description || '',
      quantity:     item.quantity,
      unit_price:   item.unit_price,
      discount:     item.discount,
      tax_rate:     item.tax_rate,
      total:        item.total,
      sort_order:   idx,
    }))

    const { data: insertedItems, error: itemsErr } = await supabase
      .from('quotation_items')
      .insert(itemsPayload)
      .select()

    if (itemsErr) throw new Error(`Failed to insert quotation items: ${itemsErr.message}`)
    savedItems.push(...((insertedItems ?? []) as QuotationItem[]))
  }

  return { ...(quote as QuotationRow), items: savedItems }
}

// ============================================================================
// UPDATE QUOTATION
// ============================================================================

export async function updateQuotation(
  id: string,
  data: Partial<QuotationFormData>
): Promise<QuotationWithItems> {
  const supabase = createClient()

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  const directFields = [
    'quote_type', 'lead_id', 'customer_name', 'company', 'contact_person',
    'email', 'phone', 'quote_title', 'destination', 'country', 'city',
    'travel_type', 'departure_date', 'return_date', 'adults', 'children',
    'infants', 'currency', 'subtotal', 'discount_amount', 'tax_amount',
    'grand_total', 'quotation_date', 'valid_until', 'payment_terms',
    'cancellation_policy', 'notes', 'internal_notes', 'status',
  ] as const

  for (const field of directFields) {
    if (field in data) {
      updatePayload[field] = (data as Record<string, unknown>)[field]
    }
  }

  const { data: quote, error } = await supabase
    .from('quotations')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update quotation: ${error.message}`)

  // Re-sync line items: delete all then re-insert
  const savedItems: QuotationItem[] = []
  if (data.items !== undefined) {
    await supabase.from('quotation_items').delete().eq('quotation_id', id)

    if (data.items.length > 0) {
      const itemsPayload = data.items.map((item, idx) => ({
        quotation_id: id,
        service:      item.service,
        description:  item.description || '',
        quantity:     item.quantity,
        unit_price:   item.unit_price,
        discount:     item.discount,
        tax_rate:     item.tax_rate,
        total:        item.total,
        sort_order:   idx,
      }))

      const { data: insertedItems } = await supabase
        .from('quotation_items')
        .insert(itemsPayload)
        .select()

      savedItems.push(...((insertedItems ?? []) as QuotationItem[]))
    }
  } else {
    const { data: existingItems } = await supabase
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', id)
      .order('sort_order')
    savedItems.push(...((existingItems ?? []) as QuotationItem[]))
  }

  return { ...(quote as QuotationRow), items: savedItems }
}

// ============================================================================
// UPDATE STATUS ONLY
// ============================================================================

export async function updateQuotationStatus(
  id: string,
  status: QuotationStatus
): Promise<void> {
  const supabase = createClient()

  const extraFields: Record<string, string> = {}
  if (status === 'sent')    extraFields.sent_at     = new Date().toISOString()
  if (status === 'viewed')  extraFields.viewed_at   = new Date().toISOString()
  if (status === 'accepted') extraFields.accepted_at = new Date().toISOString()
  if (status === 'rejected') extraFields.rejected_at = new Date().toISOString()

  const { error } = await supabase
    .from('quotations')
    .update({ status, ...extraFields, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`Failed to update status: ${error.message}`)
}

// ============================================================================
// DELETE QUOTATION
// ============================================================================

export async function deleteQuotation(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('quotations').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete quotation: ${error.message}`)
}

// ============================================================================
// DUPLICATE QUOTATION
// ============================================================================

export async function duplicateQuotation(id: string): Promise<QuotationWithItems> {
  const supabase = createClient()

  const original = await getQuotationById(id)
  if (!original) throw new Error('Quotation not found')

  const quote_number = await generateQuoteNumber()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, created_at: _ca, updated_at: _ua, quote_number: _qn, items: _items, creator_name: _cn, ...rest } = original

  const { data: newQuote, error } = await supabase
    .from('quotations')
    .insert({ ...rest, quote_number, status: 'draft', sent_at: null, viewed_at: null, accepted_at: null, rejected_at: null, converted_to_booking_id: null })
    .select()
    .single()

  if (error) throw new Error(`Failed to duplicate quotation: ${error.message}`)

  const savedItems: QuotationItem[] = []
  if (original.items.length > 0) {
    const itemsPayload = original.items.map((item, idx) => ({
      quotation_id: newQuote.id,
      service:      item.service,
      description:  item.description,
      quantity:     item.quantity,
      unit_price:   item.unit_price,
      discount:     item.discount,
      tax_rate:     item.tax_rate,
      total:        item.total,
      sort_order:   idx,
    }))
    const { data: insertedItems } = await supabase.from('quotation_items').insert(itemsPayload).select()
    savedItems.push(...((insertedItems ?? []) as QuotationItem[]))
  }

  return { ...(newQuote as QuotationRow), items: savedItems }
}

// ============================================================================
// CONVERT TO BOOKING
// ============================================================================

export async function convertQuotationToBooking(
  quotationId: string,
  createdBy?: string
): Promise<string> {
  const supabase = createClient()

  const quote = await getQuotationById(quotationId)
  if (!quote) throw new Error('Quotation not found')

  // Generate booking reference
  const refNum = `BK-${Date.now().toString().slice(-6)}`

  const bookingPayload = {
    booking_reference: refNum,
    booking_number:    refNum,
    customer_id:       quote.customer_id || '',
    customer_name:     quote.customer_name,
    destination:       quote.destination,
    trip_start_date:   quote.departure_date,
    trip_end_date:     quote.return_date,
    departure_date:    quote.departure_date,
    return_date:       quote.return_date,
    status:            'pending',
    total_cost:        quote.grand_total,
    currency:          quote.currency,
    num_travelers:     quote.adults + quote.children + quote.infants,
    booking_type:      quote.travel_type || 'tour',
    notes:             quote.notes,
    created_by:        createdBy || null,
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert(bookingPayload)
    .select()
    .single()

  if (bookingError) throw new Error(`Failed to create booking: ${bookingError.message}`)

  // Mark quotation as converted
  await supabase
    .from('quotations')
    .update({
      status: 'converted',
      converted_to_booking_id: booking.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', quotationId)

  return booking.id
}

// ============================================================================
// UPLOAD ATTACHMENT
// ============================================================================

export async function uploadQuotationAttachment(
  quotationId: string,
  file: File
): Promise<string> {
  const supabase = createClient()

  const ext = file.name.split('.').pop()
  const path = `quotations/${quotationId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(path, file, { upsert: false })

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

  const { data } = supabase.storage.from('documents').getPublicUrl(path)

  // Append URL to attachment_urls array
  const { data: quote } = await supabase
    .from('quotations')
    .select('attachment_urls')
    .eq('id', quotationId)
    .single()

  const existing: string[] = quote?.attachment_urls ?? []
  await supabase
    .from('quotations')
    .update({ attachment_urls: [...existing, data.publicUrl] })
    .eq('id', quotationId)

  return data.publicUrl
}
