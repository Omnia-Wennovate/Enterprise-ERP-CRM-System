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
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [amount, setAmount] = useState(0)
  const [tax, setTax] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0 },
  ])

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      setLoading(true)
      const supabase = await createClient()
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(50)

      setBookings(data || [])
    } catch (error) {
      console.error('Failed to load bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookingChange = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    const booking = bookings.find((b) => b.id === bookingId)
    if (booking) {
      setSelectedBooking(booking)
      setAmount(booking.total_revenue || 0)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedBookingId) {
      alert('Please select a booking')
      return
    }

    if (!dueDate) {
      alert('Please set a due date')
      return
    }

    try {
      setSubmitting(true)
      const formData: CreateInvoiceFormData = {
        booking_id: selectedBookingId,
        amount,
        tax,
        due_date: dueDate,
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
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/finance/invoices"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Create Invoice</h1>
            <p className="text-slate-600 mt-1">Generate a new invoice from a booking</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-8">
          {/* Booking Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Select Booking *
            </label>
            <select
              value={selectedBookingId}
              onChange={(e) => handleBookingChange(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50"
            >
              <option value="">
                {loading ? 'Loading bookings...' : 'Choose a booking...'}
              </option>
              {bookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.booking_reference} - {booking.customer_id} (${booking.total_revenue})
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Tax</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-slate-900">Line Items</label>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors"
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
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleLineItemChange(index, 'quantity', parseInt(e.target.value) || 1)
                    }
                    className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
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
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
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
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Amount:</span>
              <span className="font-semibold">${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Tax:</span>
              <span className="font-semibold">${tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-lg text-teal-600">${(amount + tax).toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end pt-8 border-t border-slate-200">
            <Link
              href="/finance/invoices"
              className="px-6 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
