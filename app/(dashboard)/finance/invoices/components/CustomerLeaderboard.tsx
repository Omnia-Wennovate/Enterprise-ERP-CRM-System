'use client'

import { motion } from 'framer-motion'
import type { CustomerLeaderboardEntry } from '@/lib/services/invoice-dashboard'
import { Trophy, TrendingUp } from 'lucide-react'

interface CustomerLeaderboardProps {
  customers: CustomerLeaderboardEntry[]
  loading?: boolean
  onCustomerClick?: (customerId: string) => void
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const MEDALS = ['🥇', '🥈', '🥉']

export default function CustomerLeaderboard({ customers, loading, onCustomerClick }: CustomerLeaderboardProps) {
  const maxRevenue = customers[0]?.totalRevenue || 1

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl">
        <div className="p-5 border-b border-border">
          <div className="h-5 w-40 bg-muted rounded animate-pulse"/>
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-3 animate-pulse flex items-center gap-4">
              <div className="w-6 h-4 bg-muted rounded"/>
              <div className="flex-1 h-4 bg-muted rounded"/>
              <div className="w-20 h-4 bg-muted rounded"/>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 p-5 border-b border-border">
        <Trophy size={16} className="text-amber-500"/>
        <h3 className="text-sm font-semibold text-foreground">Customer Leaderboard</h3>
        <span className="text-xs text-muted-foreground ml-auto">{customers.length} customers</span>
      </div>

      {customers.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No customer data</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                {['#', 'Customer', 'Revenue', 'Invoices', 'Avg. Pay Days', 'Outstanding', 'Collection %'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {customers.map((c, i) => {
                const revPct = (c.totalRevenue / maxRevenue) * 100
                return (
                  <motion.tr
                    key={c.customerId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => onCustomerClick?.(c.customerId)}
                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3 text-sm font-medium">
                      {i < 3 ? MEDALS[i] : <span className="text-muted-foreground text-xs">{i + 1}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-600">
                          {c.customerName[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground group-hover:text-blue-600 transition-colors">{c.customerName || c.customerId}</div>
                          <div className="text-xs text-muted-foreground">{c.invoiceCount} invoices</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-bold text-foreground">{fmt(c.totalRevenue)}</div>
                      <div className="w-full h-1 bg-muted rounded-full mt-1 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${revPct}%` }}
                          transition={{ duration: 0.6, delay: i * 0.04 + 0.2 }}
                          className="h-full bg-blue-500 rounded-full"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{c.invoiceCount}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${c.avgPaymentDays > 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {c.avgPaymentDays}d
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{fmt(c.outstanding)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${c.collectionRate}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${c.collectionRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {c.collectionRate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
