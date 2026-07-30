'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, SlidersHorizontal, Plus, FileText, CheckCircle2, AlertTriangle, UserCheck, X } from 'lucide-react'
import type { VisaSearchParams, VisaStatus, VisaPriority, VisaType } from '@/types/visa'
import { VISA_STATUS_CONFIG, VISA_PRIORITY_CONFIG, VISA_TYPE_CONFIG } from '@/types/visa'

interface VisaSearchProps {
  onSearch: (params: Partial<VisaSearchParams>) => void
  initialParams?: Partial<VisaSearchParams>
}

export function VisaSearch({ onSearch, initialParams = {} }: VisaSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [params, setParams] = useState<Partial<VisaSearchParams>>(initialParams)

  // Debounced search for the main query input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(params)
    }, 300)
    return () => clearTimeout(timer)
  }, [params, onSearch])

  const handleParamChange = (key: keyof VisaSearchParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setParams({})
  }

  const quickFilters = [
    { label: 'Pending Docs', status: 'documents_collecting', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Under Review', status: 'under_review', icon: Search, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Approved', status: 'approved', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Docs Requested', status: 'additional_documents_requested', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-100' },
    { label: 'Interview Set', status: 'interview_scheduled', icon: UserCheck, color: 'text-orange-600', bg: 'bg-orange-100' },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
      {/* Top Search Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
            placeholder="Search by applicant name, passport, booking ref, or destination..."
            value={params.query || ''}
            onChange={(e) => handleParamChange('query', e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isExpanded || Object.keys(params).length > 1
                ? 'bg-slate-100 text-slate-900'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {Object.keys(params).filter(k => k !== 'query').length > 0 && (
              <span className="ml-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-teal-600 text-white rounded-full">
                {Object.keys(params).filter(k => k !== 'query').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-5 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Status
              </label>
              <select
                className="w-full border-slate-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                value={params.status || ''}
                onChange={(e) => handleParamChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                {Object.entries(VISA_STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Priority
              </label>
              <select
                className="w-full border-slate-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                value={params.priority || ''}
                onChange={(e) => handleParamChange('priority', e.target.value)}
              >
                <option value="">All Priorities</option>
                {Object.entries(VISA_PRIORITY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* Visa Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Visa Type
              </label>
              <select
                className="w-full border-slate-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                value={params.visaType || ''}
                onChange={(e) => handleParamChange('visaType', e.target.value)}
              >
                <option value="">All Types</option>
                {Object.entries(VISA_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="w-full border-slate-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                  value={params.dateFrom || ''}
                  onChange={(e) => handleParamChange('dateFrom', e.target.value)}
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  className="w-full border-slate-300 rounded-md shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                  value={params.dateTo || ''}
                  onChange={(e) => handleParamChange('dateTo', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-slate-500 hover:text-slate-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="px-4 py-3 bg-white flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2 flex items-center gap-1">
          <SlidersHorizontal className="w-3 h-3" /> Quick Views:
        </span>
        {quickFilters.map((qf) => {
          const Icon = qf.icon
          const isActive = params.status === qf.status
          return (
            <button
              key={qf.status}
              onClick={() => handleParamChange('status', isActive ? '' : qf.status)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                isActive
                  ? `${qf.bg} ${qf.color} border-transparent`
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? qf.color : 'text-slate-400'}`} />
              {qf.label}
              {isActive && <X className="w-3 h-3 ml-1" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
