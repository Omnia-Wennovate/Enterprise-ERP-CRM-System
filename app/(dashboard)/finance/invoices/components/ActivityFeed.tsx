'use client'

import { motion } from 'framer-motion'
import { FileText, DollarSign, AlertTriangle, Send, CheckCircle, XCircle, RefreshCw, Bell } from 'lucide-react'
import type { ActivityItem } from '@/lib/services/invoice-dashboard'

interface ActivityFeedProps {
  activities: ActivityItem[]
  loading?: boolean
}

const TYPE_CONFIG: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  created:  { icon: FileText,     color: 'text-omnia-gold',    bg: 'bg-blue-100 dark:bg-blue-900/30' },
  sent:     { icon: Send,         color: 'text-indigo-600',  bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  paid:     { icon: CheckCircle,  color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  payment:  { icon: DollarSign,   color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  overdue:  { icon: AlertTriangle,color: 'text-red-600',     bg: 'bg-red-100 dark:bg-red-900/30' },
  refund:   { icon: RefreshCw,    color: 'text-amber-600',   bg: 'bg-amber-100 dark:bg-amber-900/30' },
  cancelled:{ icon: XCircle,      color: 'text-muted-foreground',    bg: 'bg-muted dark:bg-gray-800' },
  default:  { icon: Bell,         color: 'text-slate-600',   bg: 'bg-slate-100 dark:bg-slate-800' },
}

function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="h-5 w-28 bg-muted rounded animate-pulse mb-4"/>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-muted flex-shrink-0"/>
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-muted rounded w-3/4"/>
                <div className="h-2 bg-muted rounded w-16"/>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
          Activity Feed
        </h3>
        <span className="text-xs text-muted-foreground">{activities.length} events</span>
      </div>

      {activities.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No recent activity</div>
      ) : (
        <div className="divide-y divide-border/50 max-h-[420px] overflow-y-auto">
          {activities.map((item, i) => {
            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.default
            const Icon = cfg.icon

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={14} className={cfg.color}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-tight">{item.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{relativeTime(item.createdAt)}</span>
                    {item.invoiceNumber && (
                      <span className="text-xs font-mono text-muted-foreground/70">{item.invoiceNumber}</span>
                    )}
                  </div>
                </div>
                {item.amount !== undefined && (
                  <span className="text-xs font-semibold text-foreground flex-shrink-0">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(item.amount)}
                  </span>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
