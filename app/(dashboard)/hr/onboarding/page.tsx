'use client'

import { useState, useEffect } from 'react'
import { Plus, CheckCircle, Clock, User } from 'lucide-react'

export default function OnboardingPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data
    setEmployees([
      {
        id: '1',
        name: 'Sarah Johnson',
        position: 'New Sales Agent',
        startDate: '2024-07-01',
        progress: 65,
        tasks: [
          { label: 'Company Orientation', completed: true },
          { label: 'IT Setup', completed: true },
          { label: 'Desk & Office Tour', completed: true },
          { label: 'Documentation Review', completed: false },
          { label: 'Team Introduction', completed: false }
        ]
      },
      {
        id: '2',
        name: 'Michael Chen',
        position: 'Operations Officer',
        startDate: '2024-07-08',
        progress: 20,
        tasks: [
          { label: 'Company Orientation', completed: true },
          { label: 'IT Setup', completed: false },
          { label: 'Desk & Office Tour', completed: false },
          { label: 'Documentation Review', completed: false },
          { label: 'Team Introduction', completed: false }
        ]
      }
    ])
    setLoading(false)
  }, [])

  const onboardingCategories = [
    { label: 'Orientation', count: 3 },
    { label: 'IT & Systems', count: 4 },
    { label: 'Documentation', count: 5 },
    { label: 'Training', count: 6 }
  ]

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Onboarding</h1>
            <p className="text-slate-600 mt-1">Track new employee onboarding progress</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
            <Plus className="w-5 h-5" />
            Start Onboarding
          </button>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {onboardingCategories.map((cat) => (
            <div key={cat.label} className="bg-white rounded-lg shadow p-6">
              <p className="text-slate-600 text-sm font-medium">{cat.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{cat.count}</p>
              <p className="text-slate-500 text-xs mt-2">tasks</p>
            </div>
          ))}
        </div>

        {/* Active Onboardings */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-900">Active Onboardings</h2>
          {loading ? (
            <div className="text-center text-slate-600">Loading...</div>
          ) : (
            employees.map((emp) => (
              <div key={emp.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{emp.name}</h3>
                      <p className="text-slate-600 text-sm">{emp.position}</p>
                      <p className="text-slate-500 text-xs mt-1">Started {new Date(emp.startDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-teal-600">{emp.progress}%</p>
                    <p className="text-slate-600 text-sm">Complete</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-600 rounded-full" style={{ width: `${emp.progress}%` }}></div>
                </div>

                {/* Tasks */}
                <div className="grid grid-cols-2 gap-4">
                  {emp.tasks.map((task, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded">
                      {task.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={task.completed ? 'text-slate-600 line-through' : 'text-slate-900'}>{task.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
