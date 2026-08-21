'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, Plus, ArrowRight, BookOpen } from 'lucide-react'

interface EmptyStateProps {
  filtered?: boolean
  onClearFilters?: () => void
}

export default function EmptyState({ filtered, onClearFilters }: EmptyStateProps) {
  if (filtered) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 px-8 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
          <FileText size={28} className="text-muted-foreground"/>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No invoices match your filters</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Try adjusting your search terms or filters to find what you&apos;re looking for.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/80 transition-colors"
          >
            Clear all filters
          </button>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 px-8 text-center"
    >
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-blue-500/10 to-blue-600/20 flex items-center justify-center border border-blue-200/40 dark:border-blue-800/40">
          <FileText size={48} className="text-blue-500"/>
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center shadow-lg">
          <Plus size={14} className="text-white"/>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-3">No invoices yet</h2>
      <p className="text-muted-foreground mb-8 max-w-sm text-sm leading-relaxed">
        Create your first invoice to begin tracking revenue, managing payments, and generating financial reports for your business.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/finance/invoices/new"
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/80 transition-all hover:shadow-lg hover:shadow-blue-500/25 text-sm"
        >
          <Plus size={16}/>
          Create Invoice
        </Link>
        <Link
          href="/finance/invoices/new"
          className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground rounded-xl font-medium hover:bg-muted transition-colors text-sm"
        >
          <BookOpen size={15}/>
          Quick Guide
          <ArrowRight size={13} className="text-muted-foreground"/>
        </Link>
      </div>

      {/* Quick steps */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg w-full text-left">
        {[
          { step: '1', title: 'Create Invoice', desc: 'Add line items, customer, and due date' },
          { step: '2', title: 'Send to Client', desc: 'Send via email or share a link' },
          { step: '3', title: 'Track Payments', desc: 'Record payments and manage overdue' },
        ].map(s => (
          <div key={s.step} className="bg-muted/40 rounded-xl p-4 border border-border/50">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-omnia-gold text-xs font-bold flex items-center justify-center mb-2">{s.step}</div>
            <div className="text-sm font-semibold text-foreground mb-1">{s.title}</div>
            <div className="text-xs text-muted-foreground">{s.desc}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
