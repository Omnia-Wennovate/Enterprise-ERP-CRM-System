'use client'

import { motion } from 'framer-motion'
import { AlertOctagon, TrendingDown, TrendingUp, Star, Clock } from 'lucide-react'
import Image from 'next/image'

function RiskBadge({ level }: { level: string }) {
  let colorClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  if (level === 'High') colorClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  else if (level === 'Medium') colorClass = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
  else if (level === 'Low') colorClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
      {level} Risk
    </span>
  )
}

export function EmployeeInsights({ risks }: { risks: any[] }) {
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* Attrition Risk */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-bold text-foreground">Predictive Attrition Risk</h3>
          </div>
          <span className="text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-1 rounded-full">
            Deterministic Model
          </span>
        </div>
        
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
          {risks && risks.length > 0 ? (
            risks.map((risk, idx) => (
              <motion.div 
                key={risk.employee.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {risk.employee.avatar_url ? (
                    <Image src={risk.employee.avatar_url} alt="avatar" width={40} height={40} className="object-cover" />
                  ) : (
                    <span className="text-primary font-bold">{risk.employee.first_name?.[0] || 'E'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-foreground truncate">
                      {risk.employee.first_name} {risk.employee.last_name}
                    </h4>
                    <RiskBadge level={risk.riskLevel} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{risk.employee.department}</p>
                  <div className="space-y-1">
                    {risk.reasons.map((r: string, i: number) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <TrendingDown className="w-3 h-3 text-red-400" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-50" />
              <p>No high attrition risks detected.</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Needed / Highlights */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500" /> Employee Highlights
        </h3>
        
        <div className="space-y-4">
          {[
            { title: 'Top Performer: Sarah Jenkins', desc: 'Achieved 115% of sales target this quarter', icon: Star, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
            { title: 'Repeated Lateness: Mark D.', desc: 'Late 4 times in the last 2 weeks', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
            { title: 'Promotion Eligible: Chen W.', desc: 'In role 2+ years with consistently high ratings', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
              <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  )
}

// Ensure CheckCircle is imported if used in JSX, adding it here for the fallback empty state
import { CheckCircle } from 'lucide-react'
