'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, User, FileText, Calendar, CreditCard, MessageSquare, MapPin, Sparkles, Activity, Globe, Clock } from 'lucide-react'
import type { VisaApplicationWithRelations } from '@/types/visa'
import { VISA_STATUS_CONFIG, VISA_PRIORITY_CONFIG } from '@/types/visa'
import { VisaDocuments } from './VisaDocuments'
import { VisaTimeline } from './VisaTimeline'
import { VisaAppointments } from './VisaAppointments'
import { VisaCommunicationPanel } from './VisaCommunication'
import { VisaFees } from './VisaFees'
import { VisaAIAssistant } from './VisaAIAssistant'
import { VisaCountryRules } from './VisaCountryRules'

interface VisaDetailProps {
  visaId: string
  onBack: () => void
  onEdit: (id: string) => void
}

export function VisaDetail({ visaId, onBack, onEdit }: VisaDetailProps) {
  const [visa, setVisa] = useState<VisaApplicationWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'timeline' | 'appointments' | 'communications' | 'fees' | 'ai' | 'rules'>('overview')

  // We would normally fetch data here
  // For the sake of the implementation plan, we will simulate loading
  // and require the parent to pass the data, or fetch it here.
  // Actually, let's fetch it here.
  
  import('react').then(({ useEffect }) => {
    useEffect(() => {
      async function load() {
        try {
          const { getVisaApplicationById } = await import('@/lib/services/visa')
          const data = await getVisaApplicationById(visaId)
          setVisa(data)
        } catch (err) {
          console.error(err)
        } finally {
          setLoading(false)
        }
      }
      load()
    }, [visaId])
  })

  if (loading) {
    return <div className="flex justify-center items-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>
  }

  if (!visa) {
    return <div className="text-center py-24 text-slate-500">Visa application not found</div>
  }

  const statusConfig = VISA_STATUS_CONFIG[visa.status] || VISA_STATUS_CONFIG.not_started
  const priorityConfig = VISA_PRIORITY_CONFIG[visa.priority] || VISA_PRIORITY_CONFIG.normal

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'documents', label: 'Documents', icon: FileText, count: visa.documents?.length || 0 },
    { id: 'timeline', label: 'Timeline', icon: Activity, count: visa.timeline?.length || 0 },
    { id: 'appointments', label: 'Appointments', icon: Calendar, count: visa.appointments?.length || 0 },
    { id: 'communications', label: 'Messages', icon: MessageSquare, count: visa.communications?.length || 0 },
    { id: 'fees', label: 'Fees', icon: CreditCard, count: visa.fees ? 1 : 0 },
    { id: 'ai', label: 'AI Assistant', icon: Sparkles },
    { id: 'rules', label: 'Country Rules', icon: Globe },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">
                {visa.traveler_first_name} {visa.traveler_last_name}
              </h1>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
              >
                {statusConfig.label}
              </span>
              {visa.priority !== 'normal' && (
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{ backgroundColor: priorityConfig.bgColor, color: priorityConfig.color }}
                >
                  {priorityConfig.label}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {visa.destination_country} • {visa.visa_type.replace('_', ' ').toUpperCase()} • Ref: {visa.booking_reference || 'N/A'}
            </p>
          </div>
        </div>
        <button
          onClick={() => onEdit(visa.id)}
          className="px-4 py-2 bg-teal-50 text-teal-700 font-medium rounded-lg hover:bg-teal-100 transition-colors"
        >
          Edit Details
        </button>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 sticky top-6">
            <nav className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                      {tab.label}
                    </div>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Applicant Info */}
                <section>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2 mb-4">Applicant Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Full Name</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{visa.traveler_first_name} {visa.traveler_last_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Nationality</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{visa.traveler_nationality || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Date of Birth</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{visa.traveler_date_of_birth ? new Date(visa.traveler_date_of_birth).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Passport Number</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{visa.traveler_passport_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Passport Expiry</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{visa.traveler_passport_expiry ? new Date(visa.traveler_passport_expiry).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </section>

                {/* Travel Info */}
                <section>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2 mb-4">Travel & Application Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Destination</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{visa.destination_country}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Visa Type</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1 capitalize">{visa.visa_type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Purpose</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{visa.purpose_of_travel || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Submission Date</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{visa.submission_date ? new Date(visa.submission_date).toLocaleDateString() : 'Not submitted'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Expected Decision</p>
                      <p className="text-sm font-semibold text-amber-600 mt-1">{visa.expected_decision_date ? new Date(visa.expected_decision_date).toLocaleDateString() : 'Unknown'}</p>
                    </div>
                  </div>
                </section>

                {/* Booking Link */}
                {visa.booking_id && (
                  <section>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2 mb-4">Linked Booking</h3>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-teal-700">{visa.booking_reference}</p>
                        <p className="text-xs text-slate-500 mt-1">{visa.booking_customer_name} • {visa.booking_destination}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {visa.booking_trip_start_date ? new Date(visa.booking_trip_start_date).toLocaleDateString() : ''} - 
                          {visa.booking_trip_end_date ? new Date(visa.booking_trip_end_date).toLocaleDateString() : ''}
                        </p>
                      </div>
                      <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50">View Booking</button>
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Other Tabs */}
            {activeTab === 'documents' && (
              <VisaDocuments
                documents={visa.documents || []}
                requiredDocTypes={visa.country_rule?.required_documents || []}
                onUpload={async () => { /* re-fetch */ }}
                onVerify={async () => { /* re-fetch */ }}
                onDelete={async () => { /* re-fetch */ }}
              />
            )}

            {activeTab === 'timeline' && (
              <VisaTimeline events={visa.timeline || []} />
            )}

            {activeTab === 'appointments' && (
              <VisaAppointments
                appointments={visa.appointments || []}
                visaApplicationId={visa.id}
                onCreate={async () => { /* re-fetch */ }}
                onUpdate={async () => { /* re-fetch */ }}
                onDelete={async () => { /* re-fetch */ }}
              />
            )}

            {activeTab === 'communications' && (
              <VisaCommunicationPanel
                messages={visa.communications || []}
                visaApplicationId={visa.id}
                onSend={async () => { /* re-fetch */ }}
              />
            )}

            {activeTab === 'fees' && (
              <VisaFees
                fee={visa.fees}
                visaApplicationId={visa.id}
                onSave={async () => { /* re-fetch */ }}
              />
            )}

            {activeTab === 'ai' && (
              <VisaAIAssistant
                visa={visa}
                nationality={visa.traveler_nationality || 'Unknown'}
                destination={visa.destination_country}
              />
            )}

            {activeTab === 'rules' && (
              <VisaCountryRules />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
