'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Calendar,
  ArrowRight,
  FileText,
  Phone,
  Mail,
  Users,
  Star,
  Bell,
  Copy,
  Archive,
  CheckCircle2,
  PlusCircle,
  Loader2,
} from 'lucide-react'
import { getLeadActivities } from '@/lib/services/lead-activities'
import type { LeadActivity } from '@/types/leads'

const ACTIVITY_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  lead_created:       { icon: Star,        color: 'text-omnia-gold',   bg: 'bg-omnia-gold/15' },
  lead_updated:       { icon: FileText,    color: 'text-omnia-gold',   bg: 'bg-blue-100' },
  stage_changed:      { icon: ArrowRight,  color: 'text-purple-600', bg: 'bg-purple-100' },
  note_added:         { icon: FileText,    color: 'text-yellow-600', bg: 'bg-yellow-100' },
  document_uploaded:  { icon: FileText,    color: 'text-indigo-600', bg: 'bg-indigo-100' },
  email_sent:         { icon: Mail,        color: 'text-green-600',  bg: 'bg-green-100' },
  call_made:          { icon: Phone,       color: 'text-omnia-gold',   bg: 'bg-blue-100' },
  meeting_scheduled:  { icon: Users,       color: 'text-purple-600', bg: 'bg-purple-100' },
  task_created:       { icon: CheckCircle2,color: 'text-orange-600', bg: 'bg-orange-100' },
  follow_up_scheduled:{ icon: Bell,        color: 'text-amber-600',  bg: 'bg-amber-100' },
  assigned:           { icon: User,        color: 'text-omnia-gold',   bg: 'bg-omnia-gold/15' },
  converted:          { icon: CheckCircle2,color: 'text-green-600',  bg: 'bg-green-100' },
  archived:           { icon: Archive,     color: 'text-muted-foreground',   bg: 'bg-muted' },
  deleted:            { icon: Archive,     color: 'text-red-600',    bg: 'bg-red-100' },
  duplicated:         { icon: Copy,        color: 'text-omnia-gold',   bg: 'bg-blue-100' },
  quotation_generated:{ icon: FileText,    color: 'text-omnia-gold',   bg: 'bg-omnia-gold/15' },
}

function formatActivityDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface Props {
  leadId: string
  refreshTrigger?: number
}

export function LeadActivityTimeline({ leadId, refreshTrigger }: Props) {
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    getLeadActivities(leadId)
      .then(setActivities)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [leadId, refreshTrigger])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-omnia-gold animate-spin" />
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Calendar className="w-10 h-10 mb-2 opacity-40" />
        <p className="text-sm">No activities yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-1 py-2">
      {activities.map((activity, index) => {
        const config = ACTIVITY_CONFIG[activity.activity_type] || ACTIVITY_CONFIG.lead_updated
        const Icon = config.icon
        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="flex gap-3 group"
          >
            {/* Icon + line */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bg} flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              {index < activities.length - 1 && (
                <div className="w-px flex-1 bg-muted my-1 min-h-[16px]" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground leading-snug">{activity.title}</p>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                  {formatActivityDate(activity.created_at)}
                </span>
              </div>
              {activity.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
              )}
              {activity.performer && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-4 h-4 rounded-full bg-omnia-gold/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-omnia-gold-dark">
                      {activity.performer.full_name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{activity.performer.full_name}</span>
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
      <div className="flex items-center gap-2 pt-2 text-muted-foreground">
        <PlusCircle className="w-4 h-4" />
        <span className="text-xs">Start of activity log</span>
      </div>
    </div>
  )
}
