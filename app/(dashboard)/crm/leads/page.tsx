'use client'

import { useRef, useState } from 'react'
import { LeadsKanban, type LeadsKanbanRef } from '@/components/crm/LeadsKanban'
import { NewLeadModal } from '@/components/crm/NewLeadModal'
import { LeadToast, useToast } from '@/components/crm/LeadToast'
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
    <div className="flex flex-col h-full bg-[#F0F7FA]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Leads</h1>
            <p className="text-sm text-gray-600">Manage and track your sales pipeline</p>
          </div>
          <Button
            className="bg-teal-600 hover:bg-teal-700"
            onClick={() => setIsNewLeadOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Lead
          </Button>
        </div>
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
