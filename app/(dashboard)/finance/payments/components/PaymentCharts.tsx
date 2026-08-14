'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Maximize2, Minimize2 } from 'lucide-react'
import type { PaymentChartData, PaymentMethodReliability, CashFlowProjection } from '@/types/finance'

const COLORS = ['#0d9488', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4']
const STATUS_COLORS: Record<string, string> = {
  completed: '#0d9488',
  pending: '#f59e0b',
  failed: '#ef4444',
  refunded: '#8b5cf6',
}

const fmtCurrency = (v: number) => `ETB ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v)}`

interface PaymentChartsProps {
  chartData: PaymentChartData | null
  reliability: PaymentMethodReliability[]
  forecast: CashFlowProjection[]
  loading: boolean
  onDrillDown?: (filter: Record<string, string>) => void
}

function ChartCard({ title, children, subtitle }: { title: string; children: React.ReactNode; subtitle?: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      className={`rounded-xl border border-border/40 bg-card overflow-hidden ${
        expanded ? 'col-span-full' : ''
      }`}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
      <div className={`p-4 ${expanded ? 'h-[500px]' : 'h-[280px]'}`}>
        {children}
      </div>
    </motion.div>
  )
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-5 animate-pulse">
      <div className="h-4 w-32 bg-muted rounded mb-4" />
      <div className="h-[240px] bg-muted/50 rounded-lg" />
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border/60 rounded-lg shadow-xl px-3 py-2">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span style={{ color: entry.color }}>{entry.name}: </span>
          <span className="font-medium text-foreground">
            {typeof entry.value === 'number' ? fmtCurrency(entry.value) : entry.value}
          </span>
        </p>
      ))}
    </div>
  )
}

export default function PaymentCharts({ chartData, reliability, forecast, loading, onDrillDown }: PaymentChartsProps) {
  if (loading || !chartData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <ChartSkeleton key={i} />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Collection Trend */}
      <ChartCard title="Collection Trend" subtitle="Daily payment collections">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData.collectionTrend}>
            <defs>
              <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="amount" name="Collected" stroke="#0d9488" fill="url(#colorCollected)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2. Payments by Method (with reliability badges) */}
      <ChartCard title="Payments by Method" subtitle="Distribution & reliability">
        <div className="flex h-full">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.byMethod}
                  dataKey="amount"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  onClick={(entry) => onDrillDown?.({ paymentMethod: entry.method })}
                  cursor="pointer"
                >
                  {chartData.byMethod.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-40 flex flex-col justify-center gap-2 pr-2">
            {chartData.byMethod.map((m, i) => {
              const rel = reliability.find(r => r.method === m.method)
              return (
                <button
                  key={m.method}
                  onClick={() => onDrillDown?.({ paymentMethod: m.method })}
                  className="flex items-center gap-2 text-left hover:bg-muted/50 rounded-lg px-2 py-1 transition-colors"
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {m.method.replace('_', ' ')}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{m.count} payments</span>
                      {rel && rel.failureRate > 0 && (
                        <span className={`text-[10px] px-1 py-0.5 rounded-full font-medium ${
                          rel.reliabilityScore === 'excellent' ? 'bg-emerald-500/10 text-emerald-600' :
                          rel.reliabilityScore === 'good' ? 'bg-blue-500/10 text-blue-600' :
                          rel.reliabilityScore === 'fair' ? 'bg-amber-500/10 text-amber-600' :
                          'bg-red-500/10 text-red-600'
                        }`}>
                          {rel.failureRate.toFixed(1)}% fail
                        </span>
                      )}
                      {rel && rel.failureRate === 0 && (
                        <span className="text-[10px] px-1 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-600">
                          100% reliable
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </ChartCard>

      {/* 3. Payment Status */}
      <ChartCard title="Payment Status" subtitle="Distribution by status">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData.byStatus}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={3}
              onClick={(entry) => onDrillDown?.({ status: entry.status })}
              cursor="pointer"
            >
              {chartData.byStatus.map((entry, i) => (
                <Cell key={i} fill={STATUS_COLORS[entry.status] || COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => <span className="text-xs capitalize">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 4. Monthly Collection */}
      <ChartCard title="Monthly Collection" subtitle="Collected vs Outstanding">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData.monthlyCollection}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="collected" name="Collected" fill="#0d9488" radius={[4, 4, 0, 0]} />
            <Bar dataKey="outstanding" name="Outstanding" fill="#f59e0b" radius={[4, 4, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 5. Top Customers */}
      <ChartCard title="Top Customers" subtitle="By total payments">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData.topCustomers.slice(0, 8)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="customerName" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={100} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="totalPaid"
              name="Total Paid"
              fill="#0d9488"
              radius={[0, 4, 4, 0]}
              onClick={(entry) => onDrillDown?.({ customerId: entry.customerId })}
              cursor="pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 6. Payment Aging */}
      <ChartCard title="Payment Aging" subtitle="Outstanding by age">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData.agingBuckets}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalAmount" name="Outstanding" radius={[4, 4, 0, 0]}>
              {chartData.agingBuckets.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 7. Cash Flow Forecast (Section 33) */}
      {forecast.length > 0 && (
        <ChartCard title="Expected Collections Forecast" subtitle="Projection based on historical payment patterns, not a guarantee">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={({ active, payload, label }: any) => {
                if (!active || !payload?.length) return null
                const proj = forecast.find(f => f.period === label)
                return (
                  <div className="bg-card/95 backdrop-blur-sm border border-border/60 rounded-lg shadow-xl px-3 py-2">
                    <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      Expected: <span className="font-medium text-teal-600">{fmtCurrency(payload[0].value)}</span>
                    </p>
                    {proj && (
                      <p className="text-xs text-muted-foreground">
                        Confidence: <span className="font-medium">{proj.confidenceLevel}%</span>
                      </p>
                    )}
                  </div>
                )
              }} />
              <Bar dataKey="expectedAmount" name="Expected" fill="#0d9488" radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* 8. Top Agents */}
      {chartData.topAgents.length > 0 && (
        <ChartCard title="Top Sales Agents" subtitle="By collections recorded">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.topAgents.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="agentName" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="totalCollected" name="Collected" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}
