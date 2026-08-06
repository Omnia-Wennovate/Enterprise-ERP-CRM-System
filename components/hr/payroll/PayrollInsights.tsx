'use client'

import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, AlertTriangle, Info, ArrowRight } from 'lucide-react'
import type { PayrollInsight } from '@/lib/services/payroll'

interface Props {
  insights: PayrollInsight[]
}

const CONFIG = {
  positive: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: TrendingUp,
    iconColor: 'text-emerald-500',
    dot: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    dot: 'bg-amber-500',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: Info,
    iconColor: 'text-blue-500',
    dot: 'bg-blue-500',
  },
}

export function PayrollInsights({ insights }: Props) {
  if (!insights || insights.length === 0) return null

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 relative overflow-hidden mb-6 border border-indigo-500/20 shadow-2xl">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-sm border border-indigo-500/30">
            <Sparkles className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI Payroll Insights</h3>
            <p className="text-xs text-indigo-200/60">Auto-generated intelligence for this period</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, i) => {
            const conf = CONFIG[insight.type]
            const Icon = conf.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`relative p-4 rounded-xl backdrop-blur-md border ${conf.border} bg-white/5 overflow-hidden group hover:bg-white/10 transition-colors`}
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${conf.dot}`} />
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${conf.bg} border ${conf.border} flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${conf.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-indigo-50 leading-relaxed pr-4">
                      {insight.message}
                    </p>
                  </div>
                </div>
                <ArrowRight className="absolute bottom-3 right-3 w-4 h-4 text-indigo-300/30 group-hover:text-indigo-300/60 transition-colors opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0" />
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
