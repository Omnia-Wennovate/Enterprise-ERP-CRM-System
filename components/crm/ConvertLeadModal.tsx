'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserCheck, BookOpen, FileText, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logConverted } from '@/lib/services/lead-activities'
import { createClient } from '@/lib/supabase/client'
import type { LeadWithAgent } from '@/types/leads'

interface Props {
  isOpen: boolean
  lead: LeadWithAgent
  onClose: () => void
  onConverted?: () => void
}

export function ConvertLeadModal({ isOpen, lead, onClose, onConverted }: Props) {
  const [converting, setConverting] = useState<'customer' | 'booking' | 'quotation' | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleConvertCustomer = async () => {
    setConverting('customer')
    setError('')
    try {
      const supabase = createClient()
      // Insert into customers table with lead data
      const { error: customerError } = await supabase.from('customers').insert({
        full_name: lead.lead_name,
        email: lead.email,
        phone: lead.phone || null,
        mobile: lead.mobile || null,
        company: lead.company || null,
        country: lead.country || null,
        city: lead.city || null,
        address: lead.address || null,
        notes: lead.notes || null,
      })
      if (customerError) throw customerError
      await logConverted(lead.id, lead.lead_name, 'customer').catch(() => {})
      setDone('Customer created successfully!')
      onConverted?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to convert to customer'
      setError(msg)
    } finally {
      setConverting(null)
    }
  }

  const handleConvertBooking = async () => {
    setConverting('booking')
    setError('')
    try {
      await logConverted(lead.id, lead.lead_name, 'booking').catch(() => {})
      // Navigate to new booking page with lead data pre-filled via URL params
      const params = new URLSearchParams({
        from_lead: lead.id,
        lead_name: lead.lead_name,
        destination: lead.destination || '',
        departure_date: lead.travel_date || '',
        return_date: lead.return_date || '',
        total_cost: String(lead.estimated_value || 0),
      })
      window.location.href = `/bookings/new?${params.toString()}`
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create booking'
      setError(msg)
      setConverting(null)
    }
  }

  const handleGenerateQuotation = async () => {
    setConverting('quotation')
    setError('')
    try {
      const supabase = createClient()
      const ref = `QT-${Date.now()}`
      const { error: qError } = await supabase.from('quotations').insert({
        quotation_number: ref,
        customer_name: lead.lead_name,
        customer_email: lead.email,
        destination: lead.destination || '',
        travel_date: lead.travel_date || null,
        return_date: lead.return_date || null,
        adults: lead.adults || 1,
        children: lead.children || 0,
        total_amount: lead.estimated_value || 0,
        currency: lead.currency || 'USD',
        status: 'draft',
        notes: lead.notes || null,
      })
      if (qError) throw qError
      await logConverted(lead.id, lead.lead_name, 'quotation').catch(() => {})
      setDone(`Quotation ${ref} created as draft!`)
      onConverted?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate quotation'
      setError(msg)
    } finally {
      setConverting(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] w-[460px] bg-card rounded-2xl shadow-2xl border border-border"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-foreground">Convert Lead</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{lead.lead_name}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {done ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                  <p className="font-semibold text-foreground">{done}</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    This lead is <strong>Won</strong>. Choose how you want to convert it:
                  </p>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Convert to Customer */}
                  <button
                    onClick={handleConvertCustomer}
                    disabled={converting !== null}
                    className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-omnia-gold/60 hover:bg-omnia-gold/10 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-omnia-gold/15 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-200 transition-colors">
                      {converting === 'customer'
                        ? <Loader2 className="w-5 h-5 text-omnia-gold animate-spin" />
                        : <UserCheck className="w-5 h-5 text-omnia-gold" />
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Convert to Customer</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Create a new customer profile in the CRM using this lead&apos;s data</p>
                    </div>
                  </button>

                  {/* Convert to Booking */}
                  <button
                    onClick={handleConvertBooking}
                    disabled={converting !== null}
                    className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-blue-400 hover:bg-omnia-gold/5 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                      {converting === 'booking'
                        ? <Loader2 className="w-5 h-5 text-omnia-gold animate-spin" />
                        : <BookOpen className="w-5 h-5 text-omnia-gold" />
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Convert to Booking</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Open the new booking form pre-filled with this lead&apos;s travel details</p>
                    </div>
                  </button>

                  {/* Generate Quotation */}
                  <button
                    onClick={handleGenerateQuotation}
                    disabled={converting !== null}
                    className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-purple-400 hover:bg-purple-50 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                      {converting === 'quotation'
                        ? <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                        : <FileText className="w-5 h-5 text-purple-600" />
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Generate Quotation</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Create a draft quotation from this lead&apos;s requirements</p>
                    </div>
                  </button>
                </>
              )}
            </div>

            <div className="px-5 pb-5">
              <Button variant="ghost" onClick={onClose} className="w-full">
                {done ? 'Close' : 'Cancel'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
