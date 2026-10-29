'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Plane, Loader2, AlertCircle } from 'lucide-react'
import { useProfile } from '@/lib/context/profile-context'
import { getLeadById } from '@/lib/services/leads'
import { getLeadActivities } from '@/lib/services/lead-activities'
import { getLeadSummarySections, type LeadRequestInfo } from '@/lib/lead-summary'
import { downloadLeadPdf } from '@/lib/pdf/lead-pdf'
import { BudgetProgress } from '@/components/crm/BudgetProgress'
import type { LeadWithAgent } from '@/types/leads'

/**
 * Booking request review — Operations lands here from a "Booking Request"
 * notification, reviews the lead (optionally downloads it as PDF), then creates the booking.
 */
export default function BookingRequestPage() {
  const { leadId } = useParams<{ leadId: string }>()
  const router = useRouter()
  const profile = useProfile()
  const [lead, setLead] = useState<LeadWithAgent | null>(null)
  const [request, setRequest] = useState<LeadRequestInfo>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [l, activities] = await Promise.all([
          getLeadById(leadId),
          getLeadActivities(leadId).catch(() => []),
        ])
        setLead(l)
        // Latest "converted to booking" activity tells us who sent it and when
        const sent = activities.find(
          (a) => a.activity_type === 'converted' && a.metadata?.converted_to === 'booking'
        )
        if (sent) setRequest({ requestedBy: sent.performer?.full_name ?? null, requestedAt: sent.created_at })
      } catch (err) {
        console.error('Failed to load booking request:', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [leadId])

  const handleDownload = async () => {
    if (!lead) return
    setIsDownloading(true)
    try {
      await downloadLeadPdf(lead, request)
    } catch (err) {
      console.error('PDF download failed:', err)
      alert('Could not create the PDF. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>
  }

  if (!lead) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <AlertCircle className="mx-auto text-muted-foreground mb-3" size={36} />
        <h1 className="text-xl font-semibold text-foreground">Lead not found</h1>
        <p className="text-sm text-muted-foreground mt-2">It may have been deleted after the booking request was sent.</p>
        <Link href="/bookings" className="inline-flex items-center gap-2 mt-6 text-omnia-gold hover:text-omnia-gold-dark font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </Link>
      </div>
    )
  }

  const sections = getLeadSummarySections(lead, request)
  const canCreateBooking = profile?.role !== 'sales_agent'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/bookings" className="inline-flex items-center gap-2 text-sm text-omnia-gold hover:text-omnia-gold-dark">
        <ArrowLeft className="w-4 h-4" /> Back to Bookings
      </Link>

      {/* Header */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-widest text-omnia-gold uppercase">Booking Request</p>
          <h1 className="text-2xl font-bold text-foreground mt-1">{lead.lead_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {[lead.company, lead.destination].filter(Boolean).join(' · ') || lead.email}
          </p>
          {request.requestedBy && (
            <p className="text-xs text-muted-foreground mt-2">
              Sent by <span className="font-medium text-foreground">{request.requestedBy}</span>
              {request.requestedAt && <> on {new Date(request.requestedAt).toLocaleString()}</>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-4 py-2.5 text-sm font-medium border border-border bg-card hover:bg-muted text-foreground rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download PDF
          </button>
          {canCreateBooking && (
            <button
              onClick={() => router.push(`/bookings/new?from_lead=${lead.id}`)}
              className="px-4 py-2.5 text-sm font-semibold bg-omnia-gold text-white hover:bg-omnia-gold-dark rounded-lg flex items-center gap-2"
            >
              <Plane size={16} /> Create Booking
            </button>
          )}
        </div>
      </div>

      {/* Lead details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div
            key={section.title}
            className={`bg-card rounded-2xl border border-border p-5 shadow-sm ${section.paragraph !== undefined ? 'md:col-span-2' : ''}`}
          >
            <h2 className="text-sm font-semibold text-omnia-gold uppercase tracking-wide mb-3">{section.title}</h2>
            {section.rows.length > 0 && (
              <dl className="space-y-2">
                {section.rows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[130px_1fr] gap-3 text-sm">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="text-foreground font-medium break-words">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {section.title === 'Payment' && (
              <div className="mt-4">
                <BudgetProgress budget={lead.budget} paid={lead.amount_paid} currency={lead.currency} />
              </div>
            )}
            {section.paragraph && (
              <p className="text-sm text-foreground whitespace-pre-wrap">{section.paragraph}</p>
            )}
          </div>
        ))}
      </div>

      {canCreateBooking && (
        <div className="flex justify-end">
          <button
            onClick={() => router.push(`/bookings/new?from_lead=${lead.id}`)}
            className="px-5 py-2.5 text-sm font-semibold bg-omnia-gold text-white hover:bg-omnia-gold-dark rounded-lg flex items-center gap-2"
          >
            <Plane size={16} /> Create Booking
          </button>
        </div>
      )}
    </div>
  )
}
