'use client'

import { useState } from 'react'
import { Calendar, MapPin, Clock, Plus, CheckCircle, XCircle, X, Loader2 } from 'lucide-react'
import type { VisaAppointment, AppointmentType } from '@/types/visa'
import { APPOINTMENT_TYPE_LABELS } from '@/types/visa'

interface VisaAppointmentsProps {
  appointments: VisaAppointment[]
  visaApplicationId: string
  onCreate: (appointment: Partial<VisaAppointment>) => Promise<void>
  onUpdate: (id: string, updates: Partial<VisaAppointment>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function VisaAppointments({ appointments, visaApplicationId, onCreate, onUpdate, onDelete }: VisaAppointmentsProps) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    appointment_type: 'embassy_appointment' as string,
    scheduled_datetime: '',
    location: '',
    address: '',
    notes: '',
  })

  const handleCreate = async () => {
    if (!formData.scheduled_datetime) return
    setSaving(true)
    try {
      await onCreate({
        visa_application_id: visaApplicationId,
        appointment_type: formData.appointment_type as AppointmentType,
        scheduled_datetime: new Date(formData.scheduled_datetime).toISOString(),
        location: formData.location || null,
        address: formData.address || null,
        notes: formData.notes || null,
      })
      setShowForm(false)
      setFormData({ appointment_type: 'embassy_appointment', scheduled_datetime: '', location: '', address: '', notes: '' })
    } finally {
      setSaving(false)
    }
  }

  const handleMarkComplete = async (id: string) => {
    await onUpdate(id, { status: 'completed' })
  }

  const handleCancel = async (id: string) => {
    await onUpdate(id, { status: 'cancelled' })
  }

  const exportIcal = (apt: VisaAppointment) => {
    const start = new Date(apt.scheduled_datetime)
    const end = apt.end_datetime ? new Date(apt.end_datetime) : new Date(start.getTime() + 3600000)
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    const ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${APPOINTMENT_TYPE_LABELS[apt.appointment_type as AppointmentType] || apt.appointment_type}`,
      `LOCATION:${apt.location || ''}`,
      `DESCRIPTION:${apt.notes || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n')

    const blob = new Blob([ical], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `visa-appointment-${apt.id.slice(0, 8)}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statusColors: Record<string, { bg: string; text: string }> = {
    scheduled: { bg: 'bg-blue-50', text: 'text-blue-700' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    cancelled: { bg: 'bg-slate-100', text: 'text-slate-500' },
    rescheduled: { bg: 'bg-amber-50', text: 'text-amber-700' },
    no_show: { bg: 'bg-red-50', text: 'text-red-700' },
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800">Appointments</h4>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Schedule
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
              <select
                className="w-full border-slate-300 rounded-lg text-sm"
                value={formData.appointment_type}
                onChange={e => setFormData(p => ({ ...p, appointment_type: e.target.value }))}
              >
                {Object.entries(APPOINTMENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date & Time *</label>
              <input
                type="datetime-local"
                className="w-full border-slate-300 rounded-lg text-sm"
                value={formData.scheduled_datetime}
                onChange={e => setFormData(p => ({ ...p, scheduled_datetime: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Location</label>
              <input type="text" className="w-full border-slate-300 rounded-lg text-sm" placeholder="e.g. US Embassy" value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
              <input type="text" className="w-full border-slate-300 rounded-lg text-sm" placeholder="Full address" value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
            <input type="text" className="w-full border-slate-300 rounded-lg text-sm" placeholder="Any notes..." value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-100">Cancel</button>
            <button onClick={handleCreate} disabled={saving || !formData.scheduled_datetime} className="px-3 py-1.5 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1">
              {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
            </button>
          </div>
        </div>
      )}

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No appointments scheduled</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(apt => {
            const sc = statusColors[apt.status] || statusColors.scheduled
            const isPast = new Date(apt.scheduled_datetime) < new Date()
            return (
              <div key={apt.id} className={`border rounded-xl p-4 ${apt.status === 'cancelled' ? 'opacity-50 border-slate-200' : 'border-slate-200 hover:border-slate-300'} transition-colors`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${sc.bg}`}>
                      <Calendar className={`w-5 h-5 ${sc.text}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {APPOINTMENT_TYPE_LABELS[apt.appointment_type as AppointmentType] || apt.appointment_type}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(apt.scheduled_datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {apt.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {apt.location}
                          </span>
                        )}
                      </div>
                      {apt.notes && <p className="text-xs text-slate-400 mt-1">{apt.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${sc.bg} ${sc.text}`}>
                      {apt.status}
                    </span>
                    {apt.status === 'scheduled' && (
                      <>
                        <button onClick={() => handleMarkComplete(apt.id)} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded" title="Complete">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleCancel(apt.id)} className="p-1 text-slate-400 hover:text-red-500 rounded" title="Cancel">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button onClick={() => exportIcal(apt)} className="p-1 text-slate-400 hover:text-teal-600 rounded" title="Export to Calendar">
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
