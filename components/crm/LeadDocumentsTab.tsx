'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Eye,
  Loader2,
  FileBadge,
  File,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getLeadDocuments, uploadLeadDocument, deleteLeadDocument } from '@/lib/services/lead-documents'
import { logDocumentUploaded } from '@/lib/services/lead-activities'
import type { LeadDocument } from '@/types/leads'

const CATEGORY_COLORS: Record<string, string> = {
  passport:  'bg-blue-100 text-blue-700',
  quotation: 'bg-purple-100 text-purple-700',
  contract:  'bg-green-100 text-green-700',
  invoice:   'bg-orange-100 text-orange-700',
  visa:      'bg-teal-100 text-teal-700',
  itinerary: 'bg-indigo-100 text-indigo-700',
  other:     'bg-gray-100 text-gray-700',
}

function formatFileSize(kb: number | null) {
  if (!kb) return 'Unknown size'
  if (kb < 1024) return `${kb} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

function getFileIcon(fileType: string) {
  if (fileType.includes('image')) return '🖼️'
  if (fileType.includes('pdf')) return '📄'
  if (fileType.includes('word') || fileType.includes('document')) return '📝'
  if (fileType.includes('excel') || fileType.includes('sheet')) return '📊'
  return '📎'
}

interface Props {
  leadId: string
  currentUserId?: string
  refreshTrigger?: number
  onDocumentUploaded?: () => void
}

export function LeadDocumentsTab({ leadId, currentUserId, refreshTrigger, onDocumentUploaded }: Props) {
  const [documents, setDocuments] = useState<LeadDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('other')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocs = async () => {
    setIsLoading(true)
    try {
      const docs = await getLeadDocuments(leadId)
      setDocuments(docs)
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchDocs() }, [leadId, refreshTrigger])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      await uploadLeadDocument({
        leadId,
        file,
        category: selectedCategory as import('@/types/leads').DocumentCategory,
        uploadedBy: currentUserId,
      })
      await logDocumentUploaded(leadId, file.name, currentUserId).catch(() => {})
      await fetchDocs()
      onDocumentUploaded?.()
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload failed. Make sure the "lead-documents" storage bucket exists in Supabase.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (doc: LeadDocument) => {
    if (!confirm(`Delete "${doc.file_name}"?`)) return
    setDeletingId(doc.id)
    try {
      await deleteLeadDocument(doc.id, doc.file_url)
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 hover:border-teal-300 transition-colors">
        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-card outline-none focus:border-teal-400"
          >
            {['passport', 'quotation', 'contract', 'invoice', 'visa', 'itinerary', 'other'].map((cat) => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept="*/*"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 text-xs"
          >
            {isUploading ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Document</>
            )}
          </Button>
        </div>
      </div>

      {/* Document list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <FileBadge className="w-10 h-10 mb-2 opacity-40" />
          <p className="text-sm">No documents uploaded yet</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-2">
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-3 p-3 bg-card border border-gray-200 rounded-xl hover:border-teal-200 hover:shadow-sm transition-all"
              >
                <div className="text-xl flex-shrink-0">{getFileIcon(doc.file_type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.file_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CATEGORY_COLORS[doc.document_category] || CATEGORY_COLORS.other}`}>
                      {doc.document_category}
                    </span>
                    <span className="text-[11px] text-gray-400">{formatFileSize(doc.file_size_kb)}</span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <a
                    href={doc.file_url}
                    download={doc.file_name}
                    className="p-1.5 rounded-lg hover:bg-teal-50 text-gray-400 hover:text-teal-600 transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
