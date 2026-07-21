'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  User,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  DollarSign,
  Calendar,
  Plane,
  Upload,
  Tag,
  MessageSquare,
  Briefcase,
  FileText,
  Users,
  Baby,
  Hotel,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createLead, getSalesAgents } from '@/lib/services/leads'
import { logLeadCreated } from '@/lib/services/lead-activities'
import { notifyLeadCreated } from '@/lib/services/lead-notifications'
import { uploadLeadDocument } from '@/lib/services/lead-documents'
import { createDirectConversation, sendMessage } from '@/lib/services/communication'
import {
  leadFormSchema,
  type LeadFormData,
  type SalesAgent,
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  PIPELINE_STAGES,
  PIPELINE_STAGE_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  TRAVEL_TYPES,
  TRAVEL_TYPE_LABELS,
  CURRENCIES,
  LEAD_TAGS,
  LEAD_STATUSES,
  INDUSTRIES,
} from '@/types/leads'

interface NewLeadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// ============================================================================
// REUSABLE FORM COMPONENTS
// ============================================================================

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
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
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
      <div className="p-1.5 rounded-md bg-teal-50">
        <Icon className="w-4 h-4 text-teal-600" />
      </div>
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
    </div>
  )
}

const inputClass =
  'w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none transition-all duration-200 hover:border-gray-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 placeholder:text-gray-300'

const selectClass =
  'w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none transition-all duration-200 hover:border-gray-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 appearance-none cursor-pointer'

const textareaClass =
  'w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none transition-all duration-200 hover:border-gray-300 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 resize-none placeholder:text-gray-300'

const inputErrorClass = 'border-red-300 focus:border-red-400 focus:ring-red-400/20'

// ============================================================================
// MAIN MODAL COMPONENT
// ============================================================================

