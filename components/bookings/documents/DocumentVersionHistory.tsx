'use client'

import React, { useState, useEffect } from 'react'
import { FileText, RotateCcw, Clock } from 'lucide-react'
import type { DocumentVersion } from '@/types/documents'

export function DocumentVersionHistory({ documentId }: { documentId: string }) {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadVersions = async () => {
      try {
        const { getVersions } = await import('@/lib/services/document-versions')
        const data = await getVersions(documentId)
        setVersions(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadVersions()
  }, [documentId])

  const handleRestore = async (versionId: string) => {
    if (!confirm('Are you sure you want to restore this version? This will create a new version based on this file.')) return
    try {
      const { restoreVersion } = await import('@/lib/services/document-versions')
      await restoreVersion(documentId, versionId, 'currentUserId') // stub
      // reload versions
      const { getVersions } = await import('@/lib/services/document-versions')
      setVersions(await getVersions(documentId))
    } catch (err) {
      console.error(err)
      alert('Failed to restore version')
    }
  }

  if (loading) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Loading versions...</div>
  }

  if (versions.length <= 1) {
    return (
      <div className="p-4 bg-muted/50 border border-border rounded-xl text-center">
        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No previous versions</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-foreground text-sm">Version History</h3>
      </div>
      <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
        {versions.map((v, idx) => (
          <div key={v.id} className="p-4 flex items-start justify-between hover:bg-muted/50 transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-foreground">v{v.version}</span>
                {idx === 0 && <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Current</span>}
              </div>
              <p className="text-xs text-muted-foreground">
                Uploaded by {v.uploaded_by_name || 'Unknown'} on {new Date(v.created_at).toLocaleDateString()}
              </p>
              {v.reason_for_change && (
                <p className="text-sm text-slate-700 mt-2 bg-muted p-2 rounded-lg italic">
                  "{v.reason_for_change}"
                </p>
              )}
            </div>
            {idx !== 0 && (
              <button 
                onClick={() => handleRestore(v.id)}
                className="p-2 text-muted-foreground hover:text-indigo-600 bg-card border border-border rounded-lg shadow-sm hover:border-indigo-200 transition-colors"
                title="Restore this version"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
