'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, User, Building2, Mail, Phone, MapPin, DollarSign,
  Loader2, CheckCircle2, AlertCircle, Briefcase, Star,
  CalendarDays, Cake, Smartphone, StickyNote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createCustomerAction, updateCustomerAction } from '@/app/actions/crm'
import { calculateAge } from '@/lib/utils/age'
import type { Customer } from '@/types'
import type { CustomerInput } from '@/lib/services/customers'

interface CustomerFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (customer: Customer) => void
  /** If provided, the form is in EDIT mode and will be pre-populated */
  customer?: Customer | null
}

const inputClass =
  'w-full px-3 py-2 text-sm bg-card border border-border rounded-lg outline-none transition-all duration-200 hover:border-border focus:border-omnia-gold/60 focus:ring-2 focus:ring-teal-400/20 placeholder:text-muted-foreground/50'

const selectClass =
  'w-full px-3 py-2 text-sm bg-card border border-border rounded-lg outline-none transition-all duration-200 hover:border-border focus:border-omnia-gold/60 focus:ring-2 focus:ring-teal-400/20 appearance-none cursor-pointer'

function FormField({
  label, required, error, children, icon: Icon, hint,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500 flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3" />
          {error}
        </motion.p>
      )}
    </div>
  )
}

function SectionHeader({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 mb-4 border-b border-border/50">
      <div className="p-1.5 rounded-md bg-omnia-gold/10">
        <Icon className="w-4 h-4 text-omnia-gold" />
      </div>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
    </div>
  )
}

type FormData = CustomerInput & { date_of_birth?: string }