export function NewLeadModal({ isOpen, onClose, onSuccess }: NewLeadModalProps) {
  const [agents, setAgents] = useState<SalesAgent[]>([])
  const [isLoadingAgents, setIsLoadingAgents] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      lead_name: '',
      company: '',
      contact_person: '',
      job_title: '',
      email: '',
      phone: '',
      mobile: '',
      website: '',
      lead_source: 'website',
      industry: '',
      country: '',
      city: '',
      address: '',
      notes: '',
      assigned_to: '',
      estimated_value: 0,
      currency: 'USD',
      travel_type: '',
      expected_close_date: '',
      priority: 'medium',
      pipeline_stage: 'new',
      probability: 50,
      status: 'active',
      destination: '',
      travel_date: '',
      return_date: '',
      adults: 1,
      children: 0,
      infants: 0,
      budget: undefined,
      preferred_airline: '',
      preferred_hotel: '',
      visa_required: false,
      special_requests: '',
      tags: [],
      create_discussion: false,
    },
  })

  const createDiscussion = watch('create_discussion')

  // Load sales agents on open
  useEffect(() => {
    if (isOpen) {
      setIsLoadingAgents(true)
      getSalesAgents()
        .then((data) => setAgents(data))
        .catch(() => setAgents([]))
        .finally(() => setIsLoadingAgents(false))

      // Auto-focus name field
      setTimeout(() => nameInputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen && !isSaving) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, isSaving, onClose])

  // Tag toggle
  const toggleTag = useCallback(
    (tag: string) => {
      setSelectedTags((prev) => {
        const next = prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        setValue('tags', next)
        return next
      })
    },
    [setValue]
  )

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadFiles((prev) => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Close and reset
  const handleClose = () => {
    if (isSaving) return
    reset()
    setUploadFiles([])
    setSelectedTags([])
    setSaveStatus('idle')
    setErrorMessage('')
    onClose()
  }

  // ============================================================================
  // SUBMIT HANDLER
  // ============================================================================

  const onSubmit = async (data: LeadFormData) => {
    setIsSaving(true)
    setSaveStatus('idle')
    setErrorMessage('')

    try {
      // 1. Create lead in Supabase
      const lead = await createLead({ ...data, tags: selectedTags })

      // 2. Upload attachments
      for (const file of uploadFiles) {
        try {
          await uploadLeadDocument({ leadId: lead.id, file })
        } catch {
          // Continue even if individual upload fails
          console.warn(`Failed to upload ${file.name}`)
        }
      }

      // 3. Create activity log
      await logLeadCreated(lead.id, lead.lead_name).catch(() => {})

      // 4. Create notification
      const assignedAgent = agents.find((a) => a.id === data.assigned_to)
      await notifyLeadCreated(
        lead.lead_name,
        lead.id,
        data.assigned_to,
        assignedAgent?.full_name
      ).catch(() => {})

      // 5. Create Communication Center discussion (if enabled)
      if (data.create_discussion && data.assigned_to) {
        try {
          const conversation = await createDirectConversation(
            [data.assigned_to],
            data.assigned_to
          )
          await sendMessage(
            conversation.id,
            data.assigned_to,
            `📋 New Lead Discussion: ${lead.lead_name}\n\nCompany: ${data.company || 'N/A'}\nValue: ${data.currency} ${data.estimated_value.toLocaleString()}\nPriority: ${data.priority}\nStage: ${data.pipeline_stage}`
          )
        } catch {
          console.warn('Failed to create discussion thread')
        }
      }

      setSaveStatus('success')

      // Auto-close after success
      setTimeout(() => {
        handleClose()
        onSuccess()
      }, 800)
    } catch (err: unknown) {
      setSaveStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create lead. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl mx-4 mt-8 mb-8 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-4rem)]"
          >
            {/* ============================================================ */}
            {/* HEADER */}
            {/* ============================================================ */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-cyan-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-600 rounded-xl shadow-lg shadow-teal-200">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Create New Lead</h2>
                  <p className="text-xs text-gray-500">Fill in the details to add a new lead to your pipeline</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-all disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ============================================================ */}
            {/* FORM BODY (Scrollable) */}
            {/* ============================================================ */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* ====================================================== */}
                  {/* LEFT COLUMN */}
                  {/* ====================================================== */}
                  <div className="space-y-6">
                    {/* --- LEAD INFORMATION --- */}
                    <section>
                      <SectionHeader icon={User} title="Lead Information" />
                      <div className="space-y-3">
                        <FormField label="Lead Name" required error={errors.lead_name?.message} icon={User}>
                          <input
                            {...register('lead_name')}
                            ref={(e) => {
                              register('lead_name').ref(e)
                              ;(nameInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e
                            }}
                            placeholder="e.g. Paradise Travel Group Inquiry"
                            className={`${inputClass} ${errors.lead_name ? inputErrorClass : ''}`}
                          />
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                          <FormField label="Company" icon={Building2}>
                            <input {...register('company')} placeholder="Company name" className={inputClass} />
                          </FormField>
                          <FormField label="Contact Person" icon={User}>
                            <input {...register('contact_person')} placeholder="Full name" className={inputClass} />
                          </FormField>
                        </div>

                        <FormField label="Job Title" icon={Briefcase}>
                          <input {...register('job_title')} placeholder="e.g. CEO, Travel Manager" className={inputClass} />
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                          <FormField label="Email" required error={errors.email?.message} icon={Mail}>
                            <input
                              {...register('email')}
                              type="email"
                              placeholder="email@example.com"
                              className={`${inputClass} ${errors.email ? inputErrorClass : ''}`}
                            />
                          </FormField>
                          <FormField label="Phone" icon={Phone}>
                            <input {...register('phone')} placeholder="+1-555-0101" className={inputClass} />
                          </FormField>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <FormField label="Mobile" icon={Phone}>
                            <input {...register('mobile')} placeholder="+1-555-0102" className={inputClass} />
                          </FormField>
                          <FormField label="Website" icon={Globe}>
                            <input {...register('website')} placeholder="https://..." className={inputClass} />
                          </FormField>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <FormField label="Lead Source" icon={Globe}>
                            <select {...register('lead_source')} className={selectClass}>
                              {LEAD_SOURCES.map((source) => (
                                <option key={source} value={source}>
                                  {LEAD_SOURCE_LABELS[source]}
                                </option>
                              ))}
                            </select>
                          </FormField>
                          <FormField label="Industry">
                            <select {...register('industry')} className={selectClass}>
                              <option value="">Select industry</option>
                              {INDUSTRIES.map((ind) => (
                                <option key={ind} value={ind}>
                                  {ind}
                                </option>
                              ))}
                            </select>
                          </FormField>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <FormField label="Country" icon={MapPin}>
                            <input {...register('country')} placeholder="Country" className={inputClass} />
                          </FormField>
                          <FormField label="City" icon={MapPin}>
                            <input {...register('city')} placeholder="City" className={inputClass} />
                          </FormField>
                        </div>

                        <FormField label="Address" icon={MapPin}>
                          <input {...register('address')} placeholder="Street address" className={inputClass} />
                        </FormField>

                        <FormField label="Notes">
                          <textarea
                            {...register('notes')}
                            rows={3}
                            placeholder="Additional notes about this lead..."
                            className={textareaClass}
                          />
                        </FormField>
                      </div>
                    </section>

                    {/* --- CUSTOMER REQUIREMENTS --- */}
                    <section>
                      <SectionHeader icon={Plane} title="Customer Requirements" />
                      <div className="space-y-3">
                        <FormField label="Destination" icon={MapPin}>
                          <input {...register('destination')} placeholder="e.g. Maldives, Swiss Alps" className={inputClass} />
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                          <FormField label="Travel Date" icon={Calendar}>
                            <input {...register('travel_date')} type="date" className={inputClass} />
                          </FormField>
                          <FormField label="Return Date" icon={Calendar}>
                            <input {...register('return_date')} type="date" className={inputClass} />
                          </FormField>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <FormField label="Adults" icon={Users}>
                            <input {...register('adults')} type="number" min={0} className={inputClass} />
                          </FormField>
                          <FormField label="Children" icon={Users}>
                            <input {...register('children')} type="number" min={0} className={inputClass} />
                          </FormField>
                          <FormField label="Infants" icon={Baby}>
                            <input {...register('infants')} type="number" min={0} className={inputClass} />
                          </FormField>
                        </div>

                        <FormField label="Budget" icon={DollarSign}>
                          <input {...register('budget')} type="number" min={0} placeholder="0.00" className={inputClass} />
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                          <FormField label="Preferred Airline" icon={Plane}>
                            <input {...register('preferred_airline')} placeholder="e.g. Emirates" className={inputClass} />
                          </FormField>
                          <FormField label="Preferred Hotel" icon={Hotel}>
                            <input {...register('preferred_hotel')} placeholder="e.g. Hilton" className={inputClass} />
                          </FormField>
                        </div>

                        <div className="flex items-center gap-3 py-2">
                          <input
                            {...register('visa_required')}
                            type="checkbox"
                            id="visa_required"
                            className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                          <label htmlFor="visa_required" className="text-sm text-gray-700 cursor-pointer flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-gray-400" />
                            Visa Required
                          </label>
                        </div>

                        <FormField label="Special Requests">
                          <textarea
                            {...register('special_requests')}
                            rows={3}
                            placeholder="Dietary requirements, accessibility needs, special occasions..."
                            className={textareaClass}
                          />
                        </FormField>
                      </div>
                    </section>
                  </div>

                  {/* ====================================================== */}
                  {/* RIGHT COLUMN */}
                  {/* ====================================================== */}
                  <div className="space-y-6">
                    {/* --- SALES INFORMATION --- */}
                    <section>
                      <SectionHeader icon={DollarSign} title="Sales Information" />
                      <div className="space-y-3">
                        <FormField label="Assigned Sales Agent" required error={errors.assigned_to?.message} icon={User}>
                          <select
                            {...register('assigned_to')}
                            className={`${selectClass} ${errors.assigned_to ? inputErrorClass : ''}`}
                            disabled={isLoadingAgents}
                          >
                            <option value="">
                              {isLoadingAgents ? 'Loading agents...' : 'Select agent'}
                            </option>
                            {agents.map((agent) => (
                              <option key={agent.id} value={agent.id}>
                                {agent.full_name} ({agent.role})
                              </option>
                            ))}
                          </select>
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                          <FormField label="Estimated Deal Value" required error={errors.estimated_value?.message} icon={DollarSign}>
                            <input
                              {...register('estimated_value')}
                              type="number"
                              min={0}
                              step="0.01"
                              placeholder="0.00"
                              className={`${inputClass} ${errors.estimated_value ? inputErrorClass : ''}`}
                            />
                          </FormField>
                          <FormField label="Currency">
                            <select {...register('currency')} className={selectClass}>
                              {CURRENCIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </FormField>
                        </div>

                        <FormField label="Travel Type" icon={Plane}>
                          <select {...register('travel_type')} className={selectClass}>
                            <option value="">Select type</option>
                            {TRAVEL_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {TRAVEL_TYPE_LABELS[type]}
                              </option>
                            ))}
                          </select>
                        </FormField>

                        <FormField label="Expected Close Date" required error={errors.expected_close_date?.message} icon={Calendar}>
                          <input
                            {...register('expected_close_date')}
                            type="date"
                            className={`${inputClass} ${errors.expected_close_date ? inputErrorClass : ''}`}
                          />
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                          <FormField label="Priority">
                            <select {...register('priority')} className={selectClass}>
                              {PRIORITIES.map((p) => (
                                <option key={p} value={p}>
                                  {PRIORITY_LABELS[p]}
                                </option>
                              ))}
                            </select>
                          </FormField>
                          <FormField label="Pipeline Stage" required error={errors.pipeline_stage?.message}>
                            <select
                              {...register('pipeline_stage')}
                              className={`${selectClass} ${errors.pipeline_stage ? inputErrorClass : ''}`}
                            >
                              {PIPELINE_STAGES.map((s) => (
                                <option key={s} value={s}>
                                  {PIPELINE_STAGE_LABELS[s]}
                                </option>
                              ))}
                            </select>
                          </FormField>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <FormField label="Probability %">
                            <input
                              {...register('probability')}
                              type="number"
                              min={0}
                              max={100}
                              className={inputClass}
                            />
                          </FormField>
                          <FormField label="Status">
                            <select {...register('status')} className={selectClass}>
                              {LEAD_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </option>
                              ))}
                            </select>
                          </FormField>
                        </div>
                      </div>
                    </section>

                    {/* --- ATTACHMENTS --- */}
                    <section>
                      <SectionHeader icon={FileText} title="Attachments" />
                      <div className="space-y-3">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-teal-300 hover:bg-teal-50/30 transition-all group"
                        >
                          <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2 group-hover:text-teal-400 transition-colors" />
                          <p className="text-sm text-gray-500 group-hover:text-teal-600">
                            Click to upload files
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            PDF, Images, Documents (max 10MB each)
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </div>

                        {uploadFiles.length > 0 && (
                          <div className="space-y-2">
                            {uploadFiles.map((file, index) => (
                              <motion.div
                                key={`${file.name}-${index}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                              >
                                <FileText className="w-4 h-4 text-teal-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                                <span className="text-xs text-gray-400 flex-shrink-0">
                                  {(file.size / 1024).toFixed(0)} KB
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </section>

                    {/* --- TAGS --- */}
                    <section>
                      <SectionHeader icon={Tag} title="Tags" />
                      <div className="flex flex-wrap gap-2">
                        {LEAD_TAGS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${
                              selectedTags.includes(tag)
                                ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-200'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-700'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* --- COMMUNICATION CENTER --- */}
                    <section>
                      <SectionHeader icon={MessageSquare} title="Communication Center" />
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <input
                          {...register('create_discussion')}
                          type="checkbox"
                          id="create_discussion"
                          className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <label htmlFor="create_discussion" className="cursor-pointer flex-1">
                          <p className="text-sm font-medium text-gray-700">Create Lead Discussion</p>
                          <p className="text-xs text-gray-500">
                            Automatically create a conversation thread for this lead
                          </p>
                        </label>
                      </div>
                      {createDiscussion && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-xs text-teal-600 mt-2 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Discussion will be created with the assigned sales agent
                        </motion.p>
                      )}
                    </section>
                  </div>
                </div>
              </div>

              {/* ============================================================ */}
              {/* STICKY FOOTER */}
              {/* ============================================================ */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {saveStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1.5 text-green-600 text-sm font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Lead created successfully!
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
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 min-w-[120px]"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      'Save Lead'
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
