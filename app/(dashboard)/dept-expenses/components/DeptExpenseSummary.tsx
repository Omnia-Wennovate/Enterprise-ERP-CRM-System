'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Clock, CheckCircle, XCircle, TrendingUp, Lightbulb } from 'lucide-react'

interface DeptExpenseSummaryProps {
  department: string
  summary: {
    total: number
    total_amount: number
    pending: number
    approved: number
    approved_amount: number
    rejected: number
  }
  insight: string | null
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export function DeptExpenseSummary({ department, summary, insight }: DeptExpenseSummaryProps) {
  const cards = useMemo(() => [
    {
      label: 'Total Submitted',
      value: String(summary.total),
      sub: fmt(summary.total_amount),
      icon: <DollarSign size={18} />,
      color: 'from-[#0d3553] to-[#0d4568]',
      accent: 'text-[#E2CC7E]',
      id: 'dept-total',
    },
    {
      label: 'Pending Review',
      value: String(summary.pending),
      sub: 'Awaiting Finance',
      icon: <Clock size={18} />,
      color: 'from-amber-600 to-amber-700',
      accent: 'text-amber-200',
      id: 'dept-pending',
    },
    {
      label: 'Approved',
      value: String(summary.approved),
      sub: fmt(summary.approved_amount),
      icon: <CheckCircle size={18} />,
      color: 'from-emerald-600 to-emerald-700',
      accent: 'text-emerald-200',
      id: 'dept-approved',
    },
    {
      label: 'Rejected',
      value: String(summary.rejected),
      sub: 'Requires resubmission',
      icon: <XCircle size={18} />,
      color: 'from-red-600 to-red-700',
      accent: 'text-red-200',
      id: 'dept-rejected',
    },
  ], [summary])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.id}
            id={card.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 shadow-lg relative overflow-hidden`}
          >
            {/* Decorative circle */}
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/5" />
            <div className="relative z-10">
              <div className={`flex items-center gap-2 ${card.accent} mb-3`}>
                {card.icon}
                <span className="text-xs font-semibold uppercase tracking-wide opacity-80">{card.label}</span>
              </div>
              <p className="text-3xl font-bold text-white">{card.value}</p>
              <p className={`text-xs mt-1 ${card.accent} opacity-75`}>{card.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Spending Insight */}
      {insight && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="flex items-start gap-3 px-5 py-4 bg-[#E2CC7E]/10 border border-[#E2CC7E]/25 rounded-xl"
        >
          <Lightbulb size={16} className="text-[#E2CC7E] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80">{insight}</p>
        </motion.div>
      )}
    </div>
  )
}
