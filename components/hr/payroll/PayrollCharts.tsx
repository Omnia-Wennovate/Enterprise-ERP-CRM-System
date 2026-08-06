'use client'

import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line,
} from 'recharts'
import type { PayrollRecord } from '@/lib/services/payroll'

interface Props {
  records: PayrollRecord[]
  trend: { label: string; total: number; month: number; year: number }[]
  deptData: { department: string; headcount: number; totalPayroll: number; averageSalary: number }[]
}

const DEPT_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16']

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '12px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-indigo-500 rounded-full" />
        {title}
      </h3>
      {children}
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
      Generate payroll to see analytics
    </div>
  )
}

export function PayrollCharts({ records, trend, deptData }: Props) {
  // ── Cost breakdown ────────────────────────────────────────────────────────
  const breakdown = records.length > 0 ? [
    { name: 'Basic Salary', value: records.reduce((s, r) => s + Number(r.basic_salary), 0) },
    { name: 'Allowances', value: records.reduce((s, r) => s + Number(r.allowances), 0) },
    { name: 'Bonuses', value: records.reduce((s, r) => s + Number(r.bonuses), 0) },
    { name: 'Commissions', value: records.reduce((s, r) => s + Number(r.commission_amount), 0) },
    { name: 'Tax', value: records.reduce((s, r) => s + Number(r.tax), 0) },
    { name: 'Deductions', value: records.reduce((s, r) => s + Number(r.deductions), 0) },
  ].filter((d) => d.value > 0) : []

  // ── Salary distribution buckets ───────────────────────────────────────────
  const salaries = records.map((r) => Number(r.net_salary))
  const maxSal = Math.max(...salaries, 1)
  const bucketCount = 6
  const bucketSize = Math.ceil(maxSal / bucketCount) || 1
  const distribution = Array.from({ length: bucketCount }, (_, i) => {
    const lo = i * bucketSize
    const hi = lo + bucketSize
    return {
      range: `$${(lo / 1000).toFixed(0)}K–$${(hi / 1000).toFixed(0)}K`,
      count: salaries.filter((s) => s >= lo && s < hi).length,
    }
  }).filter((b) => b.count > 0)

  // ── Top 10 earners ────────────────────────────────────────────────────────
  const topEarners = [...records]
    .sort((a, b) => Number(b.net_salary) - Number(a.net_salary))
    .slice(0, 10)
    .map((r) => ({
      name: `${r.employee?.first_name || ''} ${(r.employee?.last_name || '').charAt(0)}.`.trim(),
      salary: Number(r.net_salary),
    }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Monthly Trend */}
      <Section title="Monthly Payroll Trend">
        {trend.every((t) => t.total === 0) ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={48} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Total']} />
              <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fill="url(#trendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* Payroll Cost Breakdown */}
      <Section title="Payroll Cost Breakdown">
        {breakdown.length === 0 ? <EmptyChart /> : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie
                  data={breakdown}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {breakdown.map((_, i) => (
                    <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {breakdown.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                  <span className="text-muted-foreground flex-1 truncate">{item.name}</span>
                  <span className="font-semibold text-foreground">${(item.value / 1000).toFixed(1)}K</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Department Payroll */}
      <Section title="Payroll by Department">
        {deptData.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis type="category" dataKey="department" width={80} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Payroll']} />
              <Bar dataKey="totalPayroll" radius={[0, 4, 4, 0]}>
                {deptData.map((_, i) => (
                  <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* Salary Distribution */}
      <Section title="Salary Distribution">
        {distribution.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={distribution} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="range" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={28} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, 'Employees']} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* Top Earners */}
      <Section title="Top Earners (Net Salary)">
        {topEarners.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topEarners} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={44} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Net Salary']} />
              <Bar dataKey="salary" radius={[4, 4, 0, 0]}>
                {topEarners.map((_, i) => <Cell key={i} fill={i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : '#6366f1'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* Status breakdown */}
      <Section title="Payroll Status Overview">
        {records.length === 0 ? <EmptyChart /> : (() => {
          const statusData = [
            { name: 'Draft', value: records.filter((r) => r.status === 'draft').length, color: '#64748b' },
            { name: 'Approved', value: records.filter((r) => r.status === 'approved').length, color: '#3b82f6' },
            { name: 'Paid', value: records.filter((r) => r.status === 'paid').length, color: '#10b981' },
          ].filter((s) => s.value > 0)
          return (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                    {statusData.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {statusData.map((s) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-muted-foreground flex-1">{s.name}</span>
                    <span className="text-sm font-bold text-foreground">{s.value}</span>
                    <span className="text-xs text-muted-foreground">({Math.round((s.value / records.length) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </Section>
    </div>
  )
}
