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
        return 'bg-muted text-slate-700'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Recruitment</h1>
            <p className="text-muted-foreground mt-1">Manage job positions and applicants</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-omnia-gold text-primary-foreground rounded-lg hover:bg-omnia-gold-dark font-medium">
            <Plus className="w-5 h-5" />
            Post Job
          </button>
        </div>

        {/* Job Positions Table */}
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Applicants</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Posted</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {jobPositions.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 font-semibold text-foreground">{job.title}</td>
                    <td className="px-6 py-4 text-muted-foreground">{job.department}</td>
                    <td className="px-6 py-4 text-muted-foreground">{job.applicants}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(job.postedDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="text-omnia-gold hover:text-omnia-gold-dark font-medium text-sm">View</button>
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
