'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, FileText, Plus, Trash2, ChevronRight, ChevronLeft, Loader2,
  CheckCircle2, AlertCircle, Calendar, DollarSign, MapPin, User,
  Baby, Users, Receipt, StickyNote, ClipboardList, Tag, Upload, Link2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateQuotation } from '@/lib/services/quotations'
import {
  quotationFormSchema,
  type QuotationFormData,
  type QuotationItemFormData,
  QUOTATION_STATUSES,
  QUOTATION_STATUS_LABELS,
  SERVICE_TYPES,
  CURRENCIES_QT,
  PAYMENT_TERMS_OPTIONS,
  TRAVEL_TYPES_QT,
} from '@/types/quotation'
import type { QuotationWithItems } from '@/types/quotation'

// ────────────────────────────────────────────────────────────
// Shared styles
// ────────────────────────────────────────────────────────────
const inputClass =
  'w-full px-3 py-2 text-sm bg-card border border-border rounded-lg outline-none transition-all duration-200 hover:border-border focus:border-omnia-gold/60 focus:ring-2 focus:ring-teal-400/20 placeholder:text-gray-300'
const selectClass =
  'w-full px-3 py-2 text-sm bg-card border border-border rounded-lg outline-none transition-all duration-200 hover:border-border focus:border-omnia-gold/60 focus:ring-2 focus:ring-teal-400/20 appearance-none cursor-pointer'
const textareaClass =
  'w-full px-3 py-2 text-sm bg-card border border-border rounded-lg outline-none transition-all duration-200 hover:border-border focus:border-omnia-gold/60 focus:ring-2 focus:ring-teal-400/20 resize-none placeholder:text-gray-300'

function FieldLabel({ label, required, icon: Icon }: { label: string; required?: boolean; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 flex items-center gap-1 mt-1">
      <AlertCircle className="w-3 h-3" />
      {message}
    </motion.p>
  )
}

function SectionHeader({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 mb-4 border-b border-gray-100">
      <div className="p-1.5 rounded-md bg-omnia-gold/10">
        <Icon className="w-4 h-4 text-omnia-gold" />
      </div>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
    </div>
  )
}

function calcItemTotal(item: Partial<QuotationItemFormData>): number {
  const qty = Number(item.quantity) || 0
  const price = Number(item.unit_price) || 0
  const disc = Number(item.discount) || 0
  const tax = Number(item.tax_rate) || 0
  const base = qty * price
  const afterDiscount = base - (base * disc) / 100
  return Math.round((afterDiscount + afterDiscount * (tax / 100)) * 100) / 100
}

function calcTotals(items: QuotationItemFormData[]) {
  let subtotal = 0, discountAmount = 0, taxAmount = 0
  for (const item of items) {
    const base = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
    const discAmt = base * ((Number(item.discount) || 0) / 100)
    const taxAmt = (base - discAmt) * ((Number(item.tax_rate) || 0) / 100)
    subtotal += base
    discountAmount += discAmt
    taxAmount += taxAmt
  }
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount_amount: Math.round(discountAmount * 100) / 100,
    tax_amount: Math.round(taxAmount * 100) / 100,
    grand_total: Math.round((subtotal - discountAmount + taxAmount) * 100) / 100,
  }
}

const EDIT_STEPS = [
  { label: 'Customer', icon: User },
  { label: 'Trip', icon: MapPin },
  { label: 'Pricing', icon: Receipt },
  { label: 'Terms', icon: StickyNote },
]

