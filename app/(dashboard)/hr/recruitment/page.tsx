'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface JobPosition {
  id: string
  title: string
  department: string
  status: 'open' | 'closed' | 'filled'
  applicants: number
  postedDate: string
}

export default function RecruitmentPage() {
  const [jobPositions] = useState<JobPosition[]>([
    {
      id: '1',
      title: 'Senior Sales Agent',
      department: 'Sales',
      status: 'open',
      applicants: 12,
      postedDate: '2024-11-20',
    },
    {
      id: '2',
      title: 'Operations Manager',
      department: 'Operations',
      status: 'open',
      applicants: 8,
      postedDate: '2024-11-15',
    },
    {
      id: '3',
      title: 'Marketing Executive',
      department: 'Marketing',
      status: 'filled',
      applicants: 25,
      postedDate: '2024-10-01',
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-700'
      case 'closed':
        return 'bg-red-100 text-red-700'
      case 'filled':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Recruitment</h1>
            <p className="text-slate-600 mt-1">Manage job positions and applicants</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
            <Plus className="w-5 h-5" />
            Post Job
          </button>
        </div>

        {/* Job Positions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Applicants</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Posted</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {jobPositions.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">{job.title}</td>
                    <td className="px-6 py-4 text-slate-600">{job.department}</td>
                    <td className="px-6 py-4 text-slate-600">{job.applicants}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(job.postedDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="text-teal-600 hover:text-teal-700 font-medium text-sm">View</button>
                        <button className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
