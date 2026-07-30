'use client'

import type { VisaTimelineEvent } from '@/types/visa'
import { CheckCircle, FileText, Calendar, Send, Fingerprint, Users, Search, AlertTriangle, Award, XCircle, RotateCcw, Ban, Clock, UserCheck, FolderOpen, FileCheck, MessageSquare, CreditCard } from 'lucide-react'

interface VisaTimelineProps {
  events: VisaTimelineEvent[]
}

const EVENT_ICONS: Record<string, any> = {
  application_created: FileText,
  status_changed: Search,
  document_uploaded: FileCheck,
  document_verified: CheckCircle,
  document_rejected: XCircle,
  document_deleted: Ban,
  appointment_scheduled: Calendar,
  appointment_completed: UserCheck,
  appointment_cancelled: Ban,
  fee_updated: CreditCard,
  comment_added: MessageSquare,
  default: Clock,
}

const EVENT_COLORS: Record<string, string> = {
  application_created: '#0EA5E9',
  document_uploaded: '#3B82F6',
  document_verified: '#10B981',
  document_rejected: '#EF4444',
  appointment_scheduled: '#8B5CF6',
  appointment_completed: '#059669',
  fee_updated: '#F59E0B',
  comment_added: '#6366F1',
  default: '#94A3B8',
}

function getEventIcon(type: string) {
  // Match partial event types
  for (const [key, Icon] of Object.entries(EVENT_ICONS)) {
    if (type.includes(key)) return Icon
  }
  if (type.includes('approved')) return Award
  if (type.includes('rejected')) return XCircle
  if (type.includes('submitted')) return Send
  if (type.includes('biometric')) return Fingerprint
  if (type.includes('interview')) return Users
  if (type.includes('review')) return Search
  if (type.includes('passport_returned')) return RotateCcw
  if (type.includes('completed')) return CheckCircle
  if (type.includes('expired')) return Clock
  if (type.includes('cancelled')) return Ban
  return EVENT_ICONS.default
}

function getEventColor(type: string) {
  for (const [key, color] of Object.entries(EVENT_COLORS)) {
    if (type.includes(key)) return color
  }
  if (type.includes('approved') || type.includes('completed')) return '#10B981'
  if (type.includes('rejected') || type.includes('cancelled')) return '#EF4444'
  if (type.includes('submitted')) return '#8B5CF6'
  if (type.includes('biometric')) return '#EC4899'
  if (type.includes('interview')) return '#F97316'
  if (type.includes('review')) return '#6366F1'
  return EVENT_COLORS.default
}

export function VisaTimeline({ events }: VisaTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
          <Clock className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600">No timeline events yet</p>
        <p className="text-xs text-slate-400 mt-1">Events will appear here as the application progresses</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />

      <div className="space-y-0">
        {events.map((event, i) => {
          const Icon = getEventIcon(event.event_type)
          const color = getEventColor(event.event_type)
          const isFirst = i === 0

          return (
            <div key={event.id} className="relative flex items-start gap-4 py-4">
              {/* Icon node */}
              <div
                className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white flex-shrink-0"
                style={{ borderColor: color }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center justify-between gap-4">
                  <p className={`text-sm font-semibold ${isFirst ? 'text-slate-900' : 'text-slate-700'}`}>
                    {event.title}
                  </p>
                  <time className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(event.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </time>
                </div>
                {event.description && (
                  <p className="text-xs text-slate-500 mt-1">{event.description}</p>
                )}
                {event.performed_by_name && (
                  <p className="text-[11px] text-slate-400 mt-1">by {event.performed_by_name}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
