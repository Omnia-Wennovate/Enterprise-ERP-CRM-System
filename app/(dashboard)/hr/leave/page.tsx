'use client'

import { useState } from 'react'
import { CheckCircle, Clock, XCircle } from 'lucide-react'

interface LeaveRequest {
  id: string
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
  daysRequested: number
  reason: string
  status: 'approved' | 'pending' | 'rejected'
}

export default function LeavePage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const leaveRequests: LeaveRequest[] = [
    {
      id: '1',
      employeeName: 'John Smith',
      leaveType: 'Annual Leave',
      startDate: '2024-12-20',
      endDate: '2024-12-27',
      daysRequested: 6,
      reason: 'Family vacation',
      status: 'pending',
    },
    {
      id: '2',
      employeeName: 'Sarah Johnson',
      leaveType: 'Sick Leave',
      startDate: '2024-12-15',
      endDate: '2024-12-16',
      daysRequested: 2,
      reason: 'Medical appointment',
      status: 'approved',
    },
    {
      id: '3',
      employeeName: 'Mike Davis',
      leaveType: 'Emergency Leave',
      startDate: '2024-12-10',
      endDate: '2024-12-10',
      daysRequested: 1,
      reason: 'Family emergency',
      status: 'rejected',
    },
  ]

  const filteredRequests = leaveRequests.filter((req) => filter === 'all' || req.status === filter)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-muted text-slate-700'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Leave Management</h1>
          <p className="text-muted-foreground mt-1">Manage employee leave requests and approvals</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${filter === status ? 'bg-teal-600 text-primary-foreground' : 'bg-card text-foreground border border-border'
                }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Leave Requests Table */}
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Leave Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Date Range</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 font-semibold text-foreground">{req.employeeName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{req.leaveType}</td>
                    <td className="px-6 py-4 text-muted-foreground">{req.startDate} to {req.endDate}</td>
                    <td className="px-6 py-4 text-muted-foreground">{req.daysRequested}</td>
                    <td className="px-6 py-4 text-muted-foreground">{req.reason}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(req.status)}
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(req.status)}`}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <button className="px-3 py-1 text-xs font-medium text-primary-foreground bg-green-600 rounded hover:bg-green-700">
                            Approve
                          </button>
                          <button className="px-3 py-1 text-xs font-medium text-primary-foreground bg-red-600 rounded hover:bg-red-700">
                            Reject
                          </button>
                        </div>
                      )}
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
