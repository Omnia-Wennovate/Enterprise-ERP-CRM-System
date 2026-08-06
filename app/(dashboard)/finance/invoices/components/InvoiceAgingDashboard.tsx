'use client'

import { motion } from 'framer-motion'
import type { AgingBucket } from '@/lib/services/invoice-dashboard'

interface InvoiceAgingDashboardProps {
  buckets: AgingBucket[]
  loading?: boolean
  onBucketClick?: (bucket: string) => void
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export default function InvoiceAgingDashboard({ buckets, loading, onBucketClick }: InvoiceAgingDashboardProps) {
  const total = buckets.reduce((s, b) => s + b.totalAmount, 0) || 1

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse">
            <div className="h-3 bg-muted rounded w-16 mb-3"/>
            <div className="h-6 bg-muted rounded w-24 mb-2"/>
            <div className="h-2 bg-muted rounded w-full mb-2"/>
            <div className="h-3 bg-muted rounded w-12"/>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {buckets.map((bucket, i) => {
        const pct = (bucket.totalAmount / total) * 100

        return (
          <motion.div
            key={bucket.bucket}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onBucketClick?.(bucket.bucket)}
            className="bg-card border border-border rounded-2xl p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">{bucket.label}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: bucket.color + '20', color: bucket.color }}>
                {bucket.invoiceCount}
              </span>
            </div>

            <div className="text-xl font-bold text-foreground mb-2 tabular-nums group-hover:text-blue-600 transition-colors">
              {fmt(bucket.totalAmount)}
            </div>

            {/* Bar */}
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: i * 0.06 + 0.2 }}
                className="h-full rounded-full"
                style={{ background: bucket.color }}
              />
            </div>

            <div className="text-xs text-muted-foreground">
              {pct.toFixed(1)}% of total
            </div>

            <div className="mt-2 text-xs text-muted-foreground/60">
              {bucket.invoiceCount} invoice{bucket.invoiceCount !== 1 ? 's' : ''}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
