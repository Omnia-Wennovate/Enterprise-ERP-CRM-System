'use client'

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import type { InvoiceChartData } from '@/lib/services/invoice-dashboard'

const COLORS = ['#0d9488','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#6b7280','#ec4899','#14b8a6']

const STATUS_COLORS: Record<string,string> = {
  draft: '#64748b', sent: '#3b82f6', paid: '#0d9488',
  partially_paid: '#8b5cf6', overdue: '#ef4444', cancelled: '#9ca3af',
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const fmtK = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(0)}k` : `$${n}`

interface InvoiceChartsProps {
  chartData: InvoiceChartData | null
  loading?: boolean
  onChartClick?: (filter: Record<string,string>) => void
}

function ChartSkeleton({ h = 220 }: { h?: number }) {
  return <div className="animate-pulse rounded-xl bg-muted/50" style={{ height: h }}/>
}

function ChartCard({ title, children, loading }: { title: string; children: React.ReactNode; loading?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      {loading ? <ChartSkeleton/> : children}
    </div>
  )
}

export default function InvoiceCharts({ chartData, loading, onChartClick }: InvoiceChartsProps) {
  const handleBarClick = (filter: Record<string,string>) => {
    onChartClick?.(filter)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

      {/* Revenue Trend */}
      <div className="md:col-span-2 xl:col-span-2">
        <ChartCard title="📈 Revenue Trend" loading={loading}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData?.revenueByMonth ?? []}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis dataKey="month" tick={{ fontSize: 11 }}/>
              <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtK}/>
              <Tooltip formatter={(v) => [fmt(Number(v)), 'Revenue']}/>
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* By Status */}
      <ChartCard title="🔵 By Status" loading={loading}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData?.byStatus ?? []}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={(props) => {
                const pct = typeof props.percent === 'number' ? (props.percent * 100).toFixed(0) : '0'
                return `${pct}%`
              }}
              labelLine={false}
              onClick={(d: any) => handleBarClick({ status: d.status })}
              className="cursor-pointer"
            >
              {(chartData?.byStatus ?? []).map((e) => (
                <Cell key={e.status} fill={STATUS_COLORS[e.status] || '#64748b'}/>
              ))}
            </Pie>
            <Tooltip formatter={(v, name) => [v, String(name)]}/>
            <Legend/>
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Monthly Revenue vs Invoice Count */}
      <div className="md:col-span-2">
        <ChartCard title="📊 Monthly Revenue" loading={loading}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData?.revenueByMonth ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis dataKey="month" tick={{ fontSize: 11 }}/>
              <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtK}/>
              <Tooltip formatter={(v, name) => [name === 'revenue' ? fmt(Number(v)) : v, name === 'revenue' ? 'Revenue' : 'Invoices']}/>
              <Legend/>
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4,4,0,0]} name="Revenue"/>
              <Bar dataKey="invoices" fill="#0d9488" radius={[4,4,0,0]} name="Invoices"/>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* By Currency */}
      <ChartCard title="💱 By Currency" loading={loading}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData?.byCurrency ?? []}
              dataKey="amount"
              nameKey="currency"
              cx="50%"
              cy="50%"
              outerRadius={70}
              onClick={(d: any) => handleBarClick({ currency: d.currency })}
              className="cursor-pointer"
            >
              {(chartData?.byCurrency ?? []).map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]}/>
              ))}
            </Pie>
            <Tooltip formatter={(v) => [fmt(Number(v)), 'Amount']}/>
            <Legend/>
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Payment Methods */}
      <ChartCard title="💳 Payment Methods" loading={loading}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData?.paymentMethods ?? []} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={fmtK}/>
            <YAxis type="category" dataKey="method" tick={{ fontSize: 11 }} width={90}/>
            <Tooltip formatter={(v) => [fmt(Number(v)), 'Amount']}/>
            <Bar dataKey="amount" fill="#8b5cf6" radius={[0,4,4,0]}
              onClick={(d: any) => handleBarClick({ payment_method: String(d.method || '') })}
              className="cursor-pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Cash Flow */}
      <div className="md:col-span-2">
        <ChartCard title="💰 Cash Flow" loading={loading}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData?.cashFlow ?? []}>
              <defs>
                <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis dataKey="month" tick={{ fontSize: 11 }}/>
              <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtK}/>
              <Tooltip formatter={(v, name) => [fmt(Number(v)), name === 'inflow' ? 'Collected' : 'Outstanding']}/>
              <Legend/>
              <Area type="monotone" dataKey="inflow" stroke="#0d9488" fill="url(#inflowGrad)" strokeWidth={2} name="Collected"/>
              <Area type="monotone" dataKey="outstanding" stroke="#ef4444" fill="url(#outGrad)" strokeWidth={2} name="Outstanding"/>
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Aging */}
      <ChartCard title="⏱️ Invoice Aging" loading={loading}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData?.agingBuckets ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
            <XAxis dataKey="label" tick={{ fontSize: 10 }}/>
            <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtK}/>
            <Tooltip formatter={(v) => [fmt(Number(v)), 'Outstanding']}/>
            <Bar dataKey="totalAmount" radius={[4,4,0,0]}
              onClick={(d: any) => handleBarClick({ aging: d.bucket })}
              className="cursor-pointer"
            >
              {(chartData?.agingBuckets ?? []).map((e) => (
                <Cell key={e.bucket} fill={e.color}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

    </div>
  )
}
