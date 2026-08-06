'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, FileText, BarChart2, Loader2 } from 'lucide-react'
import { generateExpenseReportAction, exportExpensesCSVAction } from '@/app/actions/finance'
import type { ReportType } from '@/lib/services/expense-reports'
import { buildPDFCoverPage } from '@/lib/utils/expense-pdf'

const REPORT_TYPES: Array<{ type: ReportType; label: string; desc: string; icon: string }> = [
  { type: 'monthly',     label: 'Monthly Summary',   desc: 'Breakdown by month with totals',         icon: '📅' },
  { type: 'department',  label: 'By Department',      desc: 'Spending per department',                 icon: '🏢' },
  { type: 'employee',    label: 'By Employee',        desc: 'Per-employee expense summary',            icon: '👤' },
  { type: 'vendor',      label: 'By Vendor',          desc: 'Spending by vendor/supplier',             icon: '🏪' },
  { type: 'category',    label: 'By Category',        desc: 'Category-level breakdown',                icon: '📂' },
  { type: 'tax',         label: 'Tax Report',         desc: 'All tax-deductible amounts',              icon: '🧾' },
  { type: 'booking',     label: 'By Booking',         desc: 'Expenses linked to bookings',             icon: '✈️' },
  { type: 'travel',      label: 'Travel Expenses',    desc: 'All travel-related costs',                icon: '🗺️' },
  { type: 'outstanding', label: 'Outstanding',        desc: 'Unpaid & pending reimbursements',         icon: '⏳' },
]

const DEPARTMENTS = ['','Finance','Operations','HR','Sales','Marketing','IT','Admin','Management']

export function ExpenseReports() {
  const [selected, setSelected] = useState<ReportType>('monthly')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [department, setDepartment] = useState('')
  const [generating, setGenerating] = useState(false)
  const [lastReport, setLastReport] = useState<{title:string;totalAmount:number;totalRecords:number;summary:string}|null>(null)

  const handleGenerate = async (exportFormat: 'csv' | 'pdf' | 'print') => {
    setGenerating(true)
    try {
      const report = await generateExpenseReportAction({
        reportType: selected,
        startDate: dateFrom || undefined,
        endDate: dateTo || undefined,
        department: department || undefined,
      })
      setLastReport({ title: report.title, totalAmount: report.totalAmount, totalRecords: report.totalRecords, summary: report.summary })

      if (exportFormat === 'csv') {
        const csv = await exportExpensesCSVAction(report.expenses)
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else if (exportFormat === 'pdf' || exportFormat === 'print') {
        const coverHtml = buildPDFCoverPage(report)
        const tableRows = report.expenses.slice(0, 200).map((e: Record<string, unknown>) =>
          `<tr><td>${(e.expense_number as string)??''}</td><td>${e.expense_date as string}</td><td>${(e.employee_name as string)??''}</td><td>${(e.department as string)??''}</td><td>${(e.vendor_name as string)??''}</td><td>${e.category as string}</td><td>${e.description as string}</td><td>$${(e.amount as number).toFixed(2)}</td><td>${(e.status as string)??''}</td></tr>`
        ).join('')
        const tableHtml = `<html><head><meta charset="utf-8"><style>
          body{font-family:'Segoe UI',sans-serif;font-size:11px;color:#1e293b;padding:30px}
          table{width:100%;border-collapse:collapse;margin-top:20px}
          th{background:#0f2340;color:white;padding:8px 10px;text-align:left;font-size:10px}
          td{padding:6px 10px;border-bottom:1px solid #e2e8f0}
          tr:nth-child(even){background:#f8fafc}
          h1{color:#0d9488;font-size:18px;margin-bottom:4px}
          p{color:#64748b;font-size:12px}
          </style></head><body>
          <h1>${report.title}</h1>
          <p>${report.summary}</p>
          <table>
            <thead><tr><th>#</th><th>Date</th><th>Employee</th><th>Dept</th><th>Vendor</th><th>Category</th><th>Description</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
          </body></html>`
        const win = window.open('', '_blank')
        if (win) {
          win.document.write(coverHtml + tableHtml)
          win.document.close()
          if (exportFormat === 'print') setTimeout(() => win.print(), 600)
        }
      }
    } catch (err) {
      alert(`Failed to generate report: ${err instanceof Error ? err.message : 'Error'}`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Report type selector */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Report Type</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {REPORT_TYPES.map(rt => (
            <button
              key={rt.type}
              onClick={() => setSelected(rt.type)}
              className={`p-4 rounded-xl border text-left transition-all hover:shadow-md ${
                selected === rt.type ? 'border-teal-400 bg-teal-50 shadow-sm' : 'border-border bg-card hover:border-teal-300'
              }`}
              id={`report-type-${rt.type}`}
            >
              <div className="text-2xl mb-1">{rt.icon}</div>
              <p className={`text-xs font-semibold ${selected === rt.type ? 'text-teal-700' : 'text-foreground'}`}>{rt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{rt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Report Filters</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Date From</label>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-teal-500"/>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Date To</label>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-teal-500"/>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Department</label>
            <select value={department} onChange={e=>setDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-teal-500">
              {DEPARTMENTS.map(d=><option key={d} value={d}>{d||'All Departments'}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-3">
        <button onClick={()=>handleGenerate('pdf')} disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
          id="export-pdf-btn">
          {generating ? <Loader2 size={14} className="animate-spin"/> : <FileText size={14}/>}
          Export PDF (with cover page)
        </button>
        <button onClick={()=>handleGenerate('csv')} disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
          id="export-csv-btn">
          {generating ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
          Export CSV / Excel
        </button>
        <button onClick={()=>handleGenerate('print')} disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 border border-border bg-card hover:bg-muted text-foreground rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
          id="print-report-btn">
          {generating ? <Loader2 size={14} className="animate-spin"/> : <BarChart2 size={14}/>}
          Print
        </button>
      </div>

      {/* Last generated report preview */}
      {lastReport && (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="text-4xl">📊</div>
            <div className="flex-1">
              <h3 className="font-bold text-teal-800 text-sm">{lastReport.title}</h3>
              <div className="flex gap-4 mt-2">
                <div>
                  <p className="text-xs text-teal-600">Total Amount</p>
                  <p className="font-bold text-teal-700">${lastReport.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-teal-600">Records</p>
                  <p className="font-bold text-teal-700">{lastReport.totalRecords}</p>
                </div>
              </div>
              <p className="text-xs text-teal-700 mt-2 leading-relaxed">{lastReport.summary}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
