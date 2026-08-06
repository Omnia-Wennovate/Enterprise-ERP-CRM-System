'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, User, Building2, Mail, Phone, MapPin, Calendar, Plane,
  Users, Baby, DollarSign, FileText, Plus, Trash2, ChevronRight,
  ChevronLeft, Loader2, CheckCircle2, AlertCircle, Upload,
  Link2, Sparkles, ClipboardList, Receipt, StickyNote, Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createQuotation } from '@/lib/services/quotations'
import { getLeads } from '@/lib/services/leads'
import {
  quotationFormSchema,
  type QuotationFormData,
  type QuotationItemFormData,
  QUOTATION_STATUSES,
  QUOTATION_STATUS_LABELS,
  QUOTE_TYPES,
  QUOTE_TYPE_LABELS,
  SERVICE_TYPES,
  CURRENCIES_QT,
  PAYMENT_TERMS_OPTIONS,
  TRAVEL_TYPES_QT,
} from '@/types/quotation'
import type { LeadWithAgent } from '@/types/leads'
import { createClient } from '@/lib/supabase/client'

// ============================================================================
// SHARED STYLE CONSTANTS
// ============================================================================
const inputClass =
  'w-full px-3 py-2 text-sm bg-card border border-gray-200 rounded-lg outline-none transition-all duration-200 hover:border-gray-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 placeholder:text-gray-300'
const selectClass =
  'w-full px-3 py-2 text-sm bg-card border border-gray-200 rounded-lg outline-none transition-all duration-200 hover:border-gray-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 appearance-none cursor-pointer'
const textareaClass =
  'w-full px-3 py-2 text-sm bg-card border border-gray-200 rounded-lg outline-none transition-all duration-200 hover:border-gray-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 resize-none placeholder:text-gray-300'
const inputErrorClass = 'border-red-300 focus:border-red-400 focus:ring-red-400/20'

// ============================================================================
// MINI COMPONENTS
// ============================================================================
function FieldLabel({ label, required, icon: Icon }: { label: string; required?: boolean; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
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
      <div className="p-1.5 rounded-md bg-teal-50">
        <Icon className="w-4 h-4 text-teal-600" />
      </div>
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
    </div>
  )
}

// ============================================================================
// HELPERS
// ============================================================================
function calcItemTotal(item: Partial<QuotationItemFormData>): number {
  const qty = Number(item.quantity) || 0
  const price = Number(item.unit_price) || 0
  const disc = Number(item.discount) || 0
  const tax = Number(item.tax_rate) || 0
  const base = qty * price
  const afterDiscount = base - (base * disc) / 100
  const withTax = afterDiscount + (afterDiscount * tax) / 100
  return Math.round(withTax * 100) / 100
}

function calcTotals(items: QuotationItemFormData[]) {
  let subtotal = 0
  let discountAmount = 0
  let taxAmount = 0

  for (const item of items) {
    const qty = Number(item.quantity) || 0
    const price = Number(item.unit_price) || 0
    const disc = Number(item.discount) || 0
    const tax = Number(item.tax_rate) || 0
    const base = qty * price
    const discAmt = (base * disc) / 100
    const taxAmt = (base - discAmt) * (tax / 100)
    subtotal += base
    discountAmount += discAmt
    taxAmount += taxAmt
  }

  const grandTotal = subtotal - discountAmount + taxAmount
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount_amount: Math.round(discountAmount * 100) / 100,
    tax_amount: Math.round(taxAmount * 100) / 100,
    grand_total: Math.round(grandTotal * 100) / 100,
  }
}

