'use client'

import { CustomersTable } from '@/components/crm/CustomersTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { CustomerFormModal } from '@/components/crm/CustomerFormModal'
import type { Customer } from '@/types'

export default function CustomersPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCreateSuccess = (_customer: Customer) => {
    setIsCreateOpen(false)
    setRefreshKey(k => k + 1)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <PageHeader
          kicker="CRM"
          title="Customers"
          subtitle="View and manage all your customers"
          actions={
            <Button
              variant="gold"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Customer
            </Button>
          }
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <CustomersTable refreshKey={refreshKey} />
      </div>

      {/* Create Modal */}
      <CustomerFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
