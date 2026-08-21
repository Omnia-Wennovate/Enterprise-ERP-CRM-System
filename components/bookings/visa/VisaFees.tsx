'use client'

import { useState } from 'react'
import { DollarSign, Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import type { VisaFee, PaymentStatus } from '@/types/visa'

interface VisaFeesProps {
  fee: VisaFee | null
  visaApplicationId: string
  onSave: (fee: Partial<VisaFee>) => Promise<void>
}

export function VisaFees({ fee, visaApplicationId, onSave }: VisaFeesProps) {
  const [editing, setEditing] = useState(!fee)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    government_fee: fee?.government_fee || 0,
    agency_fee: fee?.agency_fee || 0,
    courier_fee: fee?.courier_fee || 0,
    service_fee: fee?.service_fee || 0,
    insurance_fee: fee?.insurance_fee || 0,
    vat: fee?.vat || 0,
    discount: fee?.discount || 0,
    payment_status: fee?.payment_status || 'pending',
    payment_method: fee?.payment_method || '',
  })

  const total = form.government_fee + form.agency_fee + form.courier_fee + form.service_fee + form.insurance_fee + form.vat - form.discount

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ ...form, visa_application_id: visaApplicationId })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const paymentStatusColors: Record<string, { icon: any; color: string; bg: string }> = {
    pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    paid: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    partial: { icon: AlertCircle, color: 'text-omnia-gold', bg: 'bg-omnia-gold/5' },
    overdue: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    refunded: { icon: DollarSign, color: 'text-muted-foreground', bg: 'bg-muted/50' },
  }

  const handleFieldChange = (field: string, value: string) => {
    setForm(p => ({ ...p, [field]: parseFloat(value) || 0 }))
  }

  if (!editing && fee) {
    const ps = paymentStatusColors[fee.payment_status] || paymentStatusColors.pending
    const PsIcon = ps.icon

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-foreground">Fee Summary</h4>
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-omnia-gold hover:text-foreground">Edit</button>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-slate-100">
            {[
              { label: 'Government Fee', value: fee.government_fee },
              { label: 'Agency Fee', value: fee.agency_fee },
              { label: 'Courier Fee', value: fee.courier_fee },
              { label: 'Service Fee', value: fee.service_fee },
              { label: 'Insurance Fee', value: fee.insurance_fee },
              { label: 'VAT', value: fee.vat },
            ].filter(r => r.value > 0).map(row => (
              <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className="text-sm font-medium text-foreground">${row.value.toFixed(2)}</span>
              </div>
            ))}
            {fee.discount > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-green-50">
                <span className="text-sm text-green-700">Discount</span>
                <span className="text-sm font-medium text-green-700">-${fee.discount.toFixed(2)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-t border-border">
            <span className="text-sm font-bold text-foreground">Total</span>
            <span className="text-lg font-bold text-foreground">${fee.total_amount?.toFixed(2)}</span>
          </div>
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Payment Status</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${ps.bg} ${ps.color}`}>
              <PsIcon className="w-3 h-3" />
              {fee.payment_status.charAt(0).toUpperCase() + fee.payment_status.slice(1)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-foreground">{fee ? 'Edit Fees' : 'Add Fees'}</h4>
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'government_fee', label: 'Government Fee' },
          { key: 'agency_fee', label: 'Agency Fee' },
          { key: 'courier_fee', label: 'Courier Fee' },
          { key: 'service_fee', label: 'Service Fee' },
          { key: 'insurance_fee', label: 'Insurance Fee' },
          { key: 'vat', label: 'VAT' },
          { key: 'discount', label: 'Discount' },
        ].map(field => (
          <div key={field.key}>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">{field.label}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full border-border rounded-lg text-sm"
              value={form[field.key as keyof typeof form]}
              onChange={e => handleFieldChange(field.key, e.target.value)}
            />
          </div>
        ))}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Payment Status</label>
          <select className="w-full border-border rounded-lg text-sm" value={form.payment_status} onChange={e => setForm(p => ({ ...p, payment_status: e.target.value }))}>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <p className="text-sm font-bold text-foreground">Total: <span className="text-lg">${total.toFixed(2)}</span></p>
        <div className="flex gap-2">
          {fee && <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs border border-border rounded-lg">Cancel</button>}
          <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 text-xs bg-omnia-gold text-primary-foreground rounded-lg hover:bg-omnia-gold-dark disabled:opacity-50 flex items-center gap-1">
            {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  )
}
