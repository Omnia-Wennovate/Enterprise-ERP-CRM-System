'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import { fetchCommissionRules } from '@/app/actions/finance'

interface CommissionRule {
  id: string
  name: string
  base_percentage: number
  bonus_tiers?: { threshold: number; percentage: number }[]
  description: string
  active: boolean
  created_at: string
}

export default function CommissionRulesPage() {
  const [rules, setRules] = useState<CommissionRule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      setLoading(true)
      const data = await fetchCommissionRules()
      setRules(data || [])
    } catch (error) {
      console.error('Failed to load commission rules:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/finance/commissions"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">Commission Rules</h1>
            <p className="text-slate-600 mt-1">Configure commission structures and tiers</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
            <Plus className="w-5 h-5" />
            New Rule
          </button>
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 text-center py-12 text-slate-600">Loading rules...</div>
          ) : rules.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-slate-600">No commission rules defined</div>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{rule.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{rule.description}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      rule.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {rule.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-600">Base Rate</p>
                    <p className="text-2xl font-bold text-teal-600">{rule.base_percentage}%</p>
                  </div>

                  {rule.bonus_tiers && rule.bonus_tiers.length > 0 && (
                    <div className="border-t border-slate-200 pt-3">
                      <p className="text-sm font-semibold text-slate-700 mb-2">Bonus Tiers</p>
                      <div className="space-y-1 text-sm">
                        {rule.bonus_tiers.map((tier, idx) => (
                          <div key={idx} className="flex justify-between text-slate-600">
                            <span>Above ${tier.threshold.toFixed(0)}</span>
                            <span className="font-medium text-teal-600">{tier.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
