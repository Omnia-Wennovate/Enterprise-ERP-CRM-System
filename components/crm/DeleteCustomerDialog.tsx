'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Loader2, X, ArchiveIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { archiveCustomerAction } from '@/app/actions/crm'
import type { Customer } from '@/types'

interface DeleteCustomerDialogProps {
  isOpen: boolean
  customer: Customer | null
  onClose: () => void
  onSuccess: () => void
}

export function DeleteCustomerDialog({ isOpen, customer, onClose, onSuccess }: DeleteCustomerDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleArchive = async () => {
    if (!customer) return
    setIsDeleting(true)
    setError(null)

    try {
      const result = await archiveCustomerAction(customer.id)
      if (!result.success) {
        setError(result.error)
        return
      }
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to archive customer. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (isDeleting) return
    setError(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && customer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md mx-4 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-red-50/50">
              <div className="flex-1 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Archive Customer?</h3>
                  <p className="text-xs text-muted-foreground">This will hide the customer from active lists</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isDeleting}
                className="p-1.5 rounded-lg hover:bg-red-100 text-muted-foreground transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="bg-muted/40 rounded-xl p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Customer</p>
                <p className="font-bold text-foreground text-base">{customer.company_name}</p>
                <p className="text-sm text-muted-foreground">{customer.contact_name} · {customer.email}</p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <ArchiveIcon className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p>
                    This customer will be <strong className="text-foreground">archived</strong>, not permanently deleted.
                    All linked bookings, invoices, and quotations will remain intact.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p>
                    Archived customers are hidden from the active customer list but can be restored
                    by your system administrator.
                  </p>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
              <Button variant="outline" onClick={handleClose} disabled={isDeleting} className="px-5">
                Cancel
              </Button>
              <Button
                onClick={handleArchive}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white px-5 min-w-[130px]"
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Archiving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ArchiveIcon className="w-4 h-4" />
                    Archive Customer
                  </span>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
