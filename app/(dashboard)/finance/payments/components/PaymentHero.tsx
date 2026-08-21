'use client'

import { motion } from 'framer-motion'
import { DollarSign, Download, Plus, Calendar, TrendingUp, AlertCircle } from 'lucide-react'

interface PaymentHeroProps {
  greeting: string
  collectedThisMonth: number
  paymentCountThisMonth: number
  outstandingAmount: number
  periodLabel: string
  loading: boolean
  onRecordPayment: () => void
  onExport: () => void
}

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v)

export default function PaymentHero({
  greeting,
  collectedThisMonth,
  paymentCountThisMonth,
  outstandingAmount,
  periodLabel,
  loading,
  onRecordPayment,
  onExport,
}: PaymentHeroProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 text-white"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-omnia-gold/100/10 via-transparent to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-tr from-emerald-500/8 via-transparent to-transparent rounded-full blur-2xl" />

      <div className="relative z-10">
        {/* Top row: Title + Actions */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-omnia-gold/100/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Payments & Collections</h1>
              </div>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Monitor incoming payments, collections, outstanding balances, and cash flow.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={onRecordPayment}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-omnia-gold/100 to-emerald-500 text-sm font-semibold text-white hover:from-teal-400 hover:to-emerald-400 transition-all duration-200 shadow-lg shadow-teal-500/25"
            >
              <Plus className="w-4 h-4" />
              Record Payment
            </button>
          </div>
        </div>

        {/* Summary line */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
          <Calendar className="w-4 h-4" />
          <span>{today}</span>
          <span className="text-slate-600">•</span>
          <span className="text-teal-400 font-medium">{periodLabel}</span>
        </div>

        {/* Executive summary */}
        {loading ? (
          <div className="h-6 bg-white/5 rounded-lg w-3/4 animate-pulse" />
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-base md:text-lg text-slate-200 leading-relaxed"
          >
            <span className="text-white font-medium">{greeting}.</span>{' '}
            {paymentCountThisMonth > 0 ? (
              <>
                You collected{' '}
                <span className="text-teal-400 font-semibold">ETB {fmtCurrency(collectedThisMonth)}</span>{' '}
                this month across{' '}
                <span className="text-white font-medium">{paymentCountThisMonth} payment{paymentCountThisMonth !== 1 ? 's' : ''}</span>.{' '}
                {outstandingAmount > 0 && (
                  <>
                    <span className="text-amber-400 font-medium">ETB {fmtCurrency(outstandingAmount)}</span>{' '}
                    remains outstanding.
                  </>
                )}
              </>
            ) : (
              <span className="text-slate-400">No payments recorded this month yet.</span>
            )}
          </motion.p>
        )}

        {/* Quick stats badges */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-3 mt-5"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-omnia-gold/100/10 border border-omnia-gold/20 text-xs font-medium text-teal-300">
              <TrendingUp className="w-3 h-3" />
              ETB {fmtCurrency(collectedThisMonth)} collected
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-xs font-medium text-slate-300">
              <DollarSign className="w-3 h-3" />
              {paymentCountThisMonth} payments
            </div>
            {outstandingAmount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-300">
                <AlertCircle className="w-3 h-3" />
                ETB {fmtCurrency(outstandingAmount)} outstanding
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
