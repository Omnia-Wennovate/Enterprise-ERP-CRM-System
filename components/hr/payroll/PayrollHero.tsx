'use client'

import { motion } from 'framer-motion'
import { DollarSign, Users, Clock, Calendar } from 'lucide-react'

interface PayrollHeroProps {
  month: number
  year: number
  totalEmployees: number
  totalPayroll: number
  daysUntilClose: number
}

function getMonthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleString('en-US', { month: 'long' })
}

export function PayrollHero({ month, year, totalEmployees, totalPayroll, daysUntilClose }: PayrollHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl mb-8">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.3),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.2),transparent_60%)]" />

      {/* Animated orbs */}
      <motion.div
        className="absolute top-10 right-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-4 left-24 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <div className="relative px-8 py-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Left — Title */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <DollarSign className="w-6 h-6 text-indigo-300" />
              </div>
              <span className="text-indigo-300 font-semibold text-sm uppercase tracking-widest">
                Payroll Center
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-2 leading-tight">
              {getMonthName(month)} {year}
              <span className="block text-2xl font-light text-indigo-200 mt-1">
                Payroll Processing
              </span>
            </h1>
            <p className="text-indigo-200/80 text-sm max-w-md">
              Automated payroll computation powered by real-time employee data from all modules.
            </p>
          </motion.div>

          {/* Right — Stats */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {[
              {
                icon: Users,
                label: 'Employees',
                value: totalEmployees.toString(),
                color: 'from-blue-400/20 to-blue-600/20 border-blue-400/30',
                textColor: 'text-blue-200',
              },
              {
                icon: DollarSign,
                label: 'Total Payroll',
                value: `$${(totalPayroll / 1000).toFixed(1)}K`,
                color: 'from-emerald-400/20 to-emerald-600/20 border-emerald-400/30',
                textColor: 'text-emerald-200',
              },
              {
                icon: Clock,
                label: 'Closes In',
                value: `${daysUntilClose}d`,
                color: daysUntilClose <= 3 ? 'from-red-400/20 to-red-600/20 border-red-400/30' : 'from-amber-400/20 to-amber-600/20 border-amber-400/30',
                textColor: daysUntilClose <= 3 ? 'text-red-200' : 'text-amber-200',
              },
              {
                icon: Calendar,
                label: 'Period',
                value: `${getMonthName(month).slice(0, 3)} '${String(year).slice(2)}`,
                color: 'from-purple-400/20 to-purple-600/20 border-purple-400/30',
                textColor: 'text-purple-200',
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm border rounded-xl p-4`}
                whileHover={{ scale: 1.03, y: -2 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <stat.icon className={`w-5 h-5 ${stat.textColor} mb-2`} />
                <p className="text-white/60 text-xs font-medium">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.textColor} mt-0.5`}>{stat.value}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
