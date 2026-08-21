'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileDown, Loader2 } from 'lucide-react'
import type { InvoiceKPIs, InvoiceHealthScore } from '@/lib/services/invoice-dashboard'
import { buildBoardReportPage, buildInvoiceCoverPage } from '@/lib/utils/expense-pdf'
import { generateBoardReportDataAction } from '@/app/actions/invoices'
import type { InvoiceWithRelations } from '@/lib/services/invoice-dashboard'

interface BoardReportButtonProps {
  kpis: InvoiceKPIs | null
  health: InvoiceHealthScore | null
  periodLabel: string
  invoices?: InvoiceWithRelations[]
}

export default function BoardReportButton({ kpis, health, periodLabel, invoices }: BoardReportButtonProps) {
  const [loadingBoard, setLoadingBoard] = useState(false)
  const [loadingPeriod, setLoadingPeriod] = useState(false)

  const generateBoardReport = async () => {
    if (!kpis || !health) return
    setLoadingBoard(true)
    try {
      const data = await generateBoardReportDataAction(kpis, health, periodLabel)
      const html = buildBoardReportPage(data)
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
        setTimeout(() => win.print(), 800)
      }
    } catch (e) {
      console.error('Board report error:', e)
    } finally {
      setLoadingBoard(false)
    }
  }

  const generatePeriodReport = async () => {
    if (!kpis) return
    setLoadingPeriod(true)
    try {
      const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
      const revChange = kpis.prevTotalRevenue > 0
        ? ((kpis.totalRevenue - kpis.prevTotalRevenue) / kpis.prevTotalRevenue) * 100
        : 0

      const summary = [
        `Revenue for ${periodLabel}: ${fmt(kpis.totalRevenue)}.`,
        revChange !== 0 ? `${revChange > 0 ? 'Up' : 'Down'} ${Math.abs(revChange).toFixed(1)}% ${kpis.compareLabel}.` : '',
        `Collection rate: ${kpis.collectionRate.toFixed(1)}%.`,
        `Outstanding balance: ${fmt(kpis.outstandingBalance)}.`,
        kpis.overdueCount > 0 ? `${kpis.overdueCount} overdue invoice${kpis.overdueCount !== 1 ? 's' : ''} require attention.` : 'No overdue invoices.',
      ].filter(Boolean).join(' ')

      const html = buildInvoiceCoverPage({
        title: `Invoice Period Report — ${periodLabel}`,
        period: periodLabel,
        generatedBy: 'System',
        generatedAt: new Date().toISOString(),
        summary,
        totalRevenue: kpis.totalRevenue,
        totalInvoices: kpis.totalInvoices,
        collectionRate: kpis.collectionRate,
        outstandingBalance: kpis.outstandingBalance,
        invoices: invoices ?? [],
      })

      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
        setTimeout(() => win.print(), 800)
      }
    } catch (e) {
      console.error('Period report error:', e)
    } finally {
      setLoadingPeriod(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={generatePeriodReport}
        disabled={!kpis || loadingPeriod}
        className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-omnia-gold border border-blue-200/50 dark:border-blue-800/50 rounded-xl text-sm font-medium hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingPeriod ? <Loader2 size={14} className="animate-spin"/> : <FileDown size={14}/>}
        Export Period PDF
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={generateBoardReport}
        disabled={!kpis || !health || loadingBoard}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingBoard ? <Loader2 size={14} className="animate-spin"/> : <FileDown size={14}/>}
        Board Report
      </motion.button>
    </div>
  )
}
