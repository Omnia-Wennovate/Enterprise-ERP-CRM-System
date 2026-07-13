'use client'

import { useState, useEffect } from 'react'
import { Phone, Mail, Users, BookOpen, CheckSquare, FileText, Clock } from 'lucide-react'
import type { Activity } from '@/types'
import { storage } from '@/lib/storage'

const ACTIVITY_ICONS = {
  call: <Phone className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  meeting: <Users className="w-4 h-4" />,
  note: <BookOpen className="w-4 h-4" />,
  task: <CheckSquare className="w-4 h-4" />,
  quotation: <FileText className="w-4 h-4" />,
  proposal: <FileText className="w-4 h-4" />,
}

const ACTIVITY_COLORS = {
  call: 'bg-blue-100 text-blue-700',
  email: 'bg-green-100 text-green-700',
  meeting: 'bg-purple-100 text-purple-700',
  note: 'bg-yellow-100 text-yellow-700',
  task: 'bg-orange-100 text-orange-700',
  quotation: 'bg-teal-100 text-teal-700',
  proposal: 'bg-indigo-100 text-indigo-700',
}

export function ActivitiesTimeline() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const allActivities = storage.getActivities()
    // Sort by created_at descending
    const sorted = [...allActivities].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setActivities(sorted)
    setIsLoading(false)
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  if (isLoading) return <div className="p-4">Loading activities...</div>

  return (
    <div className="space-y-4 p-4">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex gap-4">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className={`p-2 rounded-lg ${ACTIVITY_COLORS[activity.type]}`}>
              {ACTIVITY_ICONS[activity.type]}
            </div>
            {index < activities.length - 1 && (
              <div className="w-0.5 h-12 bg-gray-200 my-2"></div>
            )}
          </div>

          {/* Activity content */}
          <div className="flex-1 pt-1">
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${ACTIVITY_COLORS[activity.type]}`}>
                  {activity.type}
                </span>
              </div>

              {activity.description && (
                <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(activity.created_at)}</span>
                </div>

                {activity.duration_minutes && (
                  <span>{activity.duration_minutes} mins</span>
                )}
              </div>

              {activity.due_date && !activity.completed_at && (
                <div className="mt-2 pt-2 border-t text-xs text-amber-700 bg-amber-50 p-2 rounded">
                  Due: {new Date(activity.due_date).toLocaleDateString()}
                </div>
              )}

              {activity.completed_at && (
                <div className="mt-2 pt-2 border-t text-xs text-green-700 bg-green-50 p-2 rounded">
                  Completed: {new Date(activity.completed_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {activities.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No activities yet</p>
        </div>
      )}
    </div>
  )
}
