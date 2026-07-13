'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plane, DollarSign, Calendar, Link as LinkIcon, Building, Plus, CheckCircle, XCircle } from 'lucide-react'
import type { ExternalTrainingRequest } from '@/types/hr'

export function ExternalTrainingForm() {
  const [requests, setRequests] = useState<ExternalTrainingRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const { getExternalRequests } = await import('@/lib/services/external-training')
      const data = await getExternalRequests() // In a real app, filter by employee ID if not HR/Manager
      setRequests(data)
    } catch (err) {
      console.error('Failed to load external requests:', err)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const { approveExternalRequest } = await import('@/lib/services/external-training')
      await approveExternalRequest(id, 'CURRENT_USER_ID_PLACEHOLDER')
      loadRequests()
    } catch (err) {
      console.error('Approval failed:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">Pending</span>
      case 'approved': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">Approved</span>
      case 'finance_approved': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">Approved (Expense Linked)</span>
      case 'rejected': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">Rejected</span>
      case 'completed': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">Completed</span>
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Plane className="w-5 h-5 text-teal-600" />
            External Training Requests
          </h2>
          <p className="text-slate-500 text-sm mt-1">Request approval for external courses, conferences, and certifications.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium shadow-sm shadow-teal-600/20">
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-40 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
        </div>
      ) : requests.length > 0 ? (
        <div className="grid gap-4">
          {requests.map((req, idx) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-xl border border-slate-200/80 p-5 hover:border-teal-200 transition-colors flex flex-col md:flex-row gap-6"
            >
              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(req.status)}
                    <span className="text-sm font-medium text-slate-600">
                      {req.employee?.first_name} {req.employee?.last_name} • {req.employee?.department}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Requested on {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{req.course_name}</h3>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{req.justification}</p>

                <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                  {req.provider && (
                    <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-slate-400" /> {req.provider}</span>
                  )}
                  {req.start_date && (
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> 
                      {new Date(req.start_date).toLocaleDateString()} {req.end_date && `- ${new Date(req.end_date).toLocaleDateString()}`}
                    </span>
                  )}
                  {req.cost > 0 && (
                    <span className="flex items-center gap-1.5 text-emerald-600"><DollarSign className="w-3.5 h-3.5" /> ${req.cost.toLocaleString()}</span>
                  )}
                  {req.reference_link && (
                    <a href={req.reference_link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-teal-600 hover:underline">
                      <LinkIcon className="w-3.5 h-3.5" /> View Details
                    </a>
                  )}
                </div>
              </div>

              {/* Actions (If Manager/HR) */}
              {req.status === 'pending' && (
                <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                  <button 
                    onClick={() => handleApprove(req.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors text-sm font-medium">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200/80">
          <Plane className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No External Requests</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
            Employees can request approval to attend external training courses, certifications, or conferences.
          </p>
        </div>
      )}
    </div>
  )
}
