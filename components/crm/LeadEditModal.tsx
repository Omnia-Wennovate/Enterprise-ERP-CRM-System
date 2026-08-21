'use client'

import { useState, useEffect } from 'react'
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
  Briefcase,
  Users,
  Baby,
  Hotel,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateLead, getSalesAgents } from '@/lib/services/leads'
import { logLeadEdited } from '@/lib/services/lead-activities'
import {
  leadFormSchema,
  type LeadFormData,
  type LeadWithAgent,
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
  INDUSTRIES,
} from '@/types/leads'

interface Props {
  isOpen: boolean
  lead: LeadWithAgent
  onClose: () => void
  onSaved: (updatedLead: LeadWithAgent) => void
}

const inputClass =
  'w-full px-3 py-2 text-sm bg-card border border-border rounded-lg outline-none transition-all hover:border-border focus:border-omnia-gold/60 focus:ring-2 focus:ring-teal-400/20 placeholder:text-gray-300'
const selectClass =
  'w-full px-3 py-2 text-sm bg-card border border-border rounded-lg outline-none transition-all hover:border-border focus:border-omnia-gold/60 focus:ring-2 focus:ring-teal-400/20 appearance-none cursor-pointer'
const textareaClass =
  'w-full px-3 py-2 text-sm bg-card border border-border rounded-lg outline-none transition-all hover:border-border focus:border-omnia-gold/60 focus:ring-2 focus:ring-teal-400/20 resize-none'

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

function FieldLabel({ label, required, icon: Icon }: { label: string; required?: boolean; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
  )
}

