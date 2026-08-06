'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle, XCircle, Clock, Eye, Trash2, Download, AlertCircle } from 'lucide-react'
import type { VisaDocument, VisaDocumentType } from '@/types/visa'
import { DOCUMENT_TYPE_LABELS } from '@/types/visa'

interface VisaDocumentsProps {
  documents: VisaDocument[]
  requiredDocTypes: string[]
  onUpload: (doc: Partial<VisaDocument>) => Promise<void>
  onVerify: (id: string, status: 'verified' | 'rejected') => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const statusIcons = {
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Pending Review' },
  verified: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Verified' },
  rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Rejected' },
  expired: { icon: AlertCircle, color: 'text-gray-500', bg: 'bg-gray-50', label: 'Expired' },
}

export function VisaDocuments({ documents, requiredDocTypes, onUpload, onVerify, onDelete }: VisaDocumentsProps) {
  const [uploading, setUploading] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('passport')
  const [dragOver, setDragOver] = useState(false)

  const uploadedTypes = new Set(documents.map(d => d.document_type))
  const missingTypes = requiredDocTypes.filter(t => !uploadedTypes.has(t as any))

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await onUpload({
        document_type: selectedType as VisaDocumentType,
        file_name: file.name,
        file_url: URL.createObjectURL(file),
        file_size_kb: Math.round(file.size / 1024),
        is_required: requiredDocTypes.includes(selectedType),
      })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Missing Documents Alert */}
      {missingTypes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h4 className="text-sm font-bold text-amber-800">Missing Required Documents ({missingTypes.length})</h4>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {missingTypes.map(type => (
              <span key={type} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                {DOCUMENT_TYPE_LABELS[type as VisaDocumentType] || type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          dragOver ? 'border-teal-400 bg-teal-50' : 'border-border bg-muted/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false) }}
      >
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <div className="flex items-center justify-center gap-3 mb-3">
          <select
            className="border-border rounded-lg text-sm focus:border-teal-500 focus:ring-teal-500"
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
          >
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <label className="px-4 py-2 bg-teal-600 text-primary-foreground text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors cursor-pointer">
            {uploading ? 'Uploading...' : 'Choose File'}
            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileSelect} disabled={uploading} />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">PDF, JPG, PNG, DOC up to 10MB</p>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
          </div>
        ) : (
          documents.map(doc => {
            const st = statusIcons[doc.verification_status as keyof typeof statusIcons] || statusIcons.pending
            const StatusIcon = st.icon
            return (
              <div key={doc.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-border transition-colors group">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${st.bg}`}>
                  <FileText className={`w-5 h-5 ${st.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{doc.file_name}</p>
                    {doc.is_required && <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">REQUIRED</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">{DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-xs text-muted-foreground">{doc.file_size_kb ? `${doc.file_size_kb} KB` : ''}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${st.color}`}>
                      <StatusIcon className="w-3 h-3" /> {st.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {doc.verification_status === 'pending' && (
                    <>
                      <button onClick={() => onVerify(doc.id, 'verified')} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg" title="Verify">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => onVerify(doc.id, 'rejected')} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Reject">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button onClick={() => onDelete(doc.id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
