'use client'

import { useState } from 'react'
import { TasksKanban } from '@/components/crm/TasksKanban'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function TasksPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
            <p className="text-sm text-muted-foreground">Track and manage your daily tasks</p>
          </div>
          <Button
            className="bg-omnia-gold hover:bg-omnia-gold-dark"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <TasksKanban
          isDialogOpen={isDialogOpen}
          onDialogOpenChange={setIsDialogOpen}
        />
      </div>
    </div>
  )
}
