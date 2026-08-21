'use client'

import { motion } from 'framer-motion'
import { Lightbulb } from 'lucide-react'

interface SmartCollectionSummaryProps {
  summary: string
  loading: boolean
}

export default function SmartCollectionSummary({ summary, loading }: SmartCollectionSummaryProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border/40 bg-card p-5 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-muted rounded-lg" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!summary) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-xl border border-border/40 bg-gradient-to-r from-omnia-gold/100/5 via-card to-card p-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-omnia-gold/100/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-4.5 h-4.5 text-omnia-gold" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Collection Insights</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
        </div>
      </div>
    </motion.div>
  )
}
