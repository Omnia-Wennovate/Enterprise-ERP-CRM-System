'use client'

import React from 'react'
import { Sparkles, Check, AlertTriangle, X } from 'lucide-react'
import type { OCRFieldComparison, AIExtractedDocumentData } from '@/types/documents'

export function DocumentAIAssistant({ 
  extractedData,
  conflicts,
  onConfirmFields 
}: { 
  extractedData: AIExtractedDocumentData,
  conflicts: OCRFieldComparison[],
  onConfirmFields: (fields: OCRFieldComparison[]) => void
}) {
  
  if (!extractedData) return null

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-indigo-100 flex items-center justify-between bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-foreground text-sm">AI OCR Assistant</h3>
        </div>
        <div className="text-xs font-medium px-2 py-1 bg-card rounded-full text-indigo-700 border border-indigo-100 shadow-sm">
          Confidence: {extractedData.overallConfidence}%
        </div>
      </div>

      <div className="p-4 space-y-4">
        {extractedData.qualityIssues && extractedData.qualityIssues.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm flex items-start gap-2 text-amber-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Quality Issues Detected:</strong>
              <ul className="list-disc pl-4 mt-1">
                {extractedData.qualityIssues.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          </div>
        )}

        {conflicts.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Review AI extracted data against existing records:</p>
            
            <div className="bg-card rounded-lg border border-border overflow-hidden text-sm">
              <table className="w-full text-left">
                <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-medium">
                  <tr>
                    <th className="px-3 py-2">Field</th>
                    <th className="px-3 py-2">AI Read</th>
                    <th className="px-3 py-2">Existing</th>
                    <th className="px-3 py-2 w-10">Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {conflicts.map(c => (
                    <tr key={c.field} className={c.hasConflict ? 'bg-rose-50/30' : ''}>
                      <td className="px-3 py-2 font-medium text-slate-700">{c.label}</td>
                      <td className="px-3 py-2 text-foreground">{c.aiValue || '-'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{c.existingValue || '-'}</td>
                      <td className="px-3 py-2 text-center">
                        {c.hasConflict ? (
                          <X className="w-4 h-4 text-rose-500 mx-auto" />
                        ) : (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => onConfirmFields(conflicts)}
                className="px-3 py-1.5 text-xs font-medium text-primary-foreground bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Apply Confirmed Data
              </button>
            </div>
          </div>
        ) : (
           <div className="text-sm text-muted-foreground">
             Extracted data is consistent. No conflicts found.
           </div>
        )}
      </div>
    </div>
  )
}
