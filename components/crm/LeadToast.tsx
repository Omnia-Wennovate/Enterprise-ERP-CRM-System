'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  isVisible: boolean
  onDismiss: () => void
}

export function LeadToast({ message, type, isVisible, onDismiss }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onDismiss, 4000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onDismiss])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-[100] max-w-sm"
        >
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border backdrop-blur-sm ${
              type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            )}
            <p className="text-sm font-medium flex-1">{message}</p>
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg hover:bg-black/5 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook for easy toast management
export function useToast() {
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
    isVisible: boolean
  }>({
    message: '',
    type: 'success',
    isVisible: false,
  })

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, isVisible: true })
  }

  const dismissToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }))
  }

  return { toast, showToast, dismissToast }
}