export function CustomerFormModal({ isOpen, onClose, onSuccess, customer }: CustomerFormModalProps) {
  const isEditMode = !!customer
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [dobAge, setDobAge] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      mobile: '',
      address: '',
      city: '',
      country: '',
      customer_type: 'leisure',
      annual_value: 0,
      is_active: true,
      notes: '',
      date_of_birth: '',
    },
  })

  // Pre-populate form when editing
  useEffect(() => {
    if (isOpen) {
      if (customer) {
        reset({
          company_name: customer.company_name || '',
          contact_name: customer.contact_name || '',
          email: customer.email || '',
          phone: customer.phone || '',
          mobile: customer.mobile || '',
          address: customer.address || '',
          city: customer.city || '',
          country: customer.country || '',
          customer_type: customer.customer_type || 'leisure',
          annual_value: customer.annual_value || 0,
          is_active: customer.is_active ?? true,
          notes: customer.notes || '',
          date_of_birth: customer.date_of_birth || '',
        })
        if (customer.date_of_birth) setDobAge(calculateAge(customer.date_of_birth))
      } else {
        reset({
          company_name: '', contact_name: '', email: '', phone: '',
          mobile: '', address: '', city: '', country: '',
          customer_type: 'leisure', annual_value: 0, is_active: true,
          notes: '', date_of_birth: '',
        })
        setDobAge(null)
      }
      setSaveStatus('idle')
      setErrorMessage('')
    }
  }, [isOpen, customer, reset])

  // Watch DOB to compute age live
  const watchedDob = watch('date_of_birth')
  useEffect(() => {
    if (watchedDob && watchedDob.length === 10) {
      const age = calculateAge(watchedDob)
      setDobAge(age >= 0 && age < 150 ? age : null)
    } else {
      setDobAge(null)
    }
  }, [watchedDob])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen && !isSaving) handleClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, isSaving])

  const handleClose = () => {
    if (isSaving) return
    setSaveStatus('idle')
    setErrorMessage('')
    setDobAge(null)
    onClose()
  }

  const onSubmit = async (data: FormData) => {
    // Validate DOB not in the future
    if (data.date_of_birth) {
      const dob = new Date(data.date_of_birth)
      if (dob > new Date()) {
        setErrorMessage('Date of birth cannot be in the future.')
        setSaveStatus('error')
        return
      }
    }

    setIsSaving(true)
    setSaveStatus('idle')
    setErrorMessage('')

    const input: CustomerInput = {
      company_name: data.company_name,
      contact_name: data.contact_name,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      country: data.country || undefined,
      customer_type: data.customer_type,
      annual_value: Number(data.annual_value) || 0,
      is_active: data.is_active ?? true,
      notes: data.notes || undefined,
      date_of_birth: data.date_of_birth || null,
    }

    try {
      const result = isEditMode
        ? await updateCustomerAction(customer!.id, input)
        : await createCustomerAction(input)

      if (!result.success) {
        setSaveStatus('error')
        setErrorMessage(result.error)
        return
      }

      setSaveStatus('success')
      setTimeout(() => {
        handleClose()
        onSuccess(result.customer)
      }, 700)
    } catch (err: unknown) {
      setSaveStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setIsSaving(false)
    }
  }

  const watchedType = watch('customer_type')
  const showDob = watchedType === 'leisure' || watchedType === 'corporate'

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl mx-4 mt-16 mb-8 bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-omnia-gold/10 to-cyan-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-omnia-gold rounded-xl shadow-lg shadow-teal-200">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {isEditMode ? 'Edit Customer' : 'Create New Customer'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isEditMode
                      ? `Editing ${customer?.company_name}`
                      : 'Add a new customer profile to your database'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-6">

                  {/* Basic Details */}
                  <section>
                    <SectionHeader icon={Briefcase} title="Basic Details" />
                    <div className="space-y-4">
                      <FormField label="Company Name" required error={errors.company_name?.message} icon={Building2}>
                        <input
                          {...register('company_name', { required: 'Company name is required' })}
                          placeholder="e.g. Wanderlust Adventures"
                          className={inputClass}
                        />
                      </FormField>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Contact Person" required error={errors.contact_name?.message} icon={User}>
                          <input
                            {...register('contact_name', { required: 'Contact name is required' })}
                            placeholder="Full name"
                            className={inputClass}
                          />
                        </FormField>
                        <FormField label="Customer Type" icon={Star}>
                          <select {...register('customer_type')} className={selectClass}>
                            <option value="leisure">Leisure</option>
                            <option value="corporate">Corporate</option>
                            <option value="tour_operator">Tour Operator</option>
                            <option value="travel_agency">Travel Agency</option>
                          </select>
                        </FormField>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Email" required error={errors.email?.message} icon={Mail}>
                          <input
                            {...register('email', {
                              required: 'Email is required',
                              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
                            })}
                            type="email"
                            placeholder="email@example.com"
                            className={inputClass}
                          />
                        </FormField>
                        <FormField label="Phone" required error={errors.phone?.message} icon={Phone}>
                          <input
                            {...register('phone', { required: 'Phone is required' })}
                            placeholder="+1-555-0101"
                            className={inputClass}
                          />
                        </FormField>
                      </div>

                      <FormField label="Mobile" icon={Smartphone}>
                        <input
                          {...register('mobile')}
                          placeholder="+1-555-0102"
                          className={inputClass}
                        />
                      </FormField>

                      {/* Date of Birth — shown for leisure & corporate */}
                      {showDob && (
                        <div className="grid grid-cols-2 gap-4 items-start">
                          <FormField
                            label="Date of Birth"
                            icon={CalendarDays}
                            hint={
                              watchedType === 'corporate'
                                ? 'Optional for corporate contacts'
                                : 'Used to calculate customer age'
                            }
                            error={errors.date_of_birth?.message}
                          >
                            <input
                              {...register('date_of_birth', {
                                validate: (v) => {
                                  if (!v) return true
                                  if (new Date(v) > new Date()) return 'Date of birth cannot be in the future'
                                  return true
                                },
                              })}
                              type="date"
                              max={new Date().toISOString().split('T')[0]}
                              className={inputClass}
                            />
                          </FormField>

                          {dobAge !== null && (
                            <div className="pt-6">
                              <div className="flex items-center gap-2 px-3 py-2 bg-omnia-gold/10 rounded-lg border border-omnia-gold/20">
                                <Cake className="w-4 h-4 text-omnia-gold" />
                                <span className="text-sm font-semibold text-foreground">Age: {dobAge}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Location & Value */}
                  <section>
                    <SectionHeader icon={MapPin} title="Location & Value" />
                    <div className="space-y-4">
                      <FormField label="Address" icon={MapPin}>
                        <input {...register('address')} placeholder="Street address" className={inputClass} />
                      </FormField>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="City">
                          <input {...register('city')} placeholder="City" className={inputClass} />
                        </FormField>
                        <FormField label="Country">
                          <input {...register('country')} placeholder="Country" className={inputClass} />
                        </FormField>
                      </div>

                      <FormField label="Estimated Annual Value" icon={DollarSign}>
                        <input
                          {...register('annual_value')}
                          type="number"
                          min={0}
                          placeholder="0.00"
                          className={inputClass}
                        />
                      </FormField>
                    </div>
                  </section>

                  {/* Notes */}
                  <section>
                    <SectionHeader icon={StickyNote} title="Notes" />
                    <FormField label="Internal Notes" icon={StickyNote}>
                      <textarea
                        {...register('notes')}
                        placeholder="Any additional information about this customer..."
                        rows={3}
                        className={`${inputClass} resize-none`}
                      />
                    </FormField>
                  </section>

                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {saveStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1.5 text-green-600 text-sm font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isEditMode ? 'Customer updated!' : 'Customer created!'}
                    </motion.div>
                  )}
                  {saveStatus === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1.5 text-red-500 text-sm"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errorMessage}
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving} className="px-4">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-omnia-gold hover:bg-omnia-gold-dark text-primary-foreground px-6 min-w-[130px]"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </span>
                    ) : isEditMode ? 'Save Changes' : 'Create Customer'}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
