'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, FileText, Clock, CheckCircle, XCircle, CreditCard, Wallet, RotateCcw, BarChart2, Target, PieChartIcon, AlertTriangle, Landmark, ShieldCheck } from 'lucide-react'
import { ExpenseKPICard } from '@/components/finance/expenses/ExpenseKPICard'
import type { ExpenseKPIs, ExpenseChartData } from '@/types/finance'

const CHART_COLORS = ['#0d9488','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#10b981','#f97316','#06b6d4','#84cc16','#ec4899','#6366f1','#14b8a6']

const fmt = (n: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

const fmtNum = (n: number) => new Intl.NumberFormat('en-US').format(Math.round(n))

interface ExpenseDashboardProps {
  kpis: ExpenseKPIs
  chartData: ExpenseChartData
  onFilterChange?: (filter: Record<string, string>) => void
}

export function ExpenseDashboard({ kpis, chartData, onFilterChange }: ExpenseDashboardProps) {
  const utilizationColor = kpis.budget_utilization_percent >= 100 ? 'red'
    : kpis.budget_utilization_percent >= 90 ? 'amber'
    : kpis.budget_utilization_percent >= 75 ? 'amber'
    : 'green'

  const topDept = useMemo(() =>
    chartData.by_department.sort((a, b) => b.amount - a.amount)[0]?.department ?? '-',
    [chartData.by_department]
  )
  const topVendor = useMemo(() =>
    chartData.by_vendor.sort((a, b) => b.amount - a.amount)[0]?.vendor ?? '-',
    [chartData.by_vendor]
  )
  const topCategory = useMemo(() =>
    chartData.by_category.sort((a, b) => b.amount - a.amount)[0]?.category ?? '-',
    [chartData.by_category]
  )

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
        <ExpenseKPICard id="total-amount" label="Total Expenses" value={fmt(kpis.total_amount)} icon={<DollarSign size={18}/>} color="teal"
          breakdown={[{label:'This month',value:fmt(kpis.monthly_amount)},{label:'Today',value:fmt(kpis.today_amount)},{label:'Average',value:fmt(kpis.average_expense)}]}
          onViewFiltered={() => onFilterChange?.({})} />
        <ExpenseKPICard id="total-records" label="Total Records" value={fmtNum(kpis.total_records)} icon={<FileText size={18}/>} color="blue"
          breakdown={[{label:'Paid',value:fmtNum(kpis.paid)},{label:'Unpaid',value:fmtNum(kpis.unpaid)},{label:'Reimbursed',value:fmtNum(kpis.reimbursed)}]}/>
        <ExpenseKPICard id="monthly" label="This Month" value={fmt(kpis.monthly_amount)} icon={<BarChart2 size={18}/>} color="purple"
          onViewFiltered={() => onFilterChange?.({date_from: new Date().toISOString().slice(0,7)+'-01'})}/>
        <ExpenseKPICard id="today" label="Today" value={fmt(kpis.today_amount)} icon={<Clock size={18}/>} color="slate"
          onViewFiltered={() => onFilterChange?.({date_from: new Date().toISOString().split('T')[0]})}/>
        <ExpenseKPICard id="pending" label="Pending Approval" value={fmtNum(kpis.pending_approval)} icon={<Clock size={18}/>} color="amber"
          onViewFiltered={() => onFilterChange?.({approval_status:'pending'})}/>
        <ExpenseKPICard id="approved" label="Approved" value={fmtNum(kpis.approved)} icon={<CheckCircle size={18}/>} color="green"
          onViewFiltered={() => onFilterChange?.({approval_status:'approved'})}/>
        <ExpenseKPICard id="rejected" label="Rejected" value={fmtNum(kpis.rejected)} icon={<XCircle size={18}/>} color="red"
          onViewFiltered={() => onFilterChange?.({approval_status:'rejected'})}/>
        <ExpenseKPICard id="paid-count" label="Paid" value={fmtNum(kpis.paid)} icon={<CreditCard size={18}/>} color="teal"
          onViewFiltered={() => onFilterChange?.({status:'paid'})}/>
        <ExpenseKPICard id="unpaid" label="Unpaid" value={fmtNum(kpis.unpaid)} icon={<Wallet size={18}/>} color="red"
          onViewFiltered={() => onFilterChange?.({status:'unpaid'})}/>
        <ExpenseKPICard id="reimbursed" label="Reimbursed" value={fmtNum(kpis.reimbursed)} icon={<RotateCcw size={18}/>} color="blue"
          onViewFiltered={() => onFilterChange?.({status:'reimbursed'})}/>
        <ExpenseKPICard id="average" label="Average Expense" value={fmt(kpis.average_expense)} icon={<TrendingUp size={18}/>} color="slate"/>
        <ExpenseKPICard id="largest" label="Largest Expense" value={fmt(kpis.largest_expense)} icon={<TrendingDown size={18}/>} color="purple"/>
        <ExpenseKPICard id="budget-total" label="Total Budget" value={fmt(kpis.budget_total)} icon={<Target size={18}/>} color="blue"
          breakdown={[{label:'Spent',value:fmt(kpis.monthly_amount)},{label:'Remaining',value:fmt(kpis.budget_remaining)}]}/>
        <ExpenseKPICard id="budget-remaining" label="Budget Remaining" value={fmt(kpis.budget_remaining)} icon={<Landmark size={18}/>} color={kpis.budget_remaining < 0 ? 'red' : 'green'}/>
        <ExpenseKPICard id="utilization" label="Budget Utilization" value={`${kpis.budget_utilization_percent.toFixed(1)}%`}
          icon={<AlertTriangle size={18}/>} color={utilizationColor}
          breakdown={[{label:'Budget',value:fmt(kpis.budget_total)},{label:'Spent',value:fmt(kpis.monthly_amount)}]}/>
        <ExpenseKPICard id="tax" label="Tax Deductible" value={fmt(kpis.tax_deductible_amount)} icon={<ShieldCheck size={18}/>} color="green"/>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Top Department', value: topDept, icon: '🏢' },
          { label: 'Top Vendor', value: topVendor, icon: '🏪' },
          { label: 'Top Category', value: topCategory, icon: '📂' },
          { label: 'Avg Daily Spend', value: fmt(kpis.monthly_amount / 30), icon: '📅' },
        ].map((ins) => (
          <div key={ins.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">{ins.icon}</span>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{ins.label}</p>
              <p className="text-sm font-bold text-foreground truncate max-w-[120px]">{ins.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-teal-600"/>Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData.monthly}>
              <defs>
                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} tickFormatter={(v)=>`$${v>=1000?`${(v/1000).toFixed(0)}k`:v}`}/>
              <Tooltip formatter={(v) => [fmt(Number(v)), 'Amount']}/>
              <Area type="monotone" dataKey="amount" stroke="#0d9488" fill="url(#colorAmt)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* By Category */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><PieChartIcon size={16} className="text-blue-600"/>By Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={chartData.by_category} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80}
                label={(props) => {
                  const cat = props.name as string
                  const pct = typeof props.percent === 'number' ? (props.percent * 100).toFixed(0) : '0'
                  return `${cat} ${pct}%`
                }}
                labelLine={false}>
                {chartData.by_category.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]}/>)}
              </Pie>
              <Tooltip formatter={(v) => [fmt(Number(v)), 'Amount']}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Department */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-purple-600"/>By Department</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData.by_department} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis type="number" tick={{fontSize:11}} tickFormatter={(v)=>`$${v>=1000?`${(v/1000).toFixed(0)}k`:v}`}/>
              <YAxis type="category" dataKey="department" tick={{fontSize:11}} width={80}/>
              <Tooltip formatter={(v) => [fmt(Number(v)), 'Amount']}/>
              <Bar dataKey="amount" radius={[0,4,4,0]}>
                {chartData.by_department.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Budget vs Actual */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Target size={16} className="text-amber-600"/>Budget vs Actual</h3>
          {chartData.budget_vs_actual.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              No budget data configured yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData.budget_vs_actual}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="period" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:11}} tickFormatter={(v)=>`$${v>=1000?`${(v/1000).toFixed(0)}k`:v}`}/>
                <Tooltip formatter={(v) => [fmt(Number(v))]}/>
                <Legend/>
                <Bar dataKey="budget" fill="#3b82f6" radius={[4,4,0,0]} name="Budget"/>
                <Bar dataKey="actual" fill="#0d9488" radius={[4,4,0,0]} name="Actual"/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Vendor Top 10 */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-teal-600"/>Top 10 Vendors</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData.by_vendor.slice(0,10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis type="number" tick={{fontSize:11}} tickFormatter={(v)=>`$${v>=1000?`${(v/1000).toFixed(0)}k`:v}`}/>
              <YAxis type="category" dataKey="vendor" tick={{fontSize:10}} width={90}/>
              <Tooltip formatter={(v) => [fmt(Number(v)), 'Amount']}/>
              <Bar dataKey="amount" fill="#0d9488" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Payment Method */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><CreditCard size={16} className="text-blue-600"/>By Payment Method</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={chartData.by_payment_method} dataKey="amount" nameKey="method" cx="50%" cy="50%" outerRadius={80}>
                {chartData.by_payment_method.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
              </Pie>
              <Tooltip formatter={(v) => [fmt(Number(v)), 'Amount']}/>
              <Legend/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
