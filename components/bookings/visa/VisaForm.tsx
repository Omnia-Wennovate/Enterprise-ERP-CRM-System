'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X, AlertTriangle, Users, Loader2, CheckCircle2, Info } from 'lucide-react'
import type { VisaApplication, VisaType, VisaPriority } from '@/types/visa'
import { VISA_TYPE_CONFIG, VISA_PRIORITY_CONFIG } from '@/types/visa'

interface VisaFormProps {
  visa?: VisaApplication | null
  onSave: (data: Partial<VisaApplication>) => Promise<void>
  onClose: () => void
  onBulkCreate?: (bookingId: string, shared: any) => Promise<void>
}

export function VisaForm({ visa, onSave, onClose, onBulkCreate }: VisaFormProps) {
  const [saving, setSaving] = useState(false)
  const [bookings, setBookings] = useState<any[]>([])
  const [travelers, setTravelers] = useState<any[]>([])
  const [selectedBookingId, setSelectedBookingId] = useState(visa?.booking_id || '')
  const [passportWarning, setPassportWarning] = useState<string | null>(null)
  const [countryRuleMissing, setCountryRuleMissing] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      booking_id: visa?.booking_id || '',
      traveler_id: visa?.traveler_id || '',
      destination_country: visa?.destination_country || '',
      visa_type: visa?.visa_type || 'tourist',
      status: visa?.status || 'not_started',
      priority: visa?.priority || 'normal',
      purpose_of_travel: visa?.purpose_of_travel || '',
      submission_date: visa?.submission_date || '',
      appointment_date: visa?.appointment_date || '',
      biometric_date: visa?.biometric_date || '',
      expected_decision_date: visa?.expected_decision_date || '',
      notes: visa?.notes || '',
    }
  })

  const watchedDestination = watch('destination_country')
  const watchedTravelerId = watch('traveler_id')

  // Load bookings on mount
  useEffect(() => {
    async function load() {
      try {
        const { getBookings } = await import('@/lib/supabase/bookings')
        const data = await getBookings(200)
        setBookings(data)
      } catch { /* ignore */ }
    }
    load()
  }, [])

  // Load travelers when booking is selected
  useEffect(() => {
    if (!selectedBookingId) { setTravelers([]); return }
    async function load() {
      try {
        const { getTravelers } = await import('@/lib/supabase/bookings')
        const data = await getTravelers(selectedBookingId)
        setTravelers(data)
      } catch { /* ignore */ }
    }
    load()
  }, [selectedBookingId])

  // Check passport validity against country rules (Section 19)
  useEffect(() => {
    if (!watchedTravelerId || !watchedDestination) { setPassportWarning(null); return }
    async function check() {
      try {
        const { checkPassportValidity } = await import('@/lib/services/passports')
        const result = await checkPassportValidity(watchedTravelerId, watchedDestination)
        if (!result.valid && result.reason) {
          setPassportWarning(result.reason)
        } else {
          setPassportWarning(null)
        }
      } catch { setPassportWarning(null) }
    }
    check()
  }, [watchedTravelerId, watchedDestination])

  // Check if country rule exists (Section 19)
  useEffect(() => {
    if (!watchedDestination) { setCountryRuleMissing(false); return }
    const traveler = travelers.find(t => t.id === watchedTravelerId)
    if (!traveler?.nationality) { setCountryRuleMissing(false); return }
    async function check() {
      try {
        const { getCountryRule } = await import('@/lib/services/visa')
        const rule = await getCountryRule(traveler!.nationality, watchedDestination)
        setCountryRuleMissing(!rule)
      } catch { setCountryRuleMissing(false) }
    }
    check()
  }, [watchedTravelerId, watchedDestination, travelers])

  const onSubmit = async (data: any) => {
    setSaving(true)
    try {
      await onSave({ ...data, booking_id: selectedBookingId || null })
    } catch (err: any) {
      alert(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleBulk = async () => {
    if (!onBulkCreate || !selectedBookingId) return
    setSaving(true)
    try {
      const dest = watch('destination_country')
      const type = watch('visa_type')
      const purpose = watch('purpose_of_travel')
      const priority = watch('priority')
      await onBulkCreate(selectedBookingId, {
        destination_country: dest,
        visa_type: type,
        purpose_of_travel: purpose,
        priority,
      })
    } catch (err: any) {
      alert(err.message || 'Failed to bulk create')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-t-2xl">
          <h2 className="text-lg font-bold text-white">{visa ? 'Edit Visa Application' : 'New Visa Application'}</h2>
          <button onClick={onClose} className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Passport Warning (Section 19) */}
        {passportWarning && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">Passport Validity Warning</p>
              <p className="text-sm text-red-700 mt-1">{passportWarning}</p>
              <p className="text-xs text-red-600 mt-2 font-medium">This is the #1 real-world visa rejection reason. The applicant should renew their passport before applying.</p>
            </div>
          </div>
        )}

        {/* Country Rule Missing (Section 19) */}
        {countryRuleMissing && (
          <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">No Country Rule Found</p>
              <p className="text-xs text-amber-700 mt-1">No visa requirements rule exists for this nationality/destination pair. Please add one in Country Rules before proceeding, so the required documents checklist can be auto-populated.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Booking Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Linked Booking</label>
            <select
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm"
              value={selectedBookingId}
              onChange={(e) => { setSelectedBookingId(e.target.value); setValue('booking_id', e.target.value) }}
            >
              <option value="">— No Booking —</option>
              {bookings.map(b => (
                <option key={b.id} value={b.id}>{b.booking_reference} — {b.customer_name} ({b.destination})</option>
              ))}
            </select>
          </div>

          {/* Traveler Selection */}
          {selectedBookingId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Traveler</label>
                {travelers.length > 1 && onBulkCreate && (
                  <button
                    type="button"
                    onClick={() => setBulkMode(!bulkMode)}
                    className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-800"
                  >
                    <Users className="w-3.5 h-3.5" />
                    {bulkMode ? 'Single Mode' : `Bulk Create (${travelers.length} travelers)`}
                  </button>
                )}
              </div>
              {!bulkMode ? (
                <select
                  className="w-full border-slate-300 rounded-lg shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm"
                  {...register('traveler_id', { required: 'Select a traveler' })}
                >
                  <option value="">— Select Traveler —</option>
                  {travelers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.first_name} {t.last_name} — {t.nationality || 'No nationality'} — {t.passport_number || 'No passport'}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-teal-800">
                  <p className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Bulk mode: Will create visa applications for all {travelers.length} travelers
                  </p>
                  <p className="text-xs text-teal-600 mt-1">Shared fields below will apply to all. Passport data will be pulled from each traveler individually.</p>
                </div>
              )}
              {errors.traveler_id && !bulkMode && <p className="text-xs text-red-500 mt-1">{errors.traveler_id.message}</p>}
            </div>
          )}

          {/* Destination & Visa Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Destination Country *</label>
              <input
                type="text"
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm"
                placeholder="e.g. United States"
                {...register('destination_country', { required: 'Required' })}
              />
              {errors.destination_country && <p className="text-xs text-red-500 mt-1">{errors.destination_country.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Visa Type *</label>
              <select className="w-full border-slate-300 rounded-lg shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm" {...register('visa_type', { required: 'Required' })}>
                {Object.entries(VISA_TYPE_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Purpose */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Priority</label>
              <select className="w-full border-slate-300 rounded-lg shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm" {...register('priority')}>
                {Object.entries(VISA_PRIORITY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Purpose of Travel</label>
              <input
                type="text"
                className="w-full border-slate-300 rounded-lg shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm"
                placeholder="e.g. Tourism, Business Meeting"
                {...register('purpose_of_travel')}
              />
            </div>
          </div>

          {/* Status (edit only) */}
          {visa && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Status</label>
              <select className="w-full border-slate-300 rounded-lg shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm" {...register('status')}>
                <option value="not_started">Not Started</option>
                <option value="documents_collecting">Collecting Documents</option>
                <option value="documents_submitted">Documents Submitted</option>
                <option value="submitted">Submitted to Embassy</option>
                <option value="appointment_scheduled">Appointment Scheduled</option>
                <option value="biometric_pending">Biometric Pending</option>
                <option value="biometric_completed">Biometric Completed</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="interview_completed">Interview Completed</option>
                <option value="under_review">Under Review</option>
                <option value="additional_documents_requested">Additional Docs Requested</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="passport_returned">Passport Returned</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Submission Date</label>
              <input type="date" className="w-full border-slate-300 rounded-lg shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm" {...register('submission_date')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Appointment Date</label>
              <input type="date" className="w-full border-slate-300 rounded-lg shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm" {...register('appointment_date')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Biometric Date</label>
              <input type="date" className="w-full border-slate-300 rounded-lg shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm" {...register('biometric_date')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Expected Decision</label>
              <input type="date" className="w-full border-slate-300 rounded-lg shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm" {...register('expected_decision_date')} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Notes</label>
            <textarea
              className="w-full border-slate-300 rounded-lg shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm"
              rows={3}
              placeholder="Any additional notes..."
              {...register('notes')}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            {bulkMode ? (
              <button
                type="button"
                onClick={handleBulk}
                disabled={saving}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Create for All {travelers.length} Travelers
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {visa ? 'Update Application' : 'Create Application'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
