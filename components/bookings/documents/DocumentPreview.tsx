'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Download, Share2, Printer, History, Maximize2, RotateCw } from 'lucide-react'
import type { Document } from '@/types/documents'

export function DocumentPreview({ document, onClose }: { document: Document, onClose: () => void }) {
  const [rotation, setRotation] = useState(0)

  // In a real app this would use the access log service to log 'view'
  useEffect(() => {
    // logAccess(document.id, 'currentUser', 'view')
  }, [document.id])

  const handleDownload = () => {
    // logAccess(document.id, 'currentUser', 'download')
    window.open(document.file_url, '_blank')
  }

  const isImage = document.file_type === 'image' || document.file_mime?.startsWith('image/')
  const isPdf = document.file_type === 'pdf' || document.file_mime === 'application/pdf'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-sidebar/90 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-sidebar rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-slate-700"
      >
        <div className="px-4 py-3 bg-sidebar border-b border-slate-700 flex items-center justify-between text-primary-foreground">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-semibold">{document.document_name}</h3>
              <p className="text-xs text-muted-foreground">Version {document.version} • {(document.file_size_kb || 0) / 1024 > 1 ? ((document.file_size_kb || 0) / 1024).toFixed(2) + ' MB' : (document.file_size_kb || 0) + ' KB'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isImage && (
              <button onClick={() => setRotation(r => r + 90)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Rotate">
                <RotateCw className="w-4 h-4" />
              </button>
            )}
            <button onClick={handleDownload} className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Download">
              <Download className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Print">
              <Printer className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1"></div>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-primary-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
          {isImage ? (
            <img 
              src={document.file_url} 
              alt={document.document_name}
              style={{ transform: `rotate(${rotation}deg)` }}
              className="max-w-full max-h-full object-contain transition-transform duration-300"
            />
          ) : isPdf ? (
            <iframe 
              src={`${document.file_url}#toolbar=0`} 
              className="w-full h-full border-0 bg-card"
              title={document.document_name}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Preview not available for this file type.</p>
              <button onClick={handleDownload} className="mt-4 px-4 py-2 bg-indigo-600 text-primary-foreground rounded-lg text-sm font-medium hover:bg-indigo-700">
                Download to view
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
