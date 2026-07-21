'use client'

import { AlertTriangle, CheckCircle2, Info, XCircle, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import type { AIQualityCheckResult, AIQualityIssue } from '@/types/ai-itinerary'

interface AIQualityCheckPanelProps {
  qualityCheck: AIQualityCheckResult
  onDismiss?: () => void
}

export function AIQualityCheckPanel({ qualityCheck, onDismiss }: AIQualityCheckPanelProps) {
  const errorCount = qualityCheck.issues.filter(i => i.severity === 'error').length
  const warningCount = qualityCheck.issues.filter(i => i.severity === 'warning').length
  const infoCount = qualityCheck.issues.filter(i => i.severity === 'info').length

  const scoreColor = qualityCheck.score >= 80
    ? 'text-emerald-600'
    : qualityCheck.score >= 60
      ? 'text-amber-600'
      : 'text-red-600'

  const scoreBg = qualityCheck.score >= 80
    ? 'from-emerald-500 to-teal-500'
    : qualityCheck.score >= 60
      ? 'from-amber-500 to-orange-500'
      : 'from-red-500 to-rose-500'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-teal-600" />
          <div>
            <h4 className="text-sm font-bold text-slate-800">AI Quality Check</h4>
            <p className="text-[10px] text-slate-500">
              {qualityCheck.issues.length} issue{qualityCheck.issues.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Score Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r ${scoreBg} rounded-full`}>
            <span className="text-xs font-bold text-white">{qualityCheck.score}/100</span>
          </div>

          {/* Status */}
          {qualityCheck.passed ? (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-semibold border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> Passed
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-[10px] font-semibold border border-red-200">
              <XCircle className="w-3 h-3" /> Needs Review
            </span>
          )}
        </div>
      </div>

      {/* Summary Badges */}
      <div className="flex gap-2 px-5 py-3 bg-slate-50/50">
        {errorCount > 0 && (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-lg text-[10px] font-semibold border border-red-200">
            <XCircle className="w-3 h-3" /> {errorCount} Error{errorCount > 1 ? 's' : ''}
          </span>
        )}
        {warningCount > 0 && (
          <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-semibold border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> {warningCount} Warning{warningCount > 1 ? 's' : ''}
          </span>
        )}
        {infoCount > 0 && (
          <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-semibold border border-blue-200">
            <Info className="w-3 h-3" /> {infoCount} Info
          </span>
        )}
        {qualityCheck.issues.length === 0 && (
          <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-semibold border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> No issues found
          </span>
        )}
      </div>

      {/* Issues List */}
      {qualityCheck.issues.length > 0 && (
        <div className="px-5 py-3 space-y-2 max-h-[300px] overflow-y-auto">
          {qualityCheck.issues.map((issue, i) => (
            <IssueRow key={i} issue={issue} />
          ))}
        </div>
      )}
    </motion.div>
  )
}

function IssueRow({ issue }: { issue: AIQualityIssue }) {
  const config = {
    error: {
      icon: XCircle,
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      iconColor: 'text-red-500',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      iconColor: 'text-amber-500',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      iconColor: 'text-blue-500',
    },
  }[issue.severity]

  const Icon = config.icon

  return (
    <div className={`flex gap-3 p-3 rounded-lg border ${config.bg} ${config.border}`}>
      <Icon className={`w-4 h-4 ${config.iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium ${config.text}`}>{issue.message}</p>
        {issue.dayNumber && (
          <p className="text-[10px] text-slate-500 mt-0.5">
            Day {issue.dayNumber}{issue.itemTitle ? ` — ${issue.itemTitle}` : ''}
          </p>
        )}
        {issue.suggestion && (
          <p className="text-[10px] text-slate-600 mt-1 italic">
            💡 {issue.suggestion}
          </p>
        )}
      </div>
    </div>
  )
}