// ============================================================================
// STEP INDICATOR
// ============================================================================
const STEPS = [
  { label: 'Source', icon: Link2 },
  { label: 'Trip', icon: Plane },
  { label: 'Pricing', icon: Receipt },
  { label: 'Terms', icon: StickyNote },
]

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 border-b border-gray-100">
      {STEPS.map((step, idx) => {
        const isActive = idx === current
        const isDone = idx < current
        const Icon = step.icon
        return (
          <div key={step.label} className="flex items-center gap-1.5">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all
              ${isActive ? 'bg-teal-600 text-primary-foreground shadow-sm' : isDone ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-400'}`}>
              <Icon className="w-3 h-3" />
              {step.label}
            </div>
            {idx < total - 1 && (
              <ChevronRight className={`w-3 h-3 ${idx < current ? 'text-teal-400' : 'text-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// PROPS
// ============================================================================
interface NewQuotationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function NewQuotationModal({ isOpen, onClose, onSuccess }: NewQuotationModalProps) {
  const [step, setStep] = useState(0)
  const [leads, setLeads] = useState<LeadWithAgent[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    trigger,
    control,
    formState: { errors },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationFormSchema) as any,
    defaultValues: {
      quote_type:          'manual',
      lead_id:             '',
      customer_name:       '',
      company:             '',
      contact_person:      '',
      email:               '',
      phone:               '',
      quote_title:         '',
      destination:         '',
      country:             '',
      city:                '',
      travel_type:         '',
      departure_date:      '',
      return_date:         '',
      adults:              1,
      children:            0,
      infants:             0,
      currency:            'USD',
      items:               [],
      subtotal:            0,
      discount_amount:     0,
      tax_amount:          0,
      grand_total:         0,
      quotation_date:      new Date().toISOString().split('T')[0],
      valid_until:         '',
      payment_terms:       '',
      cancellation_policy: '',
      notes:               '',
      internal_notes:      '',
      status:              'draft',
    },
  })

  const { fields, append, remove, update } = useFieldArray({ control, name: 'items' })

  const watchedItems = watch('items')
  const quoteType    = watch('quote_type')
  const leadId       = watch('lead_id')
  const currency     = watch('currency')

  // Computed totals
  useEffect(() => {
    const t = calcTotals(watchedItems ?? [])
    setValue('subtotal',        t.subtotal)
    setValue('discount_amount', t.discount_amount)
    setValue('tax_amount',      t.tax_amount)
    setValue('grand_total',     t.grand_total)
  }, [watchedItems, setValue])

  // Update item totals when row changes
  const updateItemTotal = useCallback((idx: number) => {
    const item = watchedItems[idx]
    if (!item) return
    const total = calcItemTotal(item)
    update(idx, { ...item, total })
  }, [watchedItems, update])

  // Load leads + current user on open
  useEffect(() => {
    if (!isOpen) return
    getLeads().then(setLeads).catch(() => setLeads([]))

    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id)
    })
  }, [isOpen])

  // Auto-populate from selected lead
  useEffect(() => {
    if (!leadId) return
    const lead = leads.find((l) => l.id === leadId)
    if (!lead) return

    setValue('customer_name',  lead.lead_name)
    setValue('company',        lead.company ?? '')
    setValue('contact_person', lead.contact_person ?? '')
    setValue('email',          lead.email ?? '')
    setValue('phone',          lead.phone ?? '')
    setValue('destination',    lead.destination ?? '')
    setValue('departure_date', lead.travel_date ?? '')
    setValue('return_date',    lead.return_date ?? '')
    setValue('adults',         lead.adults ?? 1)
    setValue('children',       lead.children ?? 0)
    setValue('infants',        lead.infants ?? 0)
    if (lead.notes) setValue('notes', lead.notes)
  }, [leadId, leads, setValue])

  const handleClose = useCallback(() => {
    reset()
    setStep(0)
    setSaveStatus('idle')
    setErrorMessage('')
    setUploadFiles([])
    onClose()
  }, [reset, onClose])

  const handleNext = async () => {
    const fieldsPerStep: (keyof QuotationFormData)[][] = [
      ['quote_type', 'customer_name'],
      ['quote_title', 'destination', 'departure_date', 'return_date'],
      [],
      ['valid_until'],
    ]
    const valid = await trigger(fieldsPerStep[step])
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const addItem = () => {
    append({ service: 'Flight', description: '', quantity: 1, unit_price: 0, discount: 0, tax_rate: 0, total: 0, sort_order: fields.length })
  }

  const onSubmit = async (data: QuotationFormData) => {
    setIsSaving(true)
    setSaveStatus('idle')
    setErrorMessage('')

    try {
      await createQuotation(data, currentUserId)
      setSaveStatus('success')
      setTimeout(() => {
        handleClose()
        onSuccess()
      }, 1200)
    } catch (err) {
      setSaveStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save quotation.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(val)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-card rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ width: '860px', maxWidth: '95vw', maxHeight: '90vh' }}
          >
            {/* ── HEADER ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-50">
                  <FileText className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">New Quotation</h2>
                  <p className="text-xs text-gray-500">Create a professional travel quotation</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── STEP INDICATOR ── */}
            <StepIndicator current={step} total={STEPS.length} />

            {/* ── FORM BODY ── */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-6">

                {/* ══ STEP 0: SOURCE & CUSTOMER ══ */}
                <AnimatePresence mode="wait">
                  {step === 0 && (
                    <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                      <SectionHeader icon={Link2} title="Quote Source" />
                      <div className="grid grid-cols-2 gap-3">
                        {QUOTE_TYPES.map((type) => (
                          <label key={type} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${quoteType === type ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <input type="radio" value={type} {...register('quote_type')} className="sr-only" />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${quoteType === type ? 'border-teal-500' : 'border-gray-300'}`}>
                              {quoteType === type && <div className="w-2 h-2 rounded-full bg-teal-500" />}
                            </div>
                            <span className="text-sm font-medium text-gray-700">{QUOTE_TYPE_LABELS[type]}</span>
                          </label>
                        ))}
                      </div>

                      {quoteType === 'from_lead' && (
                        <div className="space-y-1.5">
                          <FieldLabel label="Select Lead" icon={Sparkles} />
                          <select {...register('lead_id')} className={selectClass}>
                            <option value="">— Choose a lead —</option>
                            {leads.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.lead_name}{l.company ? ` · ${l.company}` : ''} ({l.pipeline_stage})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <SectionHeader icon={User} title="Customer Information" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 col-span-2">
                          <FieldLabel label="Customer / Company Name" required icon={User} />
                          <input {...register('customer_name')} className={`${inputClass} ${errors.customer_name ? inputErrorClass : ''}`} placeholder="e.g. Wanderlust Adventures" />
                          <FieldError message={errors.customer_name?.message} />
                        </div>
                        <div className="space-y-1.5">
                          <FieldLabel label="Company" icon={Building2} />
                          <input {...register('company')} className={inputClass} placeholder="Company name" />
                        </div>
                        <div className="space-y-1.5">
                          <FieldLabel label="Contact Person" icon={User} />
                          <input {...register('contact_person')} className={inputClass} placeholder="Full name" />
                        </div>
                        <div className="space-y-1.5">
                          <FieldLabel label="Email" icon={Mail} />
                          <input {...register('email')} type="email" className={inputClass} placeholder="email@example.com" />
                        </div>
                        <div className="space-y-1.5">
                          <FieldLabel label="Phone" icon={Phone} />
                          <input {...register('phone')} className={inputClass} placeholder="+1 555 000 0000" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ══ STEP 1: TRIP INFORMATION ══ */}
                  {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                      <SectionHeader icon={Plane} title="Trip Information" />
                      <div className="space-y-1.5">
                        <FieldLabel label="Quote Title" required icon={FileText} />
                        <input {...register('quote_title')} className={`${inputClass} ${errors.quote_title ? inputErrorClass : ''}`} placeholder="e.g. Iceland Adventure – 14 Days" />
                        <FieldError message={errors.quote_title?.message} />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5 col-span-3">
                          <FieldLabel label="Destination" required icon={MapPin} />
                          <input {...register('destination')} className={`${inputClass} ${errors.destination ? inputErrorClass : ''}`} placeholder="e.g. Iceland" />
                          <FieldError message={errors.destination?.message} />
                        </div>
                        <div className="space-y-1.5">
                          <FieldLabel label="Country" icon={MapPin} />
                          <input {...register('country')} className={inputClass} placeholder="Country" />
                        </div>
                        <div className="space-y-1.5">
                          <FieldLabel label="City" icon={MapPin} />
                          <input {...register('city')} className={inputClass} placeholder="City" />
                        </div>
                        <div className="space-y-1.5">
                          <FieldLabel label="Travel Type" icon={Tag} />
                          <select {...register('travel_type')} className={selectClass}>
                            <option value="">Select type</option>
                            {TRAVEL_TYPES_QT.map((t) => (
                              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <FieldLabel label="Departure Date" required icon={Calendar} />
                          <input {...register('departure_date')} type="date" className={`${inputClass} ${errors.departure_date ? inputErrorClass : ''}`} />
                          <FieldError message={errors.departure_date?.message} />
                        </div>
                        <div className="space-y-1.5">
                          <FieldLabel label="Return Date" required icon={Calendar} />
                          <input {...register('return_date')} type="date" className={`${inputClass} ${errors.return_date ? inputErrorClass : ''}`} />
                          <FieldError message={errors.return_date?.message} />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <FieldLabel label="Adults" required icon={Users} />
                          <input {...register('adults')} type="number" min="1" className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                          <FieldLabel label="Children" icon={Users} />
                          <input {...register('children')} type="number" min="0" className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                          <FieldLabel label="Infants" icon={Baby} />
                          <input {...register('infants')} type="number" min="0" className={inputClass} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ══ STEP 2: PRICING ══ */}
                  {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                      <div className="flex items-center justify-between">
                        <SectionHeader icon={Receipt} title="Pricing Items" />
                        <div className="flex items-center gap-3">
                          <div className="space-y-0">
                            <FieldLabel label="Currency" icon={DollarSign} />
                            <select {...register('currency')} className={`${selectClass} w-28`}>
                              {CURRENCIES_QT.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Items Table */}
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 grid text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2.5"
                          style={{ gridTemplateColumns: '160px 1fr 60px 110px 70px 70px 110px 36px' }}>
                          <span>Service</span>
                          <span>Description</span>
                          <span className="text-center">Qty</span>
                          <span className="text-right">Unit Price</span>
                          <span className="text-center">Disc %</span>
                          <span className="text-center">Tax %</span>
                          <span className="text-right">Total</span>
                          <span />
                        </div>

                        <div className="divide-y divide-gray-100">
                          {fields.map((field, idx) => (
                            <div key={field.id}
                              className="grid items-center px-3 py-2 gap-2 hover:bg-gray-50 transition-colors"
                              style={{ gridTemplateColumns: '160px 1fr 60px 110px 70px 70px 110px 36px' }}>
                              <select
                                {...register(`items.${idx}.service`)}
                                className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-card focus:border-teal-400 outline-none"
                                onChange={(e) => {
                                  setValue(`items.${idx}.service`, e.target.value)
                                }}>
                                {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <input
                                {...register(`items.${idx}.description`)}
                                placeholder="Description"
                                className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-card focus:border-teal-400 outline-none w-full"
                              />
                              <input
                                {...register(`items.${idx}.quantity`, { valueAsNumber: true })}
                                type="number" min="1"
                                className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-card focus:border-teal-400 outline-none text-center"
                                onChange={(e) => {
                                  setValue(`items.${idx}.quantity`, parseInt(e.target.value) || 1)
                                  setTimeout(() => updateItemTotal(idx), 0)
                                }}
                              />
                              <input
                                {...register(`items.${idx}.unit_price`, { valueAsNumber: true })}
                                type="number" min="0" step="0.01"
                                className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-card focus:border-teal-400 outline-none text-right"
                                onChange={(e) => {
                                  setValue(`items.${idx}.unit_price`, parseFloat(e.target.value) || 0)
                                  setTimeout(() => updateItemTotal(idx), 0)
                                }}
                              />
                              <input
                                {...register(`items.${idx}.discount`, { valueAsNumber: true })}
                                type="number" min="0" max="100" step="0.1"
                                className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-card focus:border-teal-400 outline-none text-center"
                                onChange={(e) => {
                                  setValue(`items.${idx}.discount`, parseFloat(e.target.value) || 0)
                                  setTimeout(() => updateItemTotal(idx), 0)
                                }}
                              />
                              <input
                                {...register(`items.${idx}.tax_rate`, { valueAsNumber: true })}
                                type="number" min="0" max="100" step="0.1"
                                className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-card focus:border-teal-400 outline-none text-center"
                                onChange={(e) => {
                                  setValue(`items.${idx}.tax_rate`, parseFloat(e.target.value) || 0)
                                  setTimeout(() => updateItemTotal(idx), 0)
                                }}
                              />
                              <div className="text-xs font-semibold text-teal-700 text-right">
                                {formatCurrency(watchedItems?.[idx]?.total ?? 0)}
                              </div>
                              <button type="button" onClick={() => remove(idx)}
                                className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="px-3 py-2 border-t border-gray-100 bg-card">
                          <button type="button" onClick={addItem}
                            className="flex items-center gap-1.5 text-xs text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                            <Plus className="w-3.5 h-3.5" /> Add Item
                          </button>
                        </div>
                      </div>

                      {/* Totals Summary */}
                      <div className="flex justify-end">
                        <div className="w-64 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                          <div className="px-4 py-2 flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-medium">{formatCurrency(watch('subtotal'))}</span>
                          </div>
                          <div className="px-4 py-2 flex justify-between text-sm text-gray-600">
                            <span>Discount</span>
                            <span className="font-medium text-red-500">−{formatCurrency(watch('discount_amount'))}</span>
                          </div>
                          <div className="px-4 py-2 flex justify-between text-sm text-gray-600 border-b border-gray-200">
                            <span>Tax</span>
                            <span className="font-medium">{formatCurrency(watch('tax_amount'))}</span>
                          </div>
                          <div className="px-4 py-3 flex justify-between bg-teal-600 text-primary-foreground">
                            <span className="font-bold">Grand Total</span>
                            <span className="font-bold">{formatCurrency(watch('grand_total'))}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ══ STEP 3: TERMS & META ══ */}
                  {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                      <SectionHeader icon={ClipboardList} title="Validity & Terms" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <FieldLabel label="Quotation Date" icon={Calendar} />
                          <input {...register('quotation_date')} type="date" className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                          <FieldLabel label="Valid Until" required icon={Calendar} />
                          <input {...register('valid_until')} type="date" className={`${inputClass} ${errors.valid_until ? inputErrorClass : ''}`} />
                          <FieldError message={errors.valid_until?.message} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <FieldLabel label="Payment Terms" icon={DollarSign} />
                        <select {...register('payment_terms')} className={selectClass}>
                          <option value="">Select payment terms</option>
                          {PAYMENT_TERMS_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <FieldLabel label="Cancellation Policy" icon={FileText} />
                        <textarea {...register('cancellation_policy')} rows={2} className={textareaClass} placeholder="e.g. Full refund if cancelled 30 days before departure..." />
                      </div>

                      <div className="space-y-1.5">
                        <FieldLabel label="Notes (visible to customer)" icon={StickyNote} />
                        <textarea {...register('notes')} rows={3} className={textareaClass} placeholder="Any special notes for the customer..." />
                      </div>

                      <div className="space-y-1.5">
                        <FieldLabel label="Internal Notes (not on PDF)" icon={StickyNote} />
                        <textarea {...register('internal_notes')} rows={2} className={`${textareaClass} bg-yellow-50 border-yellow-200 focus:border-yellow-400`} placeholder="Internal team notes..." />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <FieldLabel label="Status" icon={Tag} />
                          <select {...register('status')} className={selectClass}>
                            {QUOTATION_STATUSES.map((s) => (
                              <option key={s} value={s}>{QUOTATION_STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Attachments */}
                      <div className="space-y-2">
                        <FieldLabel label="Attachments" icon={Upload} />
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-teal-300 hover:bg-teal-50/30 transition-all cursor-pointer">
                          <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">Click to upload PDF, images, brochures</p>
                          <p className="text-xs text-gray-400 mt-0.5">Files will be stored in Supabase Storage</p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="sr-only"
                          onChange={(e) => setUploadFiles(Array.from(e.target.files ?? []))}
                        />
                        {uploadFiles.length > 0 && (
                          <ul className="space-y-1">
                            {uploadFiles.map((f, i) => (
                              <li key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
                                <FileText className="w-3 h-3 text-teal-500" />
                                {f.name}
                                <button type="button" onClick={() => setUploadFiles((prev) => prev.filter((_, j) => j !== i))} className="ml-auto text-gray-400 hover:text-red-500">
                                  <X className="w-3 h-3" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── FOOTER ── */}
              <div className="border-t border-gray-100 px-6 py-4 bg-card flex items-center justify-between gap-3">
                {saveStatus === 'error' && (
                  <p className="text-xs text-red-500 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errorMessage}
                  </p>
                )}
                {saveStatus === 'success' && (
                  <p className="text-xs text-green-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Quotation saved successfully!
                  </p>
                )}
                {saveStatus === 'idle' && <div />}

                <div className="flex items-center gap-2 ml-auto">
                  {step > 0 && (
                    <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} className="gap-1.5">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </Button>
                  )}
                  {step < STEPS.length - 1 ? (
                    <Button type="button" onClick={handleNext} className="bg-teal-600 hover:bg-teal-700 text-primary-foreground gap-1.5">
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSaving || saveStatus === 'success'}
                      className="bg-teal-600 hover:bg-teal-700 text-primary-foreground gap-2 min-w-32">
                      {isSaving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                      ) : saveStatus === 'success' ? (
                        <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                      ) : (
                        <><FileText className="w-4 h-4" /> Save Quotation</>
                      )}
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
