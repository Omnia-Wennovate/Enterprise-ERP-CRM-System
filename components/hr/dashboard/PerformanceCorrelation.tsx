'use client'

import { motion } from 'framer-motion'
import { Target } from 'lucide-react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ZAxis } from 'recharts'

export function PerformanceCorrelation({ correlationData }: { correlationData: any[] }) {
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-foreground mb-1">{data.name}</p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">Revenue: $${data.revenue.toLocaleString()}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">Review Score: {data.reviewScore}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="mb-8">
      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xl font-bold text-foreground">Cross-Module Performance Correlation</h2>
            </div>
            <p className="text-muted-foreground mt-1 text-sm max-w-3xl">
              Analyzes Sales Agent performance review scores against actual booking revenue/commission data. 
              Identifies discrepancies between self-reported HR data and real revenue outcomes.
            </p>
          </div>
        </div>

        <div className="h-[400px] w-full">
          {correlationData && correlationData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                <XAxis 
                  type="number" 
                  dataKey="reviewScore" 
                  name="Review Score" 
                  unit="%" 
                  domain={['dataMin - 5', 'dataMax + 5']}
                  stroke="currentColor" 
                  className="text-muted-foreground text-xs"
                  label={{ value: 'Performance Review Score (%)', position: 'insideBottom', offset: -10, fill: 'currentColor', className: 'text-muted-foreground text-xs' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="revenue" 
                  name="Revenue" 
                  unit="$"
                  stroke="currentColor" 
                  className="text-muted-foreground text-xs"
                  label={{ value: 'Actual Booking Revenue ($)', angle: -90, position: 'insideLeft', fill: 'currentColor', className: 'text-muted-foreground text-xs' }}
                  tickFormatter={(val) => `$${val >= 1000 ? (val/1000)+'k' : val}`}
                />
                <ZAxis type="number" range={[100, 100]} />
                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter name="Agents" data={correlationData} fill="#8B5CF6">
                  {correlationData.map((entry, index) => (
                    <circle key={`cell-${index}`} r={6} fill={
                      entry.reviewScore > 85 && entry.revenue < 5000 ? '#EF4444' : // High score, low revenue anomaly
                      entry.reviewScore < 70 && entry.revenue > 10000 ? '#10B981' : // Low score, high revenue anomaly
                      '#8B5CF6'
                    } />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Target className="w-12 h-12 mb-4 opacity-20" />
              <p>No correlation data available. Requires sales agents with both reviews and commissions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
