'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Printer, CheckCircle2, Clock } from 'lucide-react'
import type { PayrollRecord } from '@/lib/services/payroll'

interface Props {
  record: PayrollRecord | null
  onClose: () => void
}

function fmt(n: number) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
}

export function EmployeePayslipDrawer({ record, onClose }: Props) {
  if (!record) return null

  const emp = record.employee
  const status = STATUS_CONFIG[record.status] || STATUS_CONFIG.draft
  const StatusIcon = status.icon

  const handlePrint = () => {
    window.print()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ x: '100%', boxShadow: '0 0 0 rgba(0,0,0,0)' }}
          animate={{ x: 0, boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-2xl bg-background h-full overflow-y-auto border-l border-border flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-card sticky top-0 z-10">
            <div>
              <h2 className="text-xl font-bold text-foreground">Payslip Details</h2>
              <p className="text-sm text-muted-foreground">
                {emp?.first_name} {emp?.last_name} • {getMonthName(record.period_month)} {record.period_year}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handlePrint} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                <Printer className="w-5 h-5" />
              </button>
              <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                <Download className="w-5 h-5" />
              </button>
              <button onClick={onClose} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ml-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Payslip Content (Printable Area) */}
          <div className="p-8 flex-1 print:p-0 print:m-0" id="payslip-print-area">
            
            {/* Company Info */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-2xl font-black text-indigo-900 tracking-tight">OMNIA<span className="text-indigo-500">ERP</span></h1>
                <p className="text-sm text-muted-foreground mt-1">Enterprise HR & Payroll</p>
                <p className="text-xs text-muted-foreground">123 Business Avenue, Tech District</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-foreground uppercase tracking-widest text-slate-800">Payslip</h2>
                <p className="text-sm font-semibold text-indigo-600 mt-1">{getMonthName(record.period_month)} {record.period_year}</p>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mt-2 ${status.color}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
                </div>
              </div>
            </div>

            {/* Employee Info Grid */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-xl border border-slate-100 mb-8">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Employee Details</p>
                <p className="font-bold text-foreground text-lg">{emp?.first_name} {emp?.last_name}</p>
                <p className="text-sm text-slate-600 mt-0.5">{emp?.position}</p>
                <p className="text-xs text-slate-500 mt-1">{emp?.department}</p>
              </div>
              <div>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div className="text-slate-500">Employee ID:</div>
                  <div className="font-medium text-foreground text-right">{emp?.employee_id || '—'}</div>
                  
                  <div className="text-slate-500">Email:</div>
                  <div className="font-medium text-foreground text-right truncate">{emp?.email}</div>
                  
                  <div className="text-slate-500">Pay Date:</div>
                  <div className="font-medium text-foreground text-right">{record.paid_date ? new Date(record.paid_date).toLocaleDateString() : 'Pending'}</div>
                </div>
              </div>
            </div>

            {/* Earnings & Deductions */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Earnings */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-border pb-2 mb-3">Earnings</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-medium">{fmt(record.basic_salary)}</span>
                  </div>
                  {Number(record.allowances) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Allowances</span>
                      <span className="font-medium">{fmt(record.allowances)}</span>
                    </div>
                  )}
                  {Number(record.bonuses) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Performance Bonus</span>
                      <span className="font-medium">{fmt(record.bonuses)}</span>
                    </div>
                  )}
                  {Number(record.commission_amount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Commissions</span>
                      <span className="font-medium">{fmt(record.commission_amount)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-sm font-bold mt-4 pt-3 border-t border-border">
                  <span className="text-slate-800">Gross Earnings</span>
                  <span className="text-indigo-600">{fmt(Number(record.basic_salary) + Number(record.allowances) + Number(record.bonuses) + Number(record.commission_amount))}</span>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-border pb-2 mb-3">Deductions</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tax Withholding</span>
                    <span className="font-medium text-red-500">-{fmt(record.tax)}</span>
                  </div>
                  {Number(record.deductions) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Other Deductions</span>
                      <span className="font-medium text-red-500">-{fmt(record.deductions)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-sm font-bold mt-4 pt-3 border-t border-border">
                  <span className="text-slate-800">Total Deductions</span>
                  <span className="text-red-500">-{fmt(Number(record.tax) + Number(record.deductions))}</span>
                </div>
              </div>
            </div>

            {/* Net Pay */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex items-center justify-between mt-auto">
              <div>
                <p className="text-sm font-semibold text-indigo-900 mb-1">Net Pay (Take Home)</p>
                <p className="text-xs text-indigo-700/70">Amount transferred to bank account</p>
              </div>
              <div className="text-3xl font-black text-indigo-600 tracking-tight">
                {fmt(record.net_salary)}
              </div>
            </div>
            
            <div className="mt-8 text-center text-xs text-slate-400">
              <p>This is a computer generated document. No signature is required.</p>
              <p className="mt-1">Generated by Omnia ERP on {new Date().toLocaleDateString()}</p>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

function getMonthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleString('en-US', { month: 'long' })
}
