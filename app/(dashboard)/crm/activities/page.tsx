'use client'

import { ActivitiesTimeline } from '@/components/crm/ActivitiesTimeline'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function ActivitiesPage() {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <PageHeader
          kicker="CRM"
          title="Activities"
          subtitle="View all calls, emails, meetings, and notes"
          actions={
            <Button variant="gold">
              <Plus className="w-4 h-4 mr-2" />
              Log Activity
            </Button>
          }
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <ActivitiesTimeline />
      </div>
    </div>
  )
}
