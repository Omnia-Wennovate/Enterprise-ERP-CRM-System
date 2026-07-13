'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default function LeaveRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [status, setStatus] = useState('pending')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const leaveRequest = {
    id: params.id,
    employee: 'John Smith',
    leaveType: 'Annual Leave',
    startDate: '2024-07-15',
    endDate: '2024-07-22',
    days: 8,
    reason: 'Personal vacation',
    status: 'pending',
    requestedAt: '2024-06-20',
    manager: 'Jane Doe'
  }

  const handleApprove = async () => {
    setStatus('approved')
    // TODO: Call server action to update leave request
  }

  const handleReject = async () => {
    setStatus('rejected')
    setShowRejectForm(false)
    // TODO: Call server action to reject leave request
  }

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/hr/leave" className="p-2 hover:bg-white rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Leave Request</h1>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Main Card */}
          <div className="col-span-2 bg-white rounded-lg shadow p-8">
            {/* Status */}
            <div className="mb-8">
              <div className="flex items-center gap-3">
                {status === 'pending' && (
                  <>
                    <Clock className="w-8 h-8 text-amber-600" />
                    <div>
                      <p className="text-sm text-slate-600">Status</p>
                      <p className="text-xl font-bold text-amber-600">Pending Approval</p>
                    </div>
                  </>
                )}
                {status === 'approved' && (
                  <>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-slate-600">Status</p>
                      <p className="text-xl font-bold text-green-600">Approved</p>
                    </div>
                  </>
                )}
                {status === 'rejected' && (
                  <>
                    <XCircle className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="text-sm text-slate-600">Status</p>
                      <p className="text-xl font-bold text-red-600">Rejected</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Employee Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Employee Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded p-4">
                    <p className="text-slate-600 text-sm">Employee Name</p>
                    <p className="text-lg font-semibold text-slate-900">{leaveRequest.employee}</p>
                  </div>
                  <div className="bg-slate-50 rounded p-4">
                    <p className="text-slate-600 text-sm">Manager</p>
                    <p className="text-lg font-semibold text-slate-900">{leaveRequest.manager}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Leave Details</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded p-4">
                    <p className="text-slate-600 text-sm">Leave Type</p>
                    <p className="text-lg font-semibold text-slate-900">{leaveRequest.leaveType}</p>
                  </div>
                  <div className="bg-slate-50 rounded p-4">
                    <p className="text-slate-600 text-sm">Number of Days</p>
                    <p className="text-lg font-semibold text-slate-900">{leaveRequest.days} days</p>
                  </div>
                  <div className="bg-slate-50 rounded p-4">
                    <p className="text-slate-600 text-sm">Start Date</p>
                    <p className="text-lg font-semibold text-slate-900">{new Date(leaveRequest.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-slate-50 rounded p-4">
                    <p className="text-slate-600 text-sm">End Date</p>
                    <p className="text-lg font-semibold text-slate-900">{new Date(leaveRequest.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Reason</h3>
                <p className="text-slate-700 bg-slate-50 rounded p-4">{leaveRequest.reason}</p>
              </div>

              <div className="border-t pt-6">
                <p className="text-sm text-slate-600">Requested on {new Date(leaveRequest.requestedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Actions</h3>
            
            {status === 'pending' && (
              <div className="space-y-3">
                <button
                  onClick={handleApprove}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectForm(!showRejectForm)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Reject
                </button>
              </div>
            )}

            {showRejectForm && (
              <div className="space-y-3 mt-4 pt-4 border-t">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection"
                  className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={4}
                />
                <button
                  onClick={handleReject}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Confirm Rejection
                </button>
              </div>
            )}

            {status !== 'pending' && (
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <p className="text-sm text-slate-600">Request has been {status}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
