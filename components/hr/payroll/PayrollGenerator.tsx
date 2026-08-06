'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, CheckCircle2, AlertTriangle, Loader2, Zap } from 'lucide-react'
import { actionGeneratePayroll } from '@/app/actions/payroll'

interface Props {
  month: number
  year: number
  hasExisting: boolean
  onSuccess: () => void
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export function PayrollGenerator({ month, year, hasExisting, onSuccess }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(month)
  const [selectedYear, setSelectedYear] = useState(year)
  const [force, setForce] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; count: number } | null>(null)

  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]

  const handleGenerate = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await actionGeneratePayroll(selectedMonth, selectedYear, force)
      setResult(res)
      if (res.success) {
        setForce(false)
        onSuccess()
      }
    } catch (e: any) {
      setResult({ success: false, message: e.message || 'Unknown error', count: 0 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <Zap className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <h2 className="font-bold text-foreground">Payroll Generator</h2>
          <p className="text-xs text-muted-foreground">Auto-compute salaries from real employee data</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        {/* Month select */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => { setSelectedMonth(Number(e.target.value)); setResult(null) }}
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>

        {/* Year select */}
        <div className="min-w-[120px]">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(Number(e.target.value)); setResult(null) }}
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Force toggle */}
        {hasExisting && (
          <div className="flex items-center gap-2 pb-0.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setForce((f) => !f)}
                className={`relative w-10 h-5 rounded-full transition-colors ${force ? 'bg-amber-500' : 'bg-muted'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${force ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-muted-foreground">Force Regenerate</span>
            </label>
          </div>
        )}

        {/* Generate button */}
        <motion.button
          onClick={handleGenerate}
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
          ) : hasExisting && !force ? (
            <><RotateCcw className="w-4 h-4" /> Regenerate</>
          ) : (
            <><Play className="w-4 h-4" /> Generate Payroll</>
          )}
        </motion.button>
      </div>

      {/* Result message */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mt-4 flex items-start gap-3 rounded-xl px-4 py-3 ${
              result.success
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            }`}
          >
            {result.success
              ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              : <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            }
            <div>
              <p className="text-sm font-semibold">{result.success ? 'Success' : 'Notice'}</p>
              <p className="text-xs opacity-80 mt-0.5">{result.message}</p>
              {result.success && !force && (
                <p className="text-xs opacity-60 mt-1">
                  To regenerate, enable the Force Regenerate toggle and click again.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
