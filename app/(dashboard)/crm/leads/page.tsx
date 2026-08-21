'use client'

import { useRef, useState } from 'react'
import { LeadsKanban, type LeadsKanbanRef } from '@/components/crm/LeadsKanban'
import { NewLeadModal } from '@/components/crm/NewLeadModal'
import { LeadToast, useToast } from '@/components/crm/LeadToast'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function LeadsPage() {
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false)
  const kanbanRef = useRef<LeadsKanbanRef>(null)
  const { toast, showToast, dismissToast } = useToast()

  const handleLeadCreated = async () => {
    showToast('Lead created successfully and added to pipeline!', 'success')
    // Refresh the Kanban board without page reload
    await kanbanRef.current?.refreshLeads()
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <PageHeader
          kicker="CRM"
          title="Sales Leads"
          subtitle="Manage and track your sales pipeline"
          actions={
            <Button
              variant="gold"
              onClick={() => setIsNewLeadOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Lead
            </Button>
          }
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <LeadsKanban ref={kanbanRef} />
      </div>

      {/* New Lead Modal */}
      <NewLeadModal
        isOpen={isNewLeadOpen}
        onClose={() => setIsNewLeadOpen(false)}
        onSuccess={handleLeadCreated}
      />

      {/* Toast Notification */}
      <LeadToast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onDismiss={dismissToast}
      />
    </div>
  )
}
