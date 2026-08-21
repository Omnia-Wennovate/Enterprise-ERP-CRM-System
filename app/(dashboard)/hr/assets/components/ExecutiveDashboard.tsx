'use client'

import React from 'react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Treemap
} from 'recharts'
import { TrendingUp, TrendingDown, AlertCircle, Clock, CheckCircle, Package, DollarSign, Activity } from 'lucide-react'
import { StatsCard } from '@/components/dashboard/StatsCard'

interface DashboardProps {
  assets: any[]
  assignments: any[]
  onFilterClick: (filter: any) => void
}

export function ExecutiveDashboard({ assets, assignments, onFilterClick }: DashboardProps) {
  // --- METRICS CALCULATION ---

  const totalAssets = assets.length
  const totalValue = assets.reduce((sum, a) => sum + (Number(a.purchase_price) || 0), 0)
  
  const assigned = assets.filter(a => a.status === 'assigned').length
  const available = assets.filter(a => a.status === 'available').length
  const maintenance = assets.filter(a => a.status === 'maintenance').length
  const damaged = assets.filter(a => a.status === 'damaged').length
  const retired = assets.filter(a => a.status === 'retired').length
  
  const warrantyExpiringSoon = assets.filter(a => {
    if (!a.warranty_expiry) return false
    const daysUntilExpiry = (new Date(a.warranty_expiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30
  }).length

  // Asset ROI & Utilization Efficiency Score
  // util = (days assigned / days owned) * 100
  let totalDaysOwned = 0
  let totalDaysAssigned = 0
  
  const categoryStats = new Map<string, { count: number, daysOwned: number, daysAssigned: number, value: number }>()

  assets.forEach(a => {
    const cat = a.category || 'Uncategorized'
    if (!categoryStats.has(cat)) categoryStats.set(cat, { count: 0, daysOwned: 0, daysAssigned: 0, value: 0 })
    
    const stats = categoryStats.get(cat)!
    stats.count++
    stats.value += (Number(a.purchase_price) || 0)

    const purchaseDate = a.purchase_date ? new Date(a.purchase_date) : new Date(a.created_at)
    const daysOwned = Math.max(1, (new Date().getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24))
    stats.daysOwned += daysOwned
    totalDaysOwned += daysOwned

    // Calculate days assigned from assignments history
    const assetAssignments = assignments.filter(assign => assign.asset_id === a.id)
    let daysAss = 0
    assetAssignments.forEach(assign => {
      const start = new Date(assign.issued_date)
      const end = assign.return_date ? new Date(assign.return_date) : new Date()
      daysAss += Math.max(0, (end.getTime() - start.getTime()) / (1000 * 3600 * 24))
    })
    
    stats.daysAssigned += daysAss
    totalDaysAssigned += daysAss
  })

  const globalUtilizationScore = totalDaysOwned > 0 ? Math.round((totalDaysAssigned / totalDaysOwned) * 100) : 0
  
  // Executive Summary Generation
  const summarySentences = []
  summarySentences.push(`Fleet utilization is currently at ${globalUtilizationScore}%.`)
  
  const sortedCategories = Array.from(categoryStats.entries()).sort((a, b) => b[1].value - a[1].value)
  if (sortedCategories.length >= 2) {
    const top2 = sortedCategories.slice(0, 2)
    const top2Value = top2.reduce((sum, c) => sum + c[1].value, 0)
    const pct = totalValue > 0 ? Math.round((top2Value / totalValue) * 100) : 0
    summarySentences.push(`${top2[0][0]} and ${top2[1][0]} account for ${pct}% of total asset value.`)
  }
  
  if (warrantyExpiringSoon > 0) {
    summarySentences.push(`${warrantyExpiringSoon} warranties expire within 30 days.`)
  }
  
  const lowUtilCategories = Array.from(categoryStats.entries()).filter(c => (c[1].daysAssigned / c[1].daysOwned) < 0.2 && c[1].count > 5)
  if (lowUtilCategories.length > 0) {
    summarySentences.push(`Insight: Consider reducing inventory of ${lowUtilCategories.map(c => c[0]).join(', ')} due to low utilization (<20%).`)
  }

  // --- CHART DATA PREPARATION ---

  // Cost-per-Department Heatmap Data
  const deptMap = new Map<string, number>()
  assets.forEach(a => {
    const dept = a.department || 'Unassigned'
    deptMap.set(dept, (deptMap.get(dept) || 0) + (Number(a.purchase_price) || 0))
  })
  
  const heatmapData = Array.from(deptMap.entries()).map(([name, size]) => ({
    name,
    size,
    color: size > 10000 ? '#0d9488' : size > 5000 ? '#14b8a6' : '#5eead4' // Teal scale
  })).filter(d => d.size > 0)

  // Depreciation Forecast Curve (Mock calculation: straight line 36 months)
  const forecastData = []
  let currentValue = totalValue
  for (let month = 0; month <= 36; month += 6) {
    // Depreciate 2% per month roughly
    const val = Math.max(0, currentValue * Math.pow(0.98, month))
    forecastData.push({ month: `Month ${month}`, value: Math.round(val) })
  }

  // Assets by Category
  const categoryData = Array.from(categoryStats.entries()).map(([name, stats]) => ({
    name,
    value: stats.count
  }))

  const COLORS = ['#0d9488', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

  const renderCustomizedContent = (props: any) => {
    const { root, depth, x, y, width, height, index, name, value, color } = props;
    if (depth === 1) {
      return (
        <g>
          <rect
            x={x} y={y} width={width} height={height}
            style={{ fill: color, stroke: '#fff', strokeWidth: 2, strokeOpacity: 1 }}
          />
          {width > 50 && height > 30 && (
            <text x={x + 8} y={y + 20} fill="#fff" fontSize={14} fontWeight="bold">
              {name}
            </text>
          )}
          {width > 50 && height > 50 && (
            <text x={x + 8} y={y + 40} fill="#fff" fontSize={12}>
              ${value.toLocaleString()}
            </text>
          )}
        </g>
      )
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-omnia-gold/10 border border-omnia-gold/15 rounded-xl p-6">
        <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2">
          <Activity size={20} />
          Executive Auto-Summary
        </h3>
        <p className="text-foreground text-lg leading-relaxed">
          {summarySentences.join(' ')}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => onFilterClick({ key: 'all', value: null })} className="cursor-pointer transition-transform hover:scale-105">
          <StatsCard icon="Package" label="Total Assets" value={totalAssets} accentColor="#0d9488" />
        </div>
        <div onClick={() => onFilterClick({ key: 'status', value: 'available' })} className="cursor-pointer transition-transform hover:scale-105">
          <StatsCard icon="CheckCircle" label="Available" value={available} trend={2} trendLabel="vs last month" accentColor="#10b981" />
        </div>
        <div onClick={() => onFilterClick({ key: 'status', value: 'assigned' })} className="cursor-pointer transition-transform hover:scale-105">
          <StatsCard icon="Users" label="Assigned" value={assigned} trend={5} trendLabel="vs last month" accentColor="#3b82f6" />
        </div>
        <div className="cursor-pointer transition-transform hover:scale-105">
          <StatsCard icon="Activity" label="Utilization Score" value={`${globalUtilizationScore}%`} trend={6} trendLabel="vs last quarter" accentColor="#8b5cf6" />
        </div>
        
        <div onClick={() => onFilterClick({ key: 'status', value: 'maintenance' })} className="cursor-pointer transition-transform hover:scale-105">
          <StatsCard icon="AlertCircle" label="Under Maintenance" value={maintenance} accentColor="#f59e0b" />
        </div>
        <div className="cursor-pointer transition-transform hover:scale-105">
          <StatsCard icon="DollarSign" label="Total Value" value={`$${totalValue.toLocaleString()}`} accentColor="#0d9488" />
        </div>
        <div className="cursor-pointer transition-transform hover:scale-105">
          <StatsCard icon="Clock" label="Warranty Expiring (30d)" value={warrantyExpiringSoon} accentColor="#ef4444" />
        </div>
        <div onClick={() => onFilterClick({ key: 'status', value: 'damaged' })} className="cursor-pointer transition-transform hover:scale-105">
          <StatsCard icon="AlertCircle" label="Damaged / Lost" value={damaged + retired} accentColor="#64748b" />
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost-per-Department Heatmap */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="font-semibold text-foreground mb-4">Cost by Department (Heatmap)</h3>
          <div className="h-[300px] w-full">
            {heatmapData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={heatmapData}
                  dataKey="size"
                  aspectRatio={4 / 3}
                  stroke="#fff"
                  content={renderCustomizedContent}
                  onClick={(data) => {
                    if (data && data.name) onFilterClick({ key: 'department', value: data.name })
                  }}
                />
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No departmental cost data</div>
            )}
          </div>
        </div>

        {/* Depreciation Forecast Curve */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="font-semibold text-foreground mb-4">Depreciation Forecast Curve (36 Months)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis 
                  tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <RechartsTooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Projected Value']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="font-semibold text-foreground mb-4">Assets by Category</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px' }} />
                <Bar 
                  dataKey="value" 
                  radius={[0, 4, 4, 0]}
                  onClick={(data) => {
                    if (data && data.name) onFilterClick({ key: 'category', value: data.name })
                  }}
                  cursor="pointer"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
