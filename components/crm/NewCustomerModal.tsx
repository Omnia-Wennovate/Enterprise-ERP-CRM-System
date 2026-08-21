'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { storage } from '@/lib/storage'
import { createClient } from '@/lib/supabase/client'
import type { Customer } from '@/types'

interface NewCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type CustomerFormData = Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'last_booking_date'>

const inputClass =
  'w-full px-3 py-2 text-sm bg-card border border-border rounded-lg outline-none transition-all duration-200 hover:border-border focus:border-omnia-gold/60 focus:ring-2 focus:ring-teal-400/20 placeholder:text-gray-300'

const selectClass =
  'w-full px-3 py-2 text-sm bg-card border border-border rounded-lg outline-none transition-all duration-200 hover:border-border focus:border-omnia-gold/60 focus:ring-2 focus:ring-teal-400/20 appearance-none cursor-pointer'

function FormField({
  label,
  required,
  error,
  children,
  icon: Icon,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
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
    <div className="flex items-center gap-2 pb-2 mb-4 border-b border-gray-100">
      <div className="p-1.5 rounded-md bg-omnia-gold/10">
        <Icon className="w-4 h-4 text-omnia-gold" />
      </div>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
    </div>
  )
}

export function NewCustomerModal({ isOpen, onClose, onSuccess }: NewCustomerModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    defaultValues: {
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      customer_type: 'leisure',
      annual_value: 0,
      is_active: true,
    },
  })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen && !isSaving) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, isSaving, onClose])

  const handleClose = () => {
    if (isSaving) return
    reset()
    setSaveStatus('idle')
    setErrorMessage('')
    onClose()
  }

  const onSubmit = async (data: CustomerFormData) => {
    setIsSaving(true)
    setSaveStatus('idle')
    setErrorMessage('')

    try {
      // 1. Save to Supabase first to get the correct UUID
      const supabase = createClient()
      const { data: insertedCustomer, error: supabaseError } = await supabase.from('customers').insert({
        company_name: data.company_name,
        company: data.company_name, // Support both formats depending on how schema is structured
        full_name: data.contact_name,
        contact_name: data.contact_name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
        customer_type: data.customer_type
      }).select('id').single()

      if (supabaseError) {
        console.warn('Failed to save to Supabase:', supabaseError)
      }

      const generatedId = insertedCustomer?.id || crypto.randomUUID()

      // 2. Save to localStorage to sync with the rest of the CRM UI
      const newCustomer: Customer = {
        id: generatedId,
        ...data,
        annual_value: Number(data.annual_value) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_booking_date: null,
      }
      
      const existing = storage.getCustomers()
      storage.setCustomers([newCustomer, ...existing])

      setSaveStatus('success')
      setTimeout(() => {
        handleClose()
        onSuccess()
      }, 800)
    } catch (err: any) {
      setSaveStatus('error')
      setErrorMessage(err.message || 'Failed to create customer.')
    } finally {
      setIsSaving(false)
    }
  }

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
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-omnia-gold/10 to-cyan-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-omnia-gold rounded-xl shadow-lg shadow-teal-200">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Create New Customer</h2>
                  <p className="text-xs text-muted-foreground">Add a new customer profile to your database</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="p-2 rounded-lg text-muted-foreground hover:text-muted-foreground hover:bg-card/60 transition-all disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-6">
                  
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
                            {...register('email', { required: 'Email is required' })}
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
                    </div>
                  </section>

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

                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-muted/80 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {saveStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1.5 text-green-600 text-sm font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Customer created successfully!
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSaving}
                    className="px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-omnia-gold hover:bg-omnia-gold-dark text-primary-foreground px-6 min-w-[120px]"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      'Create Customer'
                    )}
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
