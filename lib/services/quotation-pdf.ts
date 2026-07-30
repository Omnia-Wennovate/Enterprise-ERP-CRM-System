import type { QuotationWithItems } from '@/types/quotation'

/**
 * Opens a professional print dialog for the quotation.
 * Creates a hidden print-only iframe with fully styled HTML,
 * so the main page is never disrupted.
 */
export function generateQuotationPDF(quotation: QuotationWithItems): void {
  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const itemRows = quotation.items
    .map(
      (item) => `
      <tr>
        <td>${item.service}</td>
        <td>${item.description || '—'}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${formatCurrency(item.unit_price, quotation.currency)}</td>
        <td style="text-align:center">${item.discount}%</td>
        <td style="text-align:center">${item.tax_rate}%</td>
        <td style="text-align:right;font-weight:600">${formatCurrency(item.total, quotation.currency)}</td>
      </tr>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Quotation ${quotation.quote_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #1a1a2e; background: #fff; font-size: 13px; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 20mm; }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid #0d9488; }
    .company-name { font-size: 26px; font-weight: 700; color: #0d9488; letter-spacing: -0.5px; }
    .company-sub { font-size: 11px; color: #6b7280; margin-top: 4px; }
    .quote-meta { text-align: right; }
    .quote-number { font-size: 22px; font-weight: 700; color: #1a1a2e; }
    .quote-date { font-size: 11px; color: #6b7280; margin-top: 4px; }
    .status-badge { display: inline-block; background: #ccfbf1; color: #0f766e; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px; }

    /* Info grid */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .info-box h3 { font-size: 10px; font-weight: 700; color: #0d9488; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .info-box p { font-size: 13px; color: #374151; line-height: 1.6; }
    .info-box .label { font-size: 11px; color: #9ca3af; }

    /* Items table */
    h2.section-title { font-size: 14px; font-weight: 700; color: #1a1a2e; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #e5e7eb; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
    thead tr { background: #0d9488; color: #fff; }
    thead th { padding: 10px 12px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 9px 12px; vertical-align: top; }

    /* Totals */
    .totals { display: flex; justify-content: flex-end; margin-bottom: 28px; }
    .totals-box { width: 280px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #374151; }
    .total-row.grand { font-size: 16px; font-weight: 700; color: #0d9488; padding: 10px 0; border-top: 2px solid #0d9488; margin-top: 6px; }

    /* Terms */
    .terms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
    .term-box h4 { font-size: 11px; font-weight: 700; color: #0d9488; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
    .term-box p { font-size: 12px; color: #4b5563; line-height: 1.6; }

    /* Footer */
    .footer { margin-top: 32px; padding-top: 16px; border-top: 2px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
    .footer-note { font-size: 11px; color: #9ca3af; }
    .validity { font-size: 12px; font-weight: 600; color: #ef4444; }

    /* Signature */
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
    .sig-box { border-top: 1px solid #e5e7eb; padding-top: 10px; text-align: center; }
    .sig-box p { font-size: 11px; color: #6b7280; margin-top: 4px; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 15mm; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="company-name">Omnia TravelOS</div>
      <div class="company-sub">Your Professional Travel Partner</div>
    </div>
    <div class="quote-meta">
      <div class="quote-number">${quotation.quote_number}</div>
      <div class="quote-date">Date: ${formatDate(quotation.quotation_date)}</div>
      <div class="quote-date">Valid Until: <strong>${formatDate(quotation.valid_until)}</strong></div>
      <span class="status-badge">${quotation.status.toUpperCase()}</span>
    </div>
  </div>

  <!-- Customer & Trip Info -->
  <div class="info-grid">
    <div class="info-box">
      <h3>Prepared For</h3>
      <p><strong>${quotation.customer_name}</strong></p>
      ${quotation.company ? `<p>${quotation.company}</p>` : ''}
      ${quotation.contact_person ? `<p>${quotation.contact_person}</p>` : ''}
      ${quotation.email ? `<p>${quotation.email}</p>` : ''}
      ${quotation.phone ? `<p>${quotation.phone}</p>` : ''}
    </div>
    <div class="info-box">
      <h3>Trip Details</h3>
      <p><strong>${quotation.quote_title}</strong></p>
      <p>${quotation.destination}${quotation.country ? ', ' + quotation.country : ''}</p>
      <p class="label">Departure</p><p>${formatDate(quotation.departure_date)}</p>
      <p class="label">Return</p><p>${formatDate(quotation.return_date)}</p>
      <p>${quotation.adults} Adult${quotation.adults !== 1 ? 's' : ''}${quotation.children > 0 ? `, ${quotation.children} Children` : ''}${quotation.infants > 0 ? `, ${quotation.infants} Infants` : ''}</p>
    </div>
  </div>

  <!-- Items Table -->
  <h2 class="section-title">Quotation Items</h2>
  <table>
    <thead>
      <tr>
        <th>Service</th>
        <th>Description</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:center">Disc %</th>
        <th style="text-align:center">Tax %</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows || '<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:20px">No items added</td></tr>'}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <div class="totals-box">
      <div class="total-row"><span>Subtotal</span><span>${formatCurrency(quotation.subtotal, quotation.currency)}</span></div>
      <div class="total-row"><span>Discount</span><span>−${formatCurrency(quotation.discount_amount, quotation.currency)}</span></div>
      <div class="total-row"><span>Tax</span><span>${formatCurrency(quotation.tax_amount, quotation.currency)}</span></div>
      <div class="total-row grand"><span>GRAND TOTAL</span><span>${formatCurrency(quotation.grand_total, quotation.currency)}</span></div>
    </div>
  </div>

  <!-- Terms -->
  <div class="terms-grid">
    ${quotation.payment_terms ? `<div class="term-box"><h4>Payment Terms</h4><p>${quotation.payment_terms}</p></div>` : ''}
    ${quotation.cancellation_policy ? `<div class="term-box"><h4>Cancellation Policy</h4><p>${quotation.cancellation_policy}</p></div>` : ''}
    ${quotation.notes ? `<div class="term-box"><h4>Notes</h4><p>${quotation.notes}</p></div>` : ''}
  </div>

  <!-- Signatures -->
  <div class="signatures">
    <div class="sig-box">
      <br/><br/>
      <p>Authorized Signature</p>
      <p>Omnia TravelOS</p>
    </div>
    <div class="sig-box">
      <br/><br/>
      <p>Customer Acceptance</p>
      <p>${quotation.customer_name}</p>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-note">This quotation is computer generated. Generated on ${new Date().toLocaleDateString()}.</div>
    <div class="validity">Valid until: ${formatDate(quotation.valid_until)}</div>
  </div>

</div>
</body>
</html>`

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:0;height:0;border:0'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) return

  doc.open()
  doc.write(html)
  doc.close()

  iframe.contentWindow?.focus()
  setTimeout(() => {
    iframe.contentWindow?.print()
    setTimeout(() => document.body.removeChild(iframe), 2000)
  }, 500)
}
