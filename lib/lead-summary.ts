import {
  LEAD_SOURCE_LABELS,
  PIPELINE_STAGE_LABELS,
  PRIORITY_LABELS,
  TRAVEL_TYPE_LABELS,
  type LeadWithAgent,
  type LeadSource,
  type LeadPipelineStage,
  type LeadPriority,
  type TravelType,
} from '@/types/leads'

// ============================================================================
// LEAD SUMMARY — one source for the Operations review page and the lead PDF
// ============================================================================

export interface LeadRequestInfo {
  requestedBy?: string | null
  requestedAt?: string | null
}

export interface LeadSummaryRow {
  label: string
  value: string
}

export interface LeadSummarySection {
  title: string
  rows: LeadSummaryRow[]
  /** Long free text shown as a paragraph instead of label/value rows */
  paragraph?: string
}

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''

export const fmtMoney = (amount: number | string | null | undefined, currency: string) =>
  `${currency} ${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`

export function getPaymentStatus(lead: LeadWithAgent) {
  const budget = Number(lead.budget) || 0
  const paid = Number(lead.amount_paid) || 0
  if (budget <= 0) return null
  const fullyPaid = paid >= budget
  const paidPct = fullyPaid ? 100 : Math.floor((paid / budget) * 100)
  return { budget, paid, paidPct, remaining: Math.max(0, budget - paid), fullyPaid }
}

function travellers(lead: LeadWithAgent): string {
  const parts = [
    `${lead.adults || 0} adult${lead.adults === 1 ? '' : 's'}`,
    lead.children ? `${lead.children} child${lead.children === 1 ? '' : 'ren'}` : '',
    lead.infants ? `${lead.infants} infant${lead.infants === 1 ? '' : 's'}` : '',
  ]
  return parts.filter(Boolean).join(', ')
}

/** Rows with empty values are dropped so the summary only shows what Sales filled in */
export function getLeadSummarySections(lead: LeadWithAgent, request?: LeadRequestInfo): LeadSummarySection[] {
  const payment = getPaymentStatus(lead)
  const location = [lead.city, lead.country].filter(Boolean).join(', ')

  const sections: LeadSummarySection[] = [
    {
      title: 'Booking Request',
      rows: [
        { label: 'Requested by', value: request?.requestedBy || '' },
        { label: 'Requested on', value: fmtDate(request?.requestedAt) },
        { label: 'Sales agent', value: lead.assigned_agent?.full_name || '' },
        { label: 'Pipeline stage', value: PIPELINE_STAGE_LABELS[lead.pipeline_stage as LeadPipelineStage] || lead.pipeline_stage },
        { label: 'Priority', value: PRIORITY_LABELS[lead.priority as LeadPriority] || lead.priority },
      ],
    },
    {
      title: 'Customer',
      rows: [
        { label: 'Name', value: lead.lead_name },
        { label: 'Company', value: lead.company || '' },
        { label: 'Contact person', value: lead.contact_person || '' },
        { label: 'Job title', value: lead.job_title || '' },
        { label: 'Email', value: lead.email || '' },
        { label: 'Phone', value: lead.phone || '' },
        { label: 'Mobile', value: lead.mobile || '' },
        { label: 'Location', value: location },
        { label: 'Address', value: lead.address || '' },
        { label: 'Lead source', value: LEAD_SOURCE_LABELS[lead.lead_source as LeadSource] || lead.lead_source || '' },
      ],
    },
    {
      title: 'Trip',
      rows: [
        { label: 'Destination', value: lead.destination || '' },
        { label: 'Travel type', value: lead.travel_type ? TRAVEL_TYPE_LABELS[lead.travel_type as TravelType] || lead.travel_type : '' },
        { label: 'Travel date', value: fmtDate(lead.travel_date) },
        { label: 'Return date', value: fmtDate(lead.return_date) },
        { label: 'Travellers', value: travellers(lead) },
        { label: 'Preferred airline', value: lead.preferred_airline || '' },
        { label: 'Preferred hotel', value: lead.preferred_hotel || '' },
        { label: 'Visa required', value: lead.visa_required ? 'Yes' : 'No' },
      ],
    },
    {
      title: 'Payment',
      rows: [
        { label: 'Estimated value', value: fmtMoney(lead.estimated_value, lead.currency) },
        { label: 'Budget', value: payment ? fmtMoney(payment.budget, lead.currency) : '' },
        { label: 'Amount paid', value: payment ? fmtMoney(payment.paid, lead.currency) : '' },
        {
          label: 'Payment status',
          value: payment
            ? payment.fullyPaid
              ? 'Fully paid'
              : `${payment.paidPct}% paid, ${fmtMoney(payment.remaining, lead.currency)} remaining`
            : '',
        },
      ],
    },
    { title: 'Special Requests', rows: [], paragraph: lead.special_requests || '' },
    { title: 'Notes', rows: [], paragraph: lead.notes || '' },
    { title: 'Tags', rows: [], paragraph: (lead.tags || []).join(', ') },
  ]

  return sections
    .map((s) => ({ ...s, rows: s.rows.filter((r) => r.value && r.value.trim()) }))
    .filter((s) => s.rows.length > 0 || s.paragraph?.trim())
}
