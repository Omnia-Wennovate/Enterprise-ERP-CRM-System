'use client'

import { motion } from 'framer-motion'
import {
  DollarSign, Users, CheckCircle, Clock, FileText, ThumbsUp,
  TrendingUp, TrendingDown, Award, Percent, Calculator,
  BarChart2, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react'
import type { PayrollKPIs } from '@/lib/services/payroll'

interface Props {
  kpis: PayrollKPIs
}

function fmt(n: number, prefix = '$') {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K`
  return `${prefix}${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function fmtPct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

interface KPICard {
  label: string
  value: string
  icon: React.ElementType
  trend?: number
  sub?: string
  accent: string
  bg: string
}

function AnimatedCounter({ value, prefix = '$' }: { value: number; prefix?: string }) {
  return <span>{fmt(value, prefix)}</span>
}

export function PayrollKPIGrid({ kpis }: Props) {
  const cards: KPICard[] = [
    {
      label: 'Total Monthly Payroll',
      value: fmt(kpis.totalMonthlyPayroll),
      icon: DollarSign,
      trend: kpis.payrollGrowth,
      sub: `vs ${fmt(kpis.prevMonthPayroll)} last month`,
      accent: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Total Employees',
      value: kpis.totalEmployees.toString(),
      icon: Users,
      sub: 'Active on payroll',
      accent: 'text-blue-400',
      bg: 'bg-omnia-gold/50/10 border-blue-500/20',
    },
    {
      label: 'Employees Paid',
      value: kpis.employeesPaid.toString(),
      icon: CheckCircle,
      sub: `${kpis.totalEmployees > 0 ? Math.round((kpis.employeesPaid / kpis.totalEmployees) * 100) : 0}% completion`,
      accent: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Pending Payroll',
      value: kpis.pendingPayroll.toString(),
      icon: Clock,
      sub: 'Awaiting action',
      accent: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Draft Payroll',
      value: kpis.draftPayroll.toString(),
      icon: FileText,
      sub: 'Not yet approved',
      accent: 'text-slate-400',
      bg: 'bg-slate-500/10 border-slate-500/20',
    },
    {
      label: 'Approved Payroll',
      value: kpis.approvedPayroll.toString(),
      icon: ThumbsUp,
      sub: 'Ready for payment',
      accent: 'text-teal-400',
      bg: 'bg-omnia-gold/100/10 border-omnia-gold/20',
    },
    {
      label: 'Total Bonuses',
      value: fmt(kpis.bonusTotal),
      icon: Award,
      sub: 'Performance-based',
      accent: 'text-yellow-400',
      bg: 'bg-yellow-500/10 border-yellow-500/20',
    },
    {
      label: 'Total Allowances',
      value: fmt(kpis.allowancesTotal),
      icon: TrendingUp,
      sub: 'Fixed allowances',
      accent: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      label: 'Total Deductions',
      value: fmt(kpis.deductionsTotal),
      icon: TrendingDown,
      sub: 'Leave & penalties',
      accent: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
    },
    {
      label: 'Tax Withholdings',
      value: fmt(kpis.taxTotal),
      icon: Percent,
      sub: '15% effective rate',
      accent: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/20',
    },
    {
      label: 'Commission Cost',
      value: fmt(kpis.commissionCost),
      icon: BarChart2,
      sub: 'Sales commissions',
      accent: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
    },
    {
      label: 'Average Salary',
      value: fmt(kpis.averageSalary),
      icon: Calculator,
      sub: 'Per employee (net)',
      accent: 'text-pink-400',
      bg: 'bg-pink-500/10 border-pink-500/20',
    },
    {
      label: 'Highest Salary',
      value: fmt(kpis.highestSalary),
      icon: TrendingUp,
      sub: 'Top earner net',
      accent: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Lowest Salary',
      value: fmt(kpis.lowestSalary),
      icon: TrendingDown,
      sub: 'Minimum net salary',
      accent: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
    },
    {
      label: 'Net Payroll',
      value: fmt(kpis.netPayroll),
      icon: DollarSign,
      sub: 'After all deductions',
      accent: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Gross Payroll',
      value: fmt(kpis.grossPayroll),
      icon: DollarSign,
      sub: 'Before deductions',
      accent: 'text-blue-400',
      bg: 'bg-omnia-gold/50/10 border-blue-500/20',
    },
    {
      label: 'Payroll Growth',
      value: fmtPct(kpis.payrollGrowth),
      icon: kpis.payrollGrowth >= 0 ? ArrowUpRight : ArrowDownRight,
      sub: 'Month over month',
      accent: kpis.payrollGrowth >= 0 ? 'text-emerald-400' : 'text-red-400',
      bg: kpis.payrollGrowth >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20',
    },
  ]

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-indigo-500 rounded-full" />
        Executive KPIs
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            whileHover={{ y: -3, scale: 1.02 }}
            className={`border rounded-xl p-4 ${card.bg} cursor-default transition-shadow hover:shadow-lg hover:shadow-black/10`}
          >
            <div className="flex items-center justify-between mb-3">
              <card.icon className={`w-4 h-4 ${card.accent}`} />
              {card.trend !== undefined && (
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                  card.trend > 0 ? 'bg-emerald-500/20 text-emerald-400' :
                  card.trend < 0 ? 'bg-red-500/20 text-red-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {card.trend > 0 ? '+' : ''}{card.trend.toFixed(1)}%
                </span>
              )}
            </div>
            <p className={`text-2xl font-extrabold ${card.accent} leading-none mb-1`}>
              {card.value}
            </p>
            <p className="text-xs font-semibold text-foreground/70 mb-0.5">{card.label}</p>
            {card.sub && <p className="text-xs text-muted-foreground">{card.sub}</p>}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
