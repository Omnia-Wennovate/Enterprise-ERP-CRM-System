'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, AlertCircle, Plus, Filter } from 'lucide-react'

export default function TasksPage() {
  const [tasks] = useState([
    {
      id: 1,
      title: 'Complete project report',
      assignedBy: 'Robert Johnson',
      priority: 'high',
      dueDate: 'Dec 22, 2024',
      status: 'in_progress',
    },
    {
      id: 2,
      title: 'Review client proposal',
      assignedBy: 'Jane Doe',
      priority: 'medium',
      dueDate: 'Dec 23, 2024',
      status: 'pending',
    },
    {
      id: 3,
      title: 'Update budget spreadsheet',
      assignedBy: 'Finance Team',
      priority: 'high',
      dueDate: 'Dec 21, 2024',
      status: 'pending',
    },
    {
      id: 4,
      title: 'Schedule team training',
      assignedBy: 'HR Department',
      priority: 'low',
      dueDate: 'Dec 30, 2024',
      status: 'completed',
    },
  ])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'in_progress':
        return <AlertCircle className="w-5 h-5 text-amber-600" />
      default:
        return <Circle className="w-5 h-5 text-slate-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tasks</h1>
            <p className="text-slate-600 mt-1">Tasks assigned to you from conversations</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">
              <Filter className="w-5 h-5" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
              <Plus className="w-5 h-5" />
              New Task
            </button>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Task</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Assigned By</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{task.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">{task.assignedBy}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">{task.dueDate}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <span className="text-sm text-slate-600 capitalize">{task.status.replace('_', ' ')}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