export function LeadEditModal({ isOpen, lead, onClose, onSaved }: Props) {
  const [agents, setAgents] = useState<SalesAgent[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [selectedTags, setSelectedTags] = useState<string[]>(lead.tags || [])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      lead_name: lead.lead_name,
      company: lead.company || '',
      contact_person: lead.contact_person || '',
      job_title: lead.job_title || '',
      email: lead.email,
      phone: lead.phone || '',
      mobile: lead.mobile || '',
      website: lead.website || '',
      lead_source: lead.lead_source,
      industry: lead.industry || '',
      country: lead.country || '',
      city: lead.city || '',
      address: lead.address || '',
      notes: lead.notes || '',
      assigned_to: lead.assigned_to || '',
      estimated_value: lead.estimated_value,
      currency: lead.currency || 'USD',
      travel_type: lead.travel_type || '',
      expected_close_date: lead.expected_close_date?.slice(0, 10) || '',
      priority: lead.priority,
      pipeline_stage: lead.pipeline_stage,
      probability: lead.probability,
      status: lead.status,
      destination: lead.destination || '',
      travel_date: lead.travel_date?.slice(0, 10) || '',
      return_date: lead.return_date?.slice(0, 10) || '',
      adults: lead.adults || 1,
      children: lead.children || 0,
      infants: lead.infants || 0,
      budget: lead.budget || undefined,
      preferred_airline: lead.preferred_airline || '',
      preferred_hotel: lead.preferred_hotel || '',
      visa_required: lead.visa_required || false,
      special_requests: lead.special_requests || '',
      tags: lead.tags || [],
      create_discussion: false,
    },
  })

  useEffect(() => {
    if (isOpen) {
      getSalesAgents().then(setAgents).catch(console.error)
      setSelectedTags(lead.tags || [])
      setSaveStatus('idle')
      reset({
        lead_name: lead.lead_name,
        company: lead.company || '',
        contact_person: lead.contact_person || '',
        job_title: lead.job_title || '',
        email: lead.email,
        phone: lead.phone || '',
        mobile: lead.mobile || '',
        website: lead.website || '',
        lead_source: lead.lead_source,
        industry: lead.industry || '',
        country: lead.country || '',
        city: lead.city || '',
        address: lead.address || '',
        notes: lead.notes || '',
        assigned_to: lead.assigned_to || '',
        estimated_value: lead.estimated_value,
        currency: lead.currency || 'USD',
        travel_type: lead.travel_type || '',
        expected_close_date: lead.expected_close_date?.slice(0, 10) || '',
        priority: lead.priority,
        pipeline_stage: lead.pipeline_stage,
        probability: lead.probability,
        status: lead.status,
        destination: lead.destination || '',
        travel_date: lead.travel_date?.slice(0, 10) || '',
        return_date: lead.return_date?.slice(0, 10) || '',
        adults: lead.adults || 1,
        children: lead.children || 0,
        infants: lead.infants || 0,
        budget: lead.budget || undefined,
        preferred_airline: lead.preferred_airline || '',
        preferred_hotel: lead.preferred_hotel || '',
        visa_required: lead.visa_required || false,
        special_requests: lead.special_requests || '',
        tags: lead.tags || [],
        create_discussion: false,
      })
    }
  }, [isOpen, lead, reset])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const onSubmit = async (data: LeadFormData) => {
    setIsSaving(true)
    setSaveStatus('idle')
    try {
      const updated = await updateLead(lead.id, { ...data, tags: selectedTags })
      const changedFields = Object.keys(data).filter((k) => {
        const key = k as keyof LeadFormData
        return String(data[key]) !== String((lead as Record<string, unknown>)[key])
      })
      await logLeadEdited(lead.id, lead.lead_name, changedFields).catch(() => {})
      setSaveStatus('success')
      const agent = agents.find((a) => a.id === updated.assigned_to)
      onSaved({
        ...lead,
        ...updated,
        tags: selectedTags,
        assigned_agent: agent ? { id: agent.id, full_name: agent.full_name, avatar_url: agent.avatar_url } : lead.assigned_agent,
      })
      setTimeout(onClose, 800)
    } catch (err) {
      console.error('Failed to save lead:', err)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] w-[700px] max-h-[90vh] bg-card rounded-2xl shadow-2xl border border-border flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="font-bold text-foreground text-lg">Edit Lead</h2>
                <p className="text-xs text-muted-foreground">{lead.lead_name}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-8">
                {/* Lead Information */}
                <section>
                  <SectionHeader icon={User} title="Lead Information" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <FieldLabel label="Lead Name" required icon={User} />
                      <input {...register('lead_name')} className={inputClass} placeholder="Full name or company" />
                      {errors.lead_name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.lead_name.message}</p>}
                    </div>
                    <div>
                      <FieldLabel label="Company" icon={Building2} />
                      <input {...register('company')} className={inputClass} placeholder="Company name" />
                    </div>
                    <div>
                      <FieldLabel label="Contact Person" icon={User} />
                      <input {...register('contact_person')} className={inputClass} placeholder="Contact person" />
                    </div>
                    <div>
                      <FieldLabel label="Job Title" icon={Briefcase} />
                      <input {...register('job_title')} className={inputClass} placeholder="Job title" />
                    </div>
                    <div>
                      <FieldLabel label="Industry" />
                      <select {...register('industry')} className={selectClass}>
                        <option value="">Select industry</option>
                        {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div>
                      <FieldLabel label="Email" required icon={Mail} />
                      <input {...register('email')} type="email" className={inputClass} placeholder="email@example.com" />
                      {errors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email.message}</p>}
                    </div>
                    <div>
                      <FieldLabel label="Phone" icon={Phone} />
                      <input {...register('phone')} className={inputClass} placeholder="+1 234 567 8900" />
                    </div>
                    <div>
                      <FieldLabel label="Mobile" icon={Phone} />
                      <input {...register('mobile')} className={inputClass} placeholder="Mobile number" />
                    </div>
                    <div>
                      <FieldLabel label="Website" icon={Globe} />
                      <input {...register('website')} className={inputClass} placeholder="https://..." />
                    </div>
                    <div>
                      <FieldLabel label="Country" icon={MapPin} />
                      <input {...register('country')} className={inputClass} placeholder="Country" />
                    </div>
                    <div>
                      <FieldLabel label="City" icon={MapPin} />
                      <input {...register('city')} className={inputClass} placeholder="City" />
                    </div>
                    <div className="col-span-2">
                      <FieldLabel label="Address" icon={MapPin} />
                      <input {...register('address')} className={inputClass} placeholder="Full address" />
                    </div>
                    <div>
                      <FieldLabel label="Lead Source" />
                      <select {...register('lead_source')} className={selectClass}>
                        {LEAD_SOURCES.map((s) => <option key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</option>)}
                      </select>
                    </div>
                  </div>
                </section>

                {/* Sales Information */}
                <section>
                  <SectionHeader icon={DollarSign} title="Sales Information" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel label="Assigned Agent" icon={User} />
                      <select {...register('assigned_to')} className={selectClass}>
                        <option value="">Unassigned</option>
                        {agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <FieldLabel label="Pipeline Stage" />
                      <select {...register('pipeline_stage')} className={selectClass}>
                        {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{PIPELINE_STAGE_LABELS[s]}</option>)}
                      </select>
                    </div>
                    <div>
                      <FieldLabel label="Priority" />
                      <select {...register('priority')} className={selectClass}>
                        {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                      </select>
                    </div>
                    <div>
                      <FieldLabel label="Probability (%)" />
                      <input {...register('probability')} type="number" min={0} max={100} className={inputClass} />
                    </div>
                    <div>
                      <FieldLabel label="Currency" icon={DollarSign} />
                      <select {...register('currency')} className={selectClass}>
                        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <FieldLabel label="Estimated Value" icon={DollarSign} required />
                      <input {...register('estimated_value')} type="number" min={0} className={inputClass} placeholder="0" />
                    </div>
                    <div>
                      <FieldLabel label="Expected Close Date" required icon={Calendar} />
                      <input {...register('expected_close_date')} type="date" className={inputClass} />
                    </div>
                    <div>
                      <FieldLabel label="Travel Type" icon={Plane} />
                      <select {...register('travel_type')} className={selectClass}>
                        <option value="">Select type</option>
                        {TRAVEL_TYPES.map((t) => <option key={t} value={t}>{TRAVEL_TYPE_LABELS[t]}</option>)}
                      </select>
                    </div>
                  </div>
                </section>

                {/* Customer Requirements */}
                <section>
                  <SectionHeader icon={Plane} title="Travel Requirements" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <FieldLabel label="Destination" icon={MapPin} />
                      <input {...register('destination')} className={inputClass} placeholder="e.g. Dubai, UAE" />
                    </div>
                    <div>
                      <FieldLabel label="Travel Date" icon={Calendar} />
                      <input {...register('travel_date')} type="date" className={inputClass} />
                    </div>
                    <div>
                      <FieldLabel label="Return Date" icon={Calendar} />
                      <input {...register('return_date')} type="date" className={inputClass} />
                    </div>
                    <div>
                      <FieldLabel label="Adults" icon={Users} />
                      <input {...register('adults')} type="number" min={0} className={inputClass} />
                    </div>
                    <div>
                      <FieldLabel label="Children" icon={Users} />
                      <input {...register('children')} type="number" min={0} className={inputClass} />
                    </div>
                    <div>
                      <FieldLabel label="Infants" icon={Baby} />
                      <input {...register('infants')} type="number" min={0} className={inputClass} />
                    </div>
                    <div>
                      <FieldLabel label="Budget" icon={DollarSign} />
                      <input {...register('budget')} type="number" min={0} className={inputClass} placeholder="Budget amount" />
                    </div>
                    <div>
                      <FieldLabel label="Preferred Airline" icon={Plane} />
                      <input {...register('preferred_airline')} className={inputClass} placeholder="Airline preference" />
                    </div>
                    <div>
                      <FieldLabel label="Preferred Hotel" icon={Hotel} />
                      <input {...register('preferred_hotel')} className={inputClass} placeholder="Hotel preference" />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <input {...register('visa_required')} type="checkbox" id="edit_visa" className="w-4 h-4 accent-teal-600" />
                      <label htmlFor="edit_visa" className="text-sm text-foreground flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-muted-foreground" /> Visa required
                      </label>
                    </div>
                    <div className="col-span-2">
                      <FieldLabel label="Special Requests" />
                      <textarea {...register('special_requests')} rows={2} className={textareaClass} placeholder="Any special requirements..." />
                    </div>
                    <div className="col-span-2">
                      <FieldLabel label="Notes" />
                      <textarea {...register('notes')} rows={3} className={textareaClass} placeholder="Internal notes..." />
                    </div>
                  </div>
                </section>

                {/* Tags */}
                <section>
                  <SectionHeader icon={Briefcase} title="Tags" />
                  <div className="flex flex-wrap gap-2">
                    {LEAD_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          selectedTags.includes(tag)
                            ? 'bg-omnia-gold/15 text-omnia-gold-dark border-omnia-gold/40'
                            : 'bg-card text-muted-foreground border-border hover:border-omnia-gold/40'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                {saveStatus === 'success' && (
                  <span className="flex items-center gap-1.5 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4" /> Saved successfully
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="flex items-center gap-1.5 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" /> Failed to save
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                <Button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSaving}
                  className="bg-omnia-gold hover:bg-omnia-gold-dark text-primary-foreground px-6"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
