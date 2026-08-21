'use client'

import { motion } from 'framer-motion'
import { Lock, Users, Briefcase, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

export function WorkforceAnalytics({ analyticsData, equityData }: { analyticsData: any, equityData: any }) {
  
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-foreground mb-6">Workforce Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <motion.div whileHover={{ y: -4 }} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-omnia-gold rounded-lg"><Users className="w-5 h-5" /></div>
            <h3 className="font-semibold text-muted-foreground">Average Tenure</h3>
          </div>
          <p className="text-3xl font-bold">2.4 <span className="text-lg text-muted-foreground font-normal">years</span></p>
        </motion.div>
        
        <motion.div whileHover={{ y: -4 }} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
            <h3 className="font-semibold text-muted-foreground">Retention Rate</h3>
          </div>
          <p className="text-3xl font-bold">94.2%</p>
        </motion.div>
        
        <motion.div whileHover={{ y: -4 }} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg"><Briefcase className="w-5 h-5" /></div>
            <h3 className="font-semibold text-muted-foreground">Avg Salary</h3>
          </div>
          <p className="text-3xl font-bold">${analyticsData?.averageSalary ? Math.round(analyticsData.averageSalary).toLocaleString() : 'N/A'}</p>
        </motion.div>
      </div>

      {equityData ? (
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Lock className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-5 h-5 text-amber-500" />
              <h3 className="text-xl font-bold text-foreground">Compensation Equity Dashboard</h3>
            </div>
            <p className="text-muted-foreground mb-6 max-w-2xl">
              Restricted view for HR Admin/Manager. Analyzes salary distribution by department and gender to identify potential pay gaps.
            </p>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={equityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                  <XAxis dataKey="department" stroke="currentColor" className="text-muted-foreground text-xs" />
                  <YAxis stroke="currentColor" className="text-muted-foreground text-xs" />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => `$${Math.round(value).toLocaleString()}`}
                  />
                  <Legend />
                  <Bar dataKey="maleSalary" name="Male Avg Salary" fill="#3B82F6" radius={[4, 4, 0, 0]} animationDuration={1500} />
                  <Bar dataKey="femaleSalary" name="Female Avg Salary" fill="#EC4899" radius={[4, 4, 0, 0]} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-muted/50 border border-border/50 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
          <Lock className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-foreground mb-2">Compensation Equity Restricted</h3>
          <p className="text-muted-foreground max-w-md">
            You do not have the required permissions (HR Admin/Manager) to view compensation equity data.
          </p>
        </div>
      )}
    </div>
  )
}
