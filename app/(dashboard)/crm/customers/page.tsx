'use client'

import { CustomersTable } from '@/components/crm/CustomersTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { NewCustomerModal } from '@/components/crm/NewCustomerModal'

export default function CustomersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

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
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Customer
            </Button>
          }
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <CustomersTable />
      </div>

      <NewCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          window.location.reload()
        }}
      />
    </div>
  )
}
