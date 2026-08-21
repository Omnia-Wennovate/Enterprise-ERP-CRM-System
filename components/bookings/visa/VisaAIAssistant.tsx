'use client'

import { useState } from 'react'
import { Sparkles, AlertTriangle, FileSearch, CheckCircle, Loader2, ShieldAlert, Info } from 'lucide-react'
import type { VisaAIResponse, VisaApplication } from '@/types/visa'

interface VisaAIAssistantProps {
  visa: VisaApplication
  nationality: string
  destination: string
}

export function VisaAIAssistant({ visa, nationality, destination }: VisaAIAssistantProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VisaAIResponse | null>(null)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const actions = [
    { id: 'probability', label: 'Estimate Approval', icon: CheckCircle, color: 'text-emerald-600', bg: 'hover:bg-emerald-50' },
    { id: 'checklist', label: 'Embassy Checklist', icon: FileSearch, color: 'text-omnia-gold', bg: 'hover:bg-omnia-gold/5' },
  ]

  const runAction = async (actionId: string) => {
    setLoading(true)
    setError(null)
    setActiveAction(actionId)
    try {
      if (actionId === 'probability') {
        const { estimateApprovalProbability } = await import('@/lib/services/visa-ai')
        const res = await estimateApprovalProbability(nationality, destination, visa.visa_type)
        setResult(res)
      } else if (actionId === 'checklist') {
        const { generateEmbassyChecklist } = await import('@/lib/services/visa-ai')
        const res = await generateEmbassyChecklist(nationality, destination, visa.purpose_of_travel || visa.visa_type)
        setResult(res)
      }
    } catch (err: any) {
      setError(err.message || 'AI assistant encountered an error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with guardrail notice */}
      <div className="flex items-start gap-3 p-3 bg-muted/50 border border-border rounded-xl">
        <ShieldAlert className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-slate-700">AI Assistant — Advisory Only</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            All AI outputs are suggestions for officer review. The AI does not auto-submit, change application status, or make final decisions. Officers must confirm all recommendations.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map(action => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              onClick={() => runAction(action.id)}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-3 border border-border rounded-xl text-sm font-medium text-slate-700 ${action.bg} transition-colors disabled:opacity-50`}
            >
              {loading && activeAction === action.id ? (
                <Loader2 className="w-4 h-4 animate-spin text-omnia-gold" />
              ) : (
                <Icon className={`w-4 h-4 ${action.color}`} />
              )}
              {action.label}
            </button>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="border border-border rounded-xl overflow-hidden">
          {/* AI Badge */}
          <div className="px-4 py-2 bg-gradient-to-r from-violet-50 to-omnia-gold/5 border-b border-border flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-bold text-violet-700">AI-Generated Content</span>
            <span className="text-[10px] text-muted-foreground ml-auto">Requires officer review</span>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="text-sm text-slate-700 whitespace-pre-wrap">{result.content}</div>

            {/* Confidence/Probability */}
            {result.confidence !== undefined && result.type === 'probability' && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">Estimated Probability</span>
                  <span className={`text-lg font-bold ${result.confidence >= 70 ? 'text-emerald-600' : result.confidence >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                    {result.confidence}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${result.confidence >= 70 ? 'bg-emerald-500' : result.confidence >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="px-4 py-3 bg-amber-50 border-t border-amber-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 font-medium">{result.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  )
}
