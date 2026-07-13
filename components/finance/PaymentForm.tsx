'use client'

import { useState } from 'react'
import type { PaymentMethod } from '@/types/finance'

interface PaymentFormProps {
  maxAmount: number
  onSubmit: (data: {
    amount: number
    payment_method: PaymentMethod
    payment_date: string
    reference_number?: string
    notes?: string
  }) => Promise<void>
  onCancel: () => void
}

export function PaymentForm({ maxAmount, onSubmit, onCancel }: PaymentFormProps) {
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (amount > maxAmount) {
      setError(`Amount cannot exceed outstanding balance of $${maxAmount.toFixed(2)}`)
      return
    }

    try {
      setSubmitting(true)
      await onSubmit({
        amount,
        payment_method: method,
        payment_date: date,
        reference_number: reference || undefined,
        notes: notes || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Amount *</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-600">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              required
              placeholder="0.00"
              className="w-full pl-7 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <p className="text-xs text-slate-600 mt-1">Max: ${maxAmount.toFixed(2)}</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Payment Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">Method *</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="card">Card</option>
          <option value="mobile_money">Mobile Money</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">
          Reference Number
        </label>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g., TXN123456"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes..."
          rows={3}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        />
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Recording...' : 'Record Payment'}
        </button>
      </div>
    </form>
  )
}
