'use client'

import { useState, useEffect } from 'react'
import { GripVertical, Plus, MoreVertical, Flag } from 'lucide-react'
import type { Task, TaskStatus, TaskPriority } from '@/types'
import { storage } from '@/lib/storage'
import { Button } from '@/components/ui/button'

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  to_do: { label: 'To Do', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  in_progress: { label: 'In Progress', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  completed: { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-blue-600' },
  medium: { label: 'Medium', color: 'text-yellow-600' },
  high: { label: 'High', color: 'text-orange-600' },
  urgent: { label: 'Urgent', color: 'text-red-600' },
}

const STATUSES: TaskStatus[] = ['to_do', 'in_progress', 'completed', 'cancelled']

export function TasksKanban() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setTasks(storage.getTasks())
    setIsLoading(false)
  }, [])

  const tasksByStatus = STATUSES.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((task) => task.status === status)
      return acc
    },
    {} as Record<TaskStatus, Task[]>,
  )

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('taskId', task.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    const task = tasks.find((t) => t.id === taskId)
    if (task && task.status !== status) {
      const updated = tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status,
              completed_at: status === 'completed' ? new Date().toISOString() : null,
            }
          : t,
      )
      setTasks(updated)
      storage.setTasks(updated)
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date().toDateString() !== new Date(dueDate).toDateString()
  }

  if (isLoading) return <div className="p-4">Loading tasks...</div>

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 p-4 min-w-max">
        {STATUSES.map((status) => (
          <div key={status} className="flex flex-col w-80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold text-sm ${STATUS_CONFIG[status].color}`}>
                  {STATUS_CONFIG[status].label}
                </h3>
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                  {tasksByStatus[status].length}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div
              className="flex-1 space-y-3 bg-gray-50 rounded-lg p-3 min-h-96"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              {tasksByStatus[status].map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  className={`p-3 rounded-lg border cursor-move transition-all hover:shadow-md ${
                    isOverdue(task.due_date) && task.status !== 'completed'
                      ? 'border-red-300 bg-red-50 hover:border-red-400'
                      : 'border-gray-200 bg-white hover:border-teal-300'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <GripVertical className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-gray-600 truncate mt-1">{task.description}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Flag className={`w-3 h-3 ${PRIORITY_CONFIG[task.priority].color}`} />
                        <span className={`text-xs font-medium ${PRIORITY_CONFIG[task.priority].color}`}>
                          {PRIORITY_CONFIG[task.priority].label}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          isOverdue(task.due_date) && task.status !== 'completed'
                            ? 'bg-red-100 text-red-700'
                            : STATUS_CONFIG[status].bgColor + ' ' + STATUS_CONFIG[status].color
                        }`}
                      >
                        {new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {task.is_reminder_set && (
                      <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        🔔 Reminder set
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {tasksByStatus[status].length === 0 && (
                <div className="flex items-center justify-center h-32 text-gray-400">
                  <p className="text-sm">No tasks</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
