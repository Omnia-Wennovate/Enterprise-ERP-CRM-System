import { createClient } from '@/lib/supabase/client'
import type { QuotationWithItems } from '@/types/quotation'
import { updateQuotationStatus } from './quotations'

/**
 * Opens the default email client with a pre-filled quotation email.
 * Also marks the quotation status as "sent" in Supabase.
 */
export async function sendQuotationEmail(quotation: QuotationWithItems): Promise<void> {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: quotation.currency }).format(amount)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const subject = encodeURIComponent(
    `Quotation ${quotation.quote_number} – ${quotation.quote_title}`
  )

  const body = encodeURIComponent(
    `Dear ${quotation.contact_person || quotation.customer_name},

We are pleased to present you with our quotation for your upcoming trip.

━━━━━━━━━━━━━━━━━━━━━━━━
QUOTATION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━
Quote Number  : ${quotation.quote_number}
Trip          : ${quotation.quote_title}
Destination   : ${quotation.destination}
Departure     : ${formatDate(quotation.departure_date)}
Return        : ${formatDate(quotation.return_date)}
Travelers     : ${quotation.adults} Adult(s)${quotation.children > 0 ? `, ${quotation.children} Children` : ''}${quotation.infants > 0 ? `, ${quotation.infants} Infants` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━
PRICING SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━
Subtotal      : ${formatCurrency(quotation.subtotal)}
Discount      : -${formatCurrency(quotation.discount_amount)}
Tax           : ${formatCurrency(quotation.tax_amount)}
GRAND TOTAL   : ${formatCurrency(quotation.grand_total)}

━━━━━━━━━━━━━━━━━━━━━━━━
VALIDITY
━━━━━━━━━━━━━━━━━━━━━━━━
This quotation is valid until ${formatDate(quotation.valid_until)}.
${quotation.payment_terms ? `\nPayment Terms: ${quotation.payment_terms}` : ''}

Please review the attached quotation and feel free to reach out if you have any questions or would like to make adjustments.

To accept this quotation, simply reply to this email.

Best regards,
Omnia TravelOS Team`
  )

  const to = quotation.email ? encodeURIComponent(quotation.email) : ''
  const mailtoLink = `mailto:${to}?subject=${subject}&body=${body}`

  window.open(mailtoLink, '_blank')

  // Mark as sent in Supabase
  await updateQuotationStatus(quotation.id, 'sent')
}

/**
 * Tracks when a quotation has been viewed (call when customer opens a share link).
 */
export async function trackQuotationView(quotationId: string): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('quotations')
    .update({ viewed_at: new Date().toISOString(), status: 'viewed', updated_at: new Date().toISOString() })
    .eq('id', quotationId)
    .eq('status', 'sent') // Only update if currently sent
}
