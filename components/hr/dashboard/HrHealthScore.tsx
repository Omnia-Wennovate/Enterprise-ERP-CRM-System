'use client'

import { motion } from 'framer-motion'
import { Activity, Download } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export function HrHealthScore({ score }: { score: number }) {
  // Score 0-100
  const normalizedScore = Math.min(Math.max(score, 0), 100)
  
  const data = [
    { name: 'Score', value: normalizedScore },
    { name: 'Remaining', value: 100 - normalizedScore }
  ]
  
  let color = '#10B981' // Emerald
  let status = 'Excellent'
  let recommendation = 'Maintain current HR policies and continue monitoring.'
  
  if (normalizedScore < 60) {
    color = '#EF4444' // Red
    status = 'Critical'
    recommendation = 'Immediate action required. High attrition risk and low attendance detected.'
  } else if (normalizedScore < 80) {
    color = '#F59E0B' // Amber
    status = 'Needs Attention'
    recommendation = 'Review compensation equity and performance trends to improve retention.'
  }

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-omnia-gold" />
        <h3 className="text-lg font-bold text-foreground">HR Health Score</h3>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="100%"
                startAngle={180}
                endAngle={0}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
                animationDuration={1500}
              >
                <Cell fill={color} />
                <Cell fill="currentColor" className="opacity-10 text-foreground" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="absolute bottom-0 text-center w-full">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.5 }}
            className="text-5xl font-extrabold mb-1"
            style={{ color }}
          >
            {normalizedScore}
          </motion.div>
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{status}</p>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-muted/50 rounded-xl border border-border/50">
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>AI Recommendation:</strong> {recommendation}
        </p>
      </div>
    </div>
  )
}
