'use client'

import { ActivitiesTimeline } from '@/components/crm/ActivitiesTimeline'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function ActivitiesPage() {
  return (
    <div className="flex flex-col h-full bg-[#F0F7FA]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
            <p className="text-sm text-gray-600">View all calls, emails, meetings, and notes</p>
          </div>
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            Log Activity
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <ActivitiesTimeline />
      </div>
    </div>
  )
}
