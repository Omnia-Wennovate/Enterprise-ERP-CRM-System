'use client'

import { motion } from 'framer-motion'
import { History, Calendar, DollarSign, Users, CheckCircle2, FileText, ArrowRight } from 'lucide-react'

interface Props {
  history: { month: number; year: number; total: number; count: number; status: string }[]
  onSelectPeriod: (month: number, year: number) => void
  currentMonth: number
  currentYear: number
}

function getMonthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleString('en-US', { month: 'long' })
}

function fmt(n: number) {
  return `$${(n / 1000).toFixed(1)}K`
}

export function PayrollHistory({ history, onSelectPeriod, currentMonth, currentYear }: Props) {
  if (!history || history.length === 0) return null

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <span className="w-1 h-5 bg-omnia-gold/100 rounded-full" />
          Payroll History
        </h3>
        <History className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="divide-y divide-border">
        {history.map((record, i) => {
          const isCurrent = record.month === currentMonth && record.year === currentYear
          const statusColors = {
            paid: 'text-emerald-500 bg-emerald-500/10',
            approved: 'text-blue-500 bg-omnia-gold/50/10',
            draft: 'text-slate-500 bg-slate-500/10',
          }[record.status] || 'text-slate-500 bg-slate-500/10'

          return (
            <motion.div
              key={`${record.year}-${record.month}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              onClick={() => onSelectPeriod(record.month, record.year)}
              className={`p-4 flex items-center justify-between cursor-pointer transition-colors group ${
                isCurrent ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${isCurrent ? 'bg-indigo-100 text-indigo-600' : 'bg-muted text-muted-foreground'}`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`font-bold ${isCurrent ? 'text-indigo-900' : 'text-foreground'}`}>
                    {getMonthName(record.month)} {record.year}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {record.count} emp
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> {fmt(record.total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors}`}>
                  {record.status}
                </span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isCurrent ? 'bg-indigo-600 text-white shadow-md' : 'bg-background border border-border text-muted-foreground group-hover:border-indigo-500/30 group-hover:text-indigo-500'
                }`}>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
