'use client'

import { motion } from 'framer-motion'
import { Users, DollarSign, Award, ArrowUpRight } from 'lucide-react'
import type { DepartmentPayroll as DeptPayrollType } from '@/lib/services/payroll'

interface Props {
  data: DeptPayrollType[]
}

function fmt(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export function DepartmentPayroll({ data }: Props) {
  if (!data || data.length === 0) return null

  // Find max payroll to scale the progress bars
  const maxPayroll = Math.max(...data.map(d => d.totalPayroll), 1)

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
      <div className="p-5 border-b border-border">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <span className="w-1 h-5 bg-purple-500 rounded-full" />
          Department Breakdown
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Department</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Headcount</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Total Cost</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Avg Salary</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Bonuses</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Top Earner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((dept, i) => (
              <motion.tr 
                key={dept.department}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="hover:bg-muted/20 transition-colors group"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 font-bold text-xs">
                      {dept.department.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-semibold text-foreground">{dept.department}</span>
                  </div>
                </td>
                
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5 text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span className="font-medium">{dept.headcount}</span>
                  </div>
                </td>
                
                <td className="px-5 py-4 w-64">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground w-16">{fmt(dept.totalPayroll)}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(dept.totalPayroll / maxPayroll) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                      />
                    </div>
                  </div>
                </td>
                
                <td className="px-5 py-4 text-right text-muted-foreground font-mono text-xs">
                  {fmt(dept.averageSalary)}
                </td>
                
                <td className="px-5 py-4 text-right text-yellow-500 font-mono text-xs">
                  {dept.totalBonuses > 0 ? fmt(dept.totalBonuses) : '—'}
                </td>
                
                <td className="px-5 py-4 text-right">
                  <div className="text-xs font-semibold text-foreground">{dept.topEarner}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center justify-end gap-1 mt-0.5">
                    <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                    {fmt(dept.topEarnerSalary)}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
