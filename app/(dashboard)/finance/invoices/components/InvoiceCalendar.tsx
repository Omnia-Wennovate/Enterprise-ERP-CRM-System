'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { InvoiceWithRelations } from '@/lib/services/invoice-dashboard'

interface InvoiceCalendarProps {
  invoices: InvoiceWithRelations[]
  onDayClick?: (date: string) => void
}

const STATUS_DOT: Record<string, string> = {
  paid: 'bg-emerald-500',
  sent: 'bg-omnia-gold/50',
  partially_paid: 'bg-purple-500',
  overdue: 'bg-red-500',
  draft: 'bg-slate-400',
  cancelled: 'bg-gray-300',
}

export default function InvoiceCalendar({ invoices, onDayClick }: InvoiceCalendarProps) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Build a map of date → [invoices]
  const dayMap = useMemo(() => {
    const map: Record<string, InvoiceWithRelations[]> = {}
    for (const inv of invoices) {
      // Due date entries
      if (inv.due_date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
        if (!map[inv.due_date]) map[inv.due_date] = []
        map[inv.due_date].push(inv)
      }
    }
    return map
  }, [invoices, year, month])

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const fmtDate = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const cells: (number | null)[] = [
    ...Array(firstDay === 0 ? 6 : firstDay - 1).fill(null), // offset for Mon-start
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  const todayStr = today.toISOString().split('T')[0]

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft size={14} className="text-muted-foreground"/>
          </button>
          <button
            onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="px-2 py-1 text-xs rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            Today
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight size={14} className="text-muted-foreground"/>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-border/50">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="h-16 bg-muted/10"/>

          const dateStr = fmtDate(day)
          const dayInvoices = dayMap[dateStr] || []
          const isToday = dateStr === todayStr
          const hasOverdue = dayInvoices.some(inv => inv.status === 'overdue')
          const isPast = new Date(dateStr) < today && !isToday

          return (
            <motion.button
              key={dateStr}
              whileHover={{ backgroundColor: 'hsl(var(--muted))' }}
              onClick={() => dayInvoices.length > 0 && onDayClick?.(dateStr)}
              className={`h-16 p-1.5 text-left transition-colors relative ${
                dayInvoices.length > 0 ? 'cursor-pointer' : 'cursor-default'
              } ${isToday ? 'bg-omnia-gold/5/60 dark:bg-blue-900/20' : ''}`}
            >
              <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                isToday ? 'bg-primary text-white' : isPast ? 'text-muted-foreground/60' : 'text-foreground'
              }`}>
                {day}
              </div>

              {/* Invoice dots */}
              {dayInvoices.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {dayInvoices.slice(0, 3).map((inv, j) => (
                    <span
                      key={j}
                      className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[inv.status] || 'bg-slate-400'}`}
                      title={`${inv.invoice_number} — ${inv.status}`}
                    />
                  ))}
                  {dayInvoices.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{dayInvoices.length - 3}</span>
                  )}
                </div>
              )}

              {hasOverdue && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"/>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-5 py-3 border-t border-border bg-muted/20">
        {[
          { color: 'bg-emerald-500', label: 'Paid' },
          { color: 'bg-omnia-gold/50', label: 'Sent' },
          { color: 'bg-red-500', label: 'Overdue' },
          { color: 'bg-purple-500', label: 'Partial' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${item.color}`}/>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}
