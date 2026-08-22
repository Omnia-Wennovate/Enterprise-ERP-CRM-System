'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, CheckCircle2, AlertTriangle, XCircle, Shield } from 'lucide-react'
import type { PassportKPIs } from '@/types/documents'

interface PassportSummaryPanelProps {
  kpis: PassportKPIs
  onFilterChange?: (filter: 'all' | 'valid' | 'expiring_soon' | 'expired') => void
  activeFilter?: string
}

export function PassportSummaryPanel({
  kpis,
  onFilterChange,
  activeFilter = 'all',
}: PassportSummaryPanelProps) {
  const cards = [
    {
      key: 'all' as const,
      label: 'Total Passports',
      value: kpis.total,
      icon: BookOpen,
      color: 'bg-[#0A1221]/5 text-[#0A1221]',
      border: 'border-[#0A1221]/10',
      ring: 'ring-[#0A1221]/20',
    },
    {
      key: 'valid' as const,
      label: 'Valid',
      value: kpis.valid,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-700',
      border: 'border-emerald-100',
      ring: 'ring-emerald-300',
    },
    {
      key: 'expiring_soon' as const,
      label: 'Expiring Within 8 Months',
      value: kpis.expiringSoon,
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-700',
      border: 'border-amber-100',
      ring: 'ring-amber-300',
    },
    {
      key: 'expired' as const,
      label: 'Expired',
      value: kpis.expired,
      icon: XCircle,
      color: 'bg-red-50 text-red-700',
      border: 'border-red-100',
      ring: 'ring-red-300',
    },
  ]

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center gap-3 bg-gradient-to-r from-[#0A1221] to-[#1a2744]">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-sm">Passport Control Center</h3>
          <p className="text-xs text-white/60 mt-0.5">Live passport status overview</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y md:divide-y-0 divide-border">
        {cards.map((card, i) => {
          const Icon = card.icon
          const isActive = activeFilter === card.key
          return (
            <motion.button
              key={card.key}
              whileHover={{ backgroundColor: '#f8fafc' }}
              onClick={() => onFilterChange?.(card.key)}
              className={`p-5 text-left transition-all relative ${
                isActive ? `ring-2 ring-inset ${card.ring}` : ''
              }`}
            >
              {isActive && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-current opacity-40" />
              )}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 border ${card.color} ${card.border}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{card.label}</p>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
