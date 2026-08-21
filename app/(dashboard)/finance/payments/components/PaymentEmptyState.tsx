'use client'

import { motion } from 'framer-motion'
import { Receipt, DollarSign } from 'lucide-react'

interface PaymentEmptyStateProps {
  onRecordPayment: () => void
}

export default function PaymentEmptyState({ onRecordPayment }: PaymentEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-20 px-8"
    >
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-omnia-gold/100/10 to-emerald-500/10 flex items-center justify-center">
          <Receipt className="w-12 h-12 text-omnia-gold/60" />
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="absolute -top-2 -right-2 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30"
        >
          <DollarSign className="w-5 h-5 text-white" />
        </motion.div>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">No payments recorded yet</h2>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-8 leading-relaxed">
        Record your first payment to start tracking collections and cash flow.
        All payment analytics, charts, and insights will appear automatically.
      </p>

      <button
        onClick={onRecordPayment}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-omnia-gold/100 to-emerald-500 text-sm font-semibold text-white hover:from-teal-400 hover:to-emerald-400 transition-all duration-200 shadow-lg shadow-teal-500/25"
      >
        <DollarSign className="w-4 h-4" />
        Record Payment
      </button>
    </motion.div>
  )
}
