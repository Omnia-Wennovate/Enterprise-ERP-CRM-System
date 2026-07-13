'use client'

import { useState, useEffect } from 'react'
import {
  Map, Plane, Users, Globe, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle2, Loader2, TrendingUp
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { ItineraryKPIs } from '@/types/itinerary'

interface ItineraryDashboardProps {
  onViewAll: () => void
}

export function ItineraryDashboard({ onViewAll }: ItineraryDashboardProps) {
  const [kpis, setKpis] = useState<ItineraryKPIs | null>(null)
  const [chartData, setChartData] = useState<{ month: string; count: number; completed: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { getKPIs, getMonthlyData } = await import('@/lib/services/itineraries')
      const [kpiData, monthly] = await Promise.all([getKPIs(), getMonthlyData()])
      setKpis(kpiData)
      setChartData(monthly)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
      setKpis({
        totalActive: 0, upcomingTrips: 0, totalTravelers: 0, totalCountries: 0,
        todayDepartures: 0, todayArrivals: 0, pendingApproval: 0, completedTrips: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!kpis) return null

  const cards = [
    { label: 'Active Itineraries', value: kpis.totalActive, icon: Map, color: 'from-teal-500 to-teal-600', iconBg: 'bg-teal-400/20' },
    { label: 'Upcoming Trips', value: kpis.upcomingTrips, icon: Plane, color: 'from-blue-500 to-blue-600', iconBg: 'bg-blue-400/20' },
    { label: 'Total Travelers', value: kpis.totalTravelers, icon: Users, color: 'from-violet-500 to-violet-600', iconBg: 'bg-violet-400/20' },
    { label: 'Countries', value: kpis.totalCountries, icon: Globe, color: 'from-amber-500 to-amber-600', iconBg: 'bg-amber-400/20' },
    { label: "Today's Departures", value: kpis.todayDepartures, icon: ArrowUpRight, color: 'from-sky-500 to-sky-600', iconBg: 'bg-sky-400/20' },
    { label: "Today's Arrivals", value: kpis.todayArrivals, icon: ArrowDownRight, color: 'from-emerald-500 to-emerald-600', iconBg: 'bg-emerald-400/20' },
    { label: 'Pending Approval', value: kpis.pendingApproval, icon: Clock, color: 'from-orange-500 to-orange-600', iconBg: 'bg-orange-400/20' },
    { label: 'Completed', value: kpis.completedTrips, icon: CheckCircle2, color: 'from-green-500 to-green-600', iconBg: 'bg-green-400/20' },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden bg-white rounded-xl border border-slate-200/60 p-5 hover:shadow-lg transition-all duration-300 group cursor-pointer"
            onClick={onViewAll}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{card.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                <card.icon className="w-5 h-5 text-slate-700" />
              </div>
            </div>
            {/* Gradient accent bar */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Itineraries Chart */}
        <div className="bg-white rounded-xl border border-slate-200/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Monthly Itineraries</h3>
              <p className="text-sm text-slate-500 mt-0.5">Created vs Completed</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-3 h-3 rounded-sm bg-teal-500" /> Created
              <span className="w-3 h-3 rounded-sm bg-emerald-400 ml-2" /> Completed
            </div>
          </div>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar dataKey="count" fill="#0A8FA8" radius={[4, 4, 0, 0]} name="Created" />
                  <Bar dataKey="completed" fill="#34d399" radius={[4, 4, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No data yet</p>
                  <p className="text-xs mt-1">Charts will populate as itineraries are created</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl border border-slate-200/60 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Trip Overview</h3>
          <div className="space-y-5">
            <StatRow label="Active Itineraries" value={kpis.totalActive} max={Math.max(kpis.totalActive + kpis.completedTrips, 1)} color="bg-teal-500" />
            <StatRow label="Upcoming Trips" value={kpis.upcomingTrips} max={Math.max(kpis.totalActive, 1)} color="bg-blue-500" />
            <StatRow label="Pending Approval" value={kpis.pendingApproval} max={Math.max(kpis.totalActive, 1)} color="bg-amber-500" />
            <StatRow label="Completed" value={kpis.completedTrips} max={Math.max(kpis.totalActive + kpis.completedTrips, 1)} color="bg-green-500" />
          </div>

          <div className="mt-8 p-4 bg-gradient-to-r from-teal-50 to-sky-50 rounded-xl border border-teal-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Globe className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {kpis.totalCountries} {kpis.totalCountries === 1 ? 'Country' : 'Countries'} Covered
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{kpis.totalTravelers} total travelers managed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-sm font-bold text-slate-900">{value}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
