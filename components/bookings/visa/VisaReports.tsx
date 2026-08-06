'use client'

import { useState } from 'react'
import { FileText, Download, Loader2, BarChart2, TrendingUp, Calendar, AlertTriangle, Clock } from 'lucide-react'

export function VisaReports() {
  const [loading, setLoading] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const reports = [
    { id: 'master', title: 'Master Visa Report', desc: 'All applications with full details and processing times', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'revenue', title: 'Revenue & Fees', desc: 'Financial breakdown of all visa processing fees', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'processing', title: 'Processing Times', desc: 'Average processing time by destination country', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'expiring', title: 'Expiring Visas', desc: 'Visas expiring within the next 90 days', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

  const handleGenerate = async (id: string, format: 'csv' | 'pdf') => {
    if (!dateFrom || !dateTo) {
      alert('Please select a date range')
      return
    }
    setLoading(true)
    try {
      if (id === 'master') {
        const { generateVisaReport } = await import('@/lib/services/visa-reports')
        const data = await generateVisaReport(dateFrom, dateTo)
        if (format === 'csv') downloadCSV(data, `visa_master_report_${dateFrom}_${dateTo}.csv`)
      } else if (id === 'revenue') {
        const { generateRevenueReport } = await import('@/lib/services/visa-reports')
        const { data } = await generateRevenueReport(dateFrom, dateTo)
        if (format === 'csv') downloadCSV(data, `visa_revenue_report_${dateFrom}_${dateTo}.csv`)
      } else {
        alert('Report generation for this type is not yet fully implemented in this demo.')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) { alert('No data found for this range'); return }
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-semibold text-slate-700">Date Range</span>
        </div>
        <input type="date" className="border-border rounded-lg text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <span className="text-muted-foreground">to</span>
        <input type="date" className="border-border rounded-lg text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map(report => {
          const Icon = report.icon
          return (
            <div key={report.id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-border transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex flex-shrink-0 items-center justify-center ${report.bg}`}>
                  <Icon className={`w-6 h-6 ${report.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-foreground">{report.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">{report.desc}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleGenerate(report.id, 'csv')} disabled={loading} className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted/50 flex items-center gap-1.5 disabled:opacity-50">
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} CSV
                    </button>
                    {/* PDF stub */}
                    <button onClick={() => alert('PDF generation requires a server-side PDF library (like Puppeteer or jsPDF) not implemented in this UI demo. Please use CSV.')} disabled={loading} className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted/50 flex items-center gap-1.5 disabled:opacity-50">
                      <FileText className="w-3.5 h-3.5" /> PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
