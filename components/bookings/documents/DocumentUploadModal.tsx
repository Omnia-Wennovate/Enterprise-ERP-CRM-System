'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, X, UploadCloud, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import type { DocumentType } from '@/types/documents'
import { DOCUMENT_TYPE_LABELS } from '@/types/documents'

export function DocumentUploadModal({ 
  isOpen, 
  onClose,
  bookingId,
  travelerId,
  onUploadComplete
}: { 
  isOpen: boolean, 
  onClose: () => void,
  bookingId?: string,
  travelerId?: string,
  onUploadComplete?: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<DocumentType | ''>('')
  const [uploading, setUploading] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file || !docType) return
    setUploading(true)
    try {
      // Stub for actual Supabase storage upload
      // 1. Upload to Supabase Storage
      const fileUrl = `https://mock.storage/${file.name}`
      
      // 2. Create document record
      const { createDocument } = await import('@/lib/services/documents')
      await createDocument({
        booking_id: bookingId || null,
        traveler_id: travelerId || null,
        document_type: docType as DocumentType,
        document_name: file.name,
        file_name: file.name,
        file_url: fileUrl,
        file_size_kb: Math.round(file.size / 1024),
        file_type: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'other',
        file_mime: file.type,
      })
      
      if (onUploadComplete) onUploadComplete()
      onClose()
    } catch (err) {
      console.error(err)
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sidebar/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-600" />
            Upload Document
          </h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Document Type *</label>
              <select 
                className="w-full border-border rounded-lg text-sm"
                value={docType}
                onChange={e => setDocType(e.target.value as DocumentType)}
              >
                <option value="">Select type...</option>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div 
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                file ? 'border-indigo-300 bg-indigo-50' : 'border-border hover:border-slate-400 bg-muted/50'
              }`}
            >
              {!file ? (
                <div className="flex flex-col items-center">
                  <UploadCloud className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-slate-700">Drag and drop file here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                  <input 
                    type="file" 
                    className="hidden" 
                    id="file-upload" 
                    onChange={e => e.target.files && setFile(e.target.files[0])}
                  />
                  <label htmlFor="file-upload" className="mt-4 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-slate-700 hover:bg-muted/50 cursor-pointer shadow-sm">
                    Select File
                  </label>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <p className="text-sm font-medium text-foreground truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button onClick={() => setFile(null)} className="mt-4 text-xs font-medium text-rose-600 hover:text-rose-700">
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-muted/50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-card border border-border rounded-lg hover:bg-muted/50">
            Cancel
          </button>
          <button 
            onClick={handleUpload}
            disabled={!file || !docType || uploading}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            Upload Document
          </button>
        </div>
      </motion.div>
    </div>
  )
}
