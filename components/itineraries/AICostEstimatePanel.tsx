'use client'

import { useState } from 'react'
import { DollarSign, TrendingUp, ArrowRightLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import type { AICostEstimate } from '@/types/ai-itinerary'

interface AICostEstimatePanelProps {
  costEstimate: AICostEstimate
}

export function AICostEstimatePanel({ costEstimate }: AICostEstimatePanelProps) {
  const [showDestCurrency, setShowDestCurrency] = useState(false)

  const categories = [
    { key: 'hotels', label: 'Hotels', color: '#8B5CF6', icon: '🏨' },
    { key: 'flights', label: 'Flights', color: '#3B82F6', icon: '✈️' },
    { key: 'meals', label: 'Meals', color: '#EF4444', icon: '🍽️' },
    { key: 'transport', label: 'Transport', color: '#F59E0B', icon: '🚗' },
    { key: 'tours', label: 'Tours', color: '#F97316', icon: '🎯' },
    { key: 'shopping', label: 'Shopping', color: '#14B8A6', icon: '🛍️' },
    { key: 'visa', label: 'Visa & Docs', color: '#6366F1', icon: '📋' },
    { key: 'insurance', label: 'Insurance', color: '#EC4899', icon: '🛡️' },
    { key: 'taxes', label: 'Taxes & Fees', color: '#64748B', icon: '💰' },
    { key: 'miscellaneous', label: 'Misc', color: '#78716C', icon: '📦' },
  ]

  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || costEstimate.baseCurrency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const maxCost = Math.max(
    ...categories.map(c => (costEstimate as unknown as Record<string, number>)[c.key] || 0),
    1
  )

  const displayCurrency = showDestCurrency && costEstimate.destinationCurrency
    ? costEstimate.destinationCurrency
    : costEstimate.baseCurrency

  const displayTotal = showDestCurrency && costEstimate.totalInDestinationCurrency
    ? costEstimate.totalInDestinationCurrency
    : costEstimate.total

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          Cost Estimation
        </h4>
        {costEstimate.destinationCurrency && costEstimate.destinationCurrency !== costEstimate.baseCurrency && (
          <button
            onClick={() => setShowDestCurrency(!showDestCurrency)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-500 hover:text-teal-600 bg-white border border-slate-200 rounded-lg transition-colors"
          >
            <ArrowRightLeft className="w-3 h-3" />
            {showDestCurrency ? costEstimate.baseCurrency : costEstimate.destinationCurrency}
          </button>
        )}
      </div>

      {/* Warning Badge */}
      <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-[10px] font-medium text-amber-700">
          ⚠️ AI-estimated costs — replace with real supplier quotes before booking
        </p>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-2.5 mb-4">
        {categories.map(cat => {
          const amount = (costEstimate as unknown as Record<string, number>)[cat.key] || 0
          if (amount === 0) return null
          const pct = (amount / maxCost) * 100

          const displayAmount = showDestCurrency && costEstimate.exchangeRate
            ? amount * costEstimate.exchangeRate
            : amount

          return (
            <div key={cat.key}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-slate-600 flex items-center gap-1.5">
                  <span className="text-sm">{cat.icon}</span>
                  {cat.label}
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {formatCurrency(displayAmount, displayCurrency)}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Total */}
      <div className="pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Estimated Total
          </span>
          <span className="text-lg font-bold text-emerald-700">
            {formatCurrency(displayTotal, displayCurrency)}
          </span>
        </div>
        {costEstimate.exchangeRate && costEstimate.destinationCurrency && !showDestCurrency && (
          <p className="text-[10px] text-slate-400 text-right mt-1">
            ≈ {formatCurrency(
              costEstimate.totalInDestinationCurrency || costEstimate.total * costEstimate.exchangeRate,
              costEstimate.destinationCurrency
            )}
          </p>
        )}
      </div>
    </div>
  )
}
