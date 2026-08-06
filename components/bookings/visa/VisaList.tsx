'use client'

import { useState } from 'react'
import {
  FileText, Clock, CheckCircle, XCircle, Search, AlertTriangle, Calendar, Award, FileQuestion, Palmtree, Briefcase, Building2, GraduationCap, ArrowRightLeft, Stethoscope, Presentation, Heart, Shield,
  MoreVertical, Edit, FileSearch, Trash2, Printer
} from 'lucide-react'
import type { VisaApplication, VisaStatus, VisaPriority } from '@/types/visa'
import { VISA_STATUS_CONFIG, VISA_PRIORITY_CONFIG, VISA_TYPE_CONFIG } from '@/types/visa'
import { formatCurrency } from '@/lib/utils'

interface VisaListProps {
  applications: VisaApplication[]
  isLoading: boolean
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function VisaList({ applications, isLoading, onView, onEdit, onDelete }: VisaListProps) {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [sortField, setSortField] = useState<keyof VisaApplication>('created_at')
  const [sortDesc, setSortDesc] = useState(true)

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
        <p className="text-muted-foreground">Loading visa applications...</p>
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">No applications found</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          There are no visa applications matching your current filters, or you haven't created any yet.
        </p>
      </div>
    )
  }

  const handleSort = (field: keyof VisaApplication) => {
    if (sortField === field) {
      setSortDesc(!sortDesc)
    } else {
      setSortField(field)
      setSortDesc(false)
    }
  }

  const sortedApplications = [...applications].sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]

    if (aVal === bVal) return 0
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
    }

    if (aVal < bVal) return sortDesc ? 1 : -1
    if (aVal > bVal) return sortDesc ? -1 : 1
    return 0
  })

  // Table View
  if (viewMode === 'table') {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="px-6 py-4 cursor-pointer hover:bg-muted transition-colors" onClick={() => handleSort('traveler_first_name')}>
                  Applicant / Booking
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-muted transition-colors" onClick={() => handleSort('destination_country')}>
                  Destination / Type
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-muted transition-colors" onClick={() => handleSort('status')}>
                  Status / Priority
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-muted transition-colors" onClick={() => handleSort('created_at')}>
                  Timeline
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sortedApplications.map((app) => {
                const statusConfig = VISA_STATUS_CONFIG[app.status as VisaStatus] || VISA_STATUS_CONFIG.not_started
                const priorityConfig = VISA_PRIORITY_CONFIG[app.priority as VisaPriority] || VISA_PRIORITY_CONFIG.normal
                
                return (
                  <tr key={app.id} className="hover:bg-muted/50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">
                        {app.traveler_first_name} {app.traveler_last_name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        {app.traveler_nationality}
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        {app.traveler_passport_number || 'No Passport'}
                      </div>
                      <div className="text-xs text-teal-600 font-medium mt-1">
                        {app.booking_reference || 'No Booking'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground flex items-center gap-2">
                        {app.destination_country}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <span className="capitalize">{app.visa_type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 items-start">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border border-transparent"
                          style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color, borderColor: `${statusConfig.color}20` }}
                        >
                          {statusConfig.label}
                        </span>
                        {app.priority !== 'normal' && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                            style={{ backgroundColor: priorityConfig.bgColor, color: priorityConfig.color }}
                          >
                            {priorityConfig.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <span>Created:</span>
                          <span className="text-foreground font-medium">{new Date(app.created_at).toLocaleDateString()}</span>
                        </div>
                        {app.submission_date && (
                          <div className="flex items-center justify-between gap-4">
                            <span>Submitted:</span>
                            <span className="text-foreground font-medium">{new Date(app.submission_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {app.expected_decision_date && (
                          <div className="flex items-center justify-between gap-4">
                            <span>Expected:</span>
                            <span className="text-amber-600 font-medium">{new Date(app.expected_decision_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onView(app.id)}
                          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FileSearch className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(app.id)}
                          className="p-1.5 text-muted-foreground hover:text-slate-700 hover:bg-muted rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(app.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return null // Add cards view later if needed
}