interface EditQuotationModalProps {
  quotation: QuotationWithItems
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditQuotationModal({ quotation, isOpen, onClose, onSuccess }: EditQuotationModalProps) {
  const [step, setStep] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register, handleSubmit, reset, setValue, watch, trigger, control,
    formState: { errors },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationFormSchema) as any,
  })

  const { fields, append, remove, update } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')
  const currency = watch('currency')

  // Populate form with existing quotation data
  useEffect(() => {
    if (!isOpen || !quotation) return
    reset({
      quote_type:          quotation.quote_type,
      lead_id:             quotation.lead_id ?? '',
      customer_name:       quotation.customer_name,
      company:             quotation.company ?? '',
      contact_person:      quotation.contact_person ?? '',
      email:               quotation.email ?? '',
      phone:               quotation.phone ?? '',
      quote_title:         quotation.quote_title,
      destination:         quotation.destination,
      country:             quotation.country ?? '',
      city:                quotation.city ?? '',
      travel_type:         quotation.travel_type ?? '',
      departure_date:      quotation.departure_date,
      return_date:         quotation.return_date,
      adults:              quotation.adults,
      children:            quotation.children,
      infants:             quotation.infants,
      currency:            quotation.currency,
      items:               quotation.items.map((i) => ({
        id:          i.id,
        service:     i.service,
        description: i.description ?? '',
        quantity:    i.quantity,
        unit_price:  i.unit_price,
        discount:    i.discount,
        tax_rate:    i.tax_rate,
        total:       i.total,
        sort_order:  i.sort_order,
      })),
      subtotal:            quotation.subtotal,
      discount_amount:     quotation.discount_amount,
      tax_amount:          quotation.tax_amount,
      grand_total:         quotation.grand_total,
      quotation_date:      quotation.quotation_date,
      valid_until:         quotation.valid_until,
      payment_terms:       quotation.payment_terms ?? '',
      cancellation_policy: quotation.cancellation_policy ?? '',
      notes:               quotation.notes ?? '',
      internal_notes:      quotation.internal_notes ?? '',
      status:              quotation.status,
    })
    setStep(0)
    setSaveStatus('idle')
  }, [isOpen, quotation, reset])

  // Recalculate totals
  useEffect(() => {
    if (!watchedItems) return
    const t = calcTotals(watchedItems)
    setValue('subtotal', t.subtotal)
    setValue('discount_amount', t.discount_amount)
    setValue('tax_amount', t.tax_amount)
    setValue('grand_total', t.grand_total)
  }, [watchedItems, setValue])

  const updateItemTotal = useCallback((idx: number) => {
    const item = watchedItems?.[idx]
    if (!item) return
    update(idx, { ...item, total: calcItemTotal(item) })
  }, [watchedItems, update])

  const handleClose = useCallback(() => {
    setStep(0)
    setSaveStatus('idle')
    setErrorMessage('')
    onClose()
  }, [onClose])

  const handleNext = async () => {
    const fieldsPerStep: (keyof QuotationFormData)[][] = [
      ['customer_name'],
      ['quote_title', 'destination', 'departure_date', 'return_date'],
      [],
      ['valid_until'],
    ]
    const valid = await trigger(fieldsPerStep[step])
    if (valid) setStep((s) => Math.min(s + 1, EDIT_STEPS.length - 1))
  }

  const onSubmit = async (data: QuotationFormData) => {
    setIsSaving(true)
    setSaveStatus('idle')
    try {
      await updateQuotation(quotation.id, data)
      setSaveStatus('success')
      setTimeout(() => { handleClose(); onSuccess() }, 1200)
    } catch (err) {
      setSaveStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save changes.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(val)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-card rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ width: '860px', maxWidth: '95vw', maxHeight: '90vh' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-omnia-gold/5">
                  <FileText className="w-5 h-5 text-omnia-gold" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Edit Quotation</h2>
                  <p className="text-xs text-muted-foreground font-mono">{quotation.quote_number}</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 rounded-lg text-muted-foreground hover:text-muted-foreground hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 px-6 py-3 bg-muted border-b border-gray-100">
              {EDIT_STEPS.map((s, idx) => {
                const isActive = idx === step
                const isDone = idx < step
                const Icon = s.icon
                return (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all
                      ${isActive ? 'bg-omnia-gold text-primary-foreground shadow-sm' : isDone ? 'bg-omnia-gold/15 text-omnia-gold-dark' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="w-3 h-3" />{s.label}
                    </div>
                    {idx < EDIT_STEPS.length - 1 && <ChevronRight className={`w-3 h-3 ${idx < step ? 'text-teal-400' : 'text-gray-200'}`} />}
                  </div>
                )
              })}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-6">
                <AnimatePresence mode="wait">

                  {/* Step 0: Customer */}
                  {step === 0 && (
                    <motion.div key="e0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                      <SectionHeader icon={User} title="Customer Information" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1.5">
                          <FieldLabel label="Customer Name" required icon={User} />
                          <input {...register('customer_name')} className={inputClass} />
                          <FieldError message={errors.customer_name?.message} />
                        </div>
                        <div className="space-y-1.5"><FieldLabel label="Company" /><input {...register('company')} className={inputClass} /></div>
                        <div className="space-y-1.5"><FieldLabel label="Contact Person" /><input {...register('contact_person')} className={inputClass} /></div>
                        <div className="space-y-1.5"><FieldLabel label="Email" /><input {...register('email')} type="email" className={inputClass} /></div>
                        <div className="space-y-1.5"><FieldLabel label="Phone" /><input {...register('phone')} className={inputClass} /></div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 1: Trip */}
                  {step === 1 && (
                    <motion.div key="e1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                      <SectionHeader icon={MapPin} title="Trip Information" />
                      <div className="space-y-1.5">
                        <FieldLabel label="Quote Title" required /><input {...register('quote_title')} className={inputClass} />
                        <FieldError message={errors.quote_title?.message} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5 col-span-3"><FieldLabel label="Destination" required /><input {...register('destination')} className={inputClass} /></div>
                        <div className="space-y-1.5"><FieldLabel label="Country" /><input {...register('country')} className={inputClass} /></div>
                        <div className="space-y-1.5"><FieldLabel label="City" /><input {...register('city')} className={inputClass} /></div>
                        <div className="space-y-1.5">
                          <FieldLabel label="Travel Type" />
                          <select {...register('travel_type')} className={selectClass}>
                            <option value="">Select type</option>
                            {TRAVEL_TYPES_QT.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5"><FieldLabel label="Departure Date" required icon={Calendar} /><input {...register('departure_date')} type="date" className={inputClass} /></div>
                        <div className="space-y-1.5"><FieldLabel label="Return Date" required icon={Calendar} /><input {...register('return_date')} type="date" className={inputClass} /></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5"><FieldLabel label="Adults" /><input {...register('adults')} type="number" min="1" className={inputClass} /></div>
                        <div className="space-y-1.5"><FieldLabel label="Children" /><input {...register('children')} type="number" min="0" className={inputClass} /></div>
                        <div className="space-y-1.5"><FieldLabel label="Infants" /><input {...register('infants')} type="number" min="0" className={inputClass} /></div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Pricing */}
                  {step === 2 && (
                    <motion.div key="e2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                      <div className="flex items-start justify-between">
                        <SectionHeader icon={Receipt} title="Pricing Items" />
                        <div className="space-y-1">
                          <FieldLabel label="Currency" icon={DollarSign} />
                          <select {...register('currency')} className={`${selectClass} w-28`}>
                            {CURRENCIES_QT.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="border border-border rounded-xl overflow-hidden">
                        <div className="bg-muted grid text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2.5"
                          style={{ gridTemplateColumns: '160px 1fr 60px 110px 70px 70px 110px 36px' }}>
                          <span>Service</span><span>Description</span><span className="text-center">Qty</span>
                          <span className="text-right">Unit Price</span><span className="text-center">Disc%</span>
                          <span className="text-center">Tax%</span><span className="text-right">Total</span><span />
                        </div>
                        <div className="divide-y divide-gray-100">
                          {fields.map((field, idx) => (
                            <div key={field.id} className="grid items-center px-3 py-2 gap-2 hover:bg-muted"
                              style={{ gridTemplateColumns: '160px 1fr 60px 110px 70px 70px 110px 36px' }}>
                              <select {...register(`items.${idx}.service`)} className="text-xs px-2 py-1.5 border border-border rounded-lg bg-card focus:border-omnia-gold/60 outline-none">
                                {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <input {...register(`items.${idx}.description`)} placeholder="Description" className="text-xs px-2 py-1.5 border border-border rounded-lg bg-card focus:border-omnia-gold/60 outline-none w-full" />
                              <input {...register(`items.${idx}.quantity`, { valueAsNumber: true })} type="number" min="1" className="text-xs px-2 py-1.5 border border-border rounded-lg text-center bg-card focus:border-omnia-gold/60 outline-none"
                                onChange={(e) => { setValue(`items.${idx}.quantity`, parseInt(e.target.value) || 1); setTimeout(() => updateItemTotal(idx), 0) }} />
                              <input {...register(`items.${idx}.unit_price`, { valueAsNumber: true })} type="number" min="0" step="0.01" className="text-xs px-2 py-1.5 border border-border rounded-lg text-right bg-card focus:border-omnia-gold/60 outline-none"
                                onChange={(e) => { setValue(`items.${idx}.unit_price`, parseFloat(e.target.value) || 0); setTimeout(() => updateItemTotal(idx), 0) }} />
                              <input {...register(`items.${idx}.discount`, { valueAsNumber: true })} type="number" min="0" max="100" step="0.1" className="text-xs px-2 py-1.5 border border-border rounded-lg text-center bg-card focus:border-omnia-gold/60 outline-none"
                                onChange={(e) => { setValue(`items.${idx}.discount`, parseFloat(e.target.value) || 0); setTimeout(() => updateItemTotal(idx), 0) }} />
                              <input {...register(`items.${idx}.tax_rate`, { valueAsNumber: true })} type="number" min="0" max="100" step="0.1" className="text-xs px-2 py-1.5 border border-border rounded-lg text-center bg-card focus:border-omnia-gold/60 outline-none"
                                onChange={(e) => { setValue(`items.${idx}.tax_rate`, parseFloat(e.target.value) || 0); setTimeout(() => updateItemTotal(idx), 0) }} />
                              <div className="text-xs font-semibold text-omnia-gold-dark text-right">{formatCurrency(watchedItems?.[idx]?.total ?? 0)}</div>
                              <button type="button" onClick={() => remove(idx)} className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="px-3 py-2 border-t border-gray-100">
                          <button type="button" onClick={() => append({ service: 'Flight', description: '', quantity: 1, unit_price: 0, discount: 0, tax_rate: 0, total: 0, sort_order: fields.length })}
                            className="flex items-center gap-1.5 text-xs text-omnia-gold font-semibold hover:text-omnia-gold-dark">
                            <Plus className="w-3.5 h-3.5" /> Add Item
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <div className="w-64 bg-muted rounded-xl border border-border overflow-hidden">
                          <div className="px-4 py-2 flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span className="font-medium">{formatCurrency(watch('subtotal'))}</span></div>
                          <div className="px-4 py-2 flex justify-between text-sm text-muted-foreground"><span>Discount</span><span className="font-medium text-red-500">−{formatCurrency(watch('discount_amount'))}</span></div>
                          <div className="px-4 py-2 flex justify-between text-sm text-muted-foreground border-b border-border"><span>Tax</span><span className="font-medium">{formatCurrency(watch('tax_amount'))}</span></div>
                          <div className="px-4 py-3 flex justify-between bg-omnia-gold text-primary-foreground"><span className="font-bold">Grand Total</span><span className="font-bold">{formatCurrency(watch('grand_total'))}</span></div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Terms */}
                  {step === 3 && (
                    <motion.div key="e3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                      <SectionHeader icon={ClipboardList} title="Validity & Terms" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5"><FieldLabel label="Quotation Date" icon={Calendar} /><input {...register('quotation_date')} type="date" className={inputClass} /></div>
                        <div className="space-y-1.5">
                          <FieldLabel label="Valid Until" required icon={Calendar} />
                          <input {...register('valid_until')} type="date" className={inputClass} />
                          <FieldError message={errors.valid_until?.message} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel label="Payment Terms" icon={DollarSign} />
                        <select {...register('payment_terms')} className={selectClass}>
                          <option value="">Select</option>
                          {PAYMENT_TERMS_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5"><FieldLabel label="Cancellation Policy" /><textarea {...register('cancellation_policy')} rows={2} className={textareaClass} /></div>
                      <div className="space-y-1.5"><FieldLabel label="Notes" /><textarea {...register('notes')} rows={3} className={textareaClass} /></div>
                      <div className="space-y-1.5"><FieldLabel label="Internal Notes" /><textarea {...register('internal_notes')} rows={2} className={`${textareaClass} bg-yellow-50 border-yellow-200`} /></div>
                      <div className="space-y-1.5">
                        <FieldLabel label="Status" icon={Tag} />
                        <select {...register('status')} className={selectClass}>
                          {QUOTATION_STATUSES.map((s) => <option key={s} value={s}>{QUOTATION_STATUS_LABELS[s]}</option>)}
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 px-6 py-4 bg-card flex items-center justify-between">
                {saveStatus === 'error' && <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{errorMessage}</p>}
                {saveStatus === 'success' && <p className="text-xs text-green-600 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />Changes saved!</p>}
                {saveStatus === 'idle' && <div />}
                <div className="flex items-center gap-2 ml-auto">
                  {step > 0 && <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} className="gap-1.5"><ChevronLeft className="w-4 h-4" />Back</Button>}
                  {step < EDIT_STEPS.length - 1 ? (
                    <Button type="button" onClick={handleNext} className="bg-omnia-gold hover:bg-omnia-gold-dark text-primary-foreground gap-1.5">Next<ChevronRight className="w-4 h-4" /></Button>
                  ) : (
                    <Button type="submit" disabled={isSaving || saveStatus === 'success'} className="bg-omnia-gold hover:bg-omnia-gold-dark text-primary-foreground gap-2 min-w-32">
                      {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : saveStatus === 'success' ? <><CheckCircle2 className="w-4 h-4" />Saved!</> : 'Save Changes'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
