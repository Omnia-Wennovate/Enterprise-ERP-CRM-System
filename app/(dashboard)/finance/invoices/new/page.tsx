'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { createInvoiceAction } from '@/app/actions/invoices'
import type { Booking } from '@/types'
import type { CreateInvoiceFormData, InvoiceLineItem } from '@/types/finance'

interface LineItem {
  description: string
  quantity: number
  unit_price: number
}

export default function CreateInvoicePage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [sourceType, setSourceType] = useState<'booking' | 'quotation' | 'none'>('none')
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [selectedQuotationId, setSelectedQuotationId] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [selectedQuotation, setSelectedQuotation] = useState<any | null>(null)
  
  const [customerId, setCustomerId] = useState('')
  const [amount, setAmount] = useState(0)
  const [tax, setTax] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0 },
  ])

  useEffect(() => {
    loadSources()
  }, [])

  const [customers, setCustomers] = useState<any[]>([])

  const loadSources = async () => {
    try {
      setLoading(true)
      const supabase = await createClient()
      
      const [bookingsRes, quotationsRes, customersRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('quotations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('customers')
          .select('id, company_name')
          .order('created_at', { ascending: false })
          .limit(50)
      ])

      setBookings(bookingsRes.data || [])
      setQuotations(quotationsRes.data || [])
      setCustomers(customersRes.data || [])
    } catch (error) {
      console.error('Failed to load sources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookingChange = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    const booking = bookings.find((b) => b.id === bookingId)
    if (booking) {
      setSelectedBooking(booking)
      setCustomerId(booking.customer_id)
      setAmount(booking.total_cost || 0)
    }
  }

  const handleQuotationChange = (quotationId: string) => {
    setSelectedQuotationId(quotationId)
    const quotation = quotations.find((q) => q.id === quotationId)
    if (quotation) {
      setSelectedQuotation(quotation)
      setCustomerId(quotation.customer_id || quotation.lead_id || '')
      setAmount(quotation.total_amount || 0)
    }
  }

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0 }])
  }

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const handleLineItemChange = (
    index: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    setLineItems(updated)
  }

  const [currency, setCurrency] = useState('USD')
  const [exchangeRate, setExchangeRate] = useState(1)
  const [discount, setDiscount] = useState(0)
  const [priority, setPriority] = useState('normal')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (sourceType === 'booking' && !selectedBookingId) {
      alert('Please select a booking')
      return
    }

    if (sourceType === 'quotation' && !selectedQuotationId) {
      alert('Please select a quotation')
      return
    }

    if (sourceType === 'none' && !customerId) {
      alert('Please select a customer')
      return
    }

    if (!dueDate) {
      alert('Please set a due date')
      return
    }

    try {
      setSubmitting(true)

      // Read user ID from localStorage (app uses localStorage-based auth, not Supabase session cookies)
      let createdBy: string | undefined
      try {
        const authUser = localStorage.getItem('auth_user')
        const authToken = localStorage.getItem('auth_token')
        if (authUser) {
          const parsed = JSON.parse(authUser)
          // Use the real UUID profile ID if available, otherwise send the token
          // so the server can decode the email and find the profile
          createdBy = parsed.id || authToken || undefined
        } else if (authToken) {
          createdBy = authToken
        }
      } catch {}

      const formData: CreateInvoiceFormData = {
        booking_id: sourceType === 'booking' ? selectedBookingId : '',
        customer_id: customerId,
        amount,
        tax,
        discount,
        due_date: dueDate,
        currency,
        exchange_rate: exchangeRate,
        priority,
        tags: [],
        quotation_id: sourceType === 'quotation' ? selectedQuotationId : undefined,
        is_recurring: false,
        created_by: createdBy,
        line_items: lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      }

      await createInvoiceAction(formData)
      router.push('/finance/invoices')
    } catch (error) {
      console.error('Failed to create invoice:', error)
      alert('Failed to create invoice')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/finance/invoices"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-card transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create Invoice</h1>
            <p className="text-muted-foreground mt-1">Generate a new invoice from a booking</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-lg shadow p-8 space-y-8">
          {/* Source Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Source Type
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as any)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
              >
                <option value="none">Standalone Invoice</option>
                <option value="booking">From Booking</option>
                <option value="quotation">From Quotation</option>
              </select>
            </div>

            {sourceType === 'booking' && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Select Booking *
                </label>
                {bookings.length === 0 && !loading ? (
                  <div className="text-sm text-red-500 py-2">No bookings available.</div>
                ) : (
                  <select
                    value={selectedBookingId}
                    onChange={(e) => handleBookingChange(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500 disabled:bg-muted/50"
                  >
                    <option value="">
                      {loading ? 'Loading bookings...' : 'Choose a booking...'}
                    </option>
                    {bookings.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        {booking.booking_reference} - {booking.customer_id} (${booking.total_cost})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {sourceType === 'quotation' && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Select Quotation *
                </label>
                {quotations.length === 0 && !loading ? (
                  <div className="text-sm text-red-500 py-2">No quotations available.</div>
                ) : (
                  <select
                    value={selectedQuotationId}
                    onChange={(e) => handleQuotationChange(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500 disabled:bg-muted/50"
                  >
                    <option value="">
                      {loading ? 'Loading quotations...' : 'Choose a quotation...'}
                    </option>
                    {quotations.map((quotation) => (
                      <option key={quotation.id} value={quotation.id}>
                        {quotation.quotation_number} - {quotation.customer_id || quotation.lead_id} (${quotation.total_amount})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {sourceType === 'none' && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Select Customer *
                </label>
                {customers.length === 0 && !loading ? (
                  <div className="text-sm text-red-500 py-2">No customers available.</div>
                ) : (
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500 disabled:bg-muted/50"
                  >
                    <option value="">
                      {loading ? 'Loading customers...' : 'Choose a customer...'}
                    </option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.company_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AED">AED</option>
                <option value="SAR">SAR</option>
                <option value="ETB">ETB (Br)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Tax</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Discount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-foreground">Line Items</label>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-omnia-gold/15 text-omnia-gold-dark rounded-lg hover:bg-teal-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleLineItemChange(index, 'quantity', parseInt(e.target.value) || 1)
                    }
                    className="w-20 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Unit Price"
                    step="0.01"
                    min="0"
                    value={item.unit_price}
                    onChange={(e) =>
                      handleLineItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)
                    }
                    className="w-24 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveLineItem(index)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Total Preview */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-semibold">${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax:</span>
              <span className="font-semibold">${tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-lg text-omnia-gold">${(amount + tax).toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end pt-8 border-t border-border">
            <Link
              href="/finance/invoices"
              className="px-6 py-2 border border-border rounded-lg font-medium text-slate-700 hover:bg-muted/50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-omnia-gold text-primary-foreground rounded-lg font-medium hover:bg-omnia-gold-dark transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
