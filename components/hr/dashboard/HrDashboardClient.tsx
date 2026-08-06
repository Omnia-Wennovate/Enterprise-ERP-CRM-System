'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings2, LayoutTemplate } from 'lucide-react'
import { ExecutiveHero } from './ExecutiveHero'
import { KpiGrid } from './KpiGrid'
import { InteractiveAnalytics } from './InteractiveAnalytics'
import { HrHealthScore } from './HrHealthScore'
import { EmployeeInsights } from './EmployeeInsights'
import { WorkforceAnalytics } from './WorkforceAnalytics'
import { PerformanceCorrelation } from './PerformanceCorrelation'
import { ActivityAndNotifications } from './ActivityAndNotifications'
import { SpecializedDashboards } from './SpecializedDashboards'
import { ExecutiveBriefingExport } from './ExecutiveBriefingExport'

interface HrDashboardClientProps {
  userName: string
  companyName: string
  summaryData: any
  workforceData: any
  equityData: any
  attritionRisks: any
  correlationData: any
  analyticsData: any
}

// Map of components for dynamic rendering based on layout preferences
const COMPONENT_MAP = {
  kpi: 'KPI Grid',
  analytics: 'Interactive Analytics',
  insights: 'Employee Insights',
  workforce: 'Workforce & Equity',
  health: 'Health Score & Actions',
  performance: 'Performance Correlation',
  specialized: 'Specialized Dashboards',
  activity: 'Activity & Notifications',
}

const DEFAULT_LAYOUT = ['kpi', 'analytics', 'insights', 'workforce', 'health', 'performance', 'specialized', 'activity']

export function HrDashboardClient(props: HrDashboardClientProps) {
  const [layout, setLayout] = useState<string[]>(DEFAULT_LAYOUT)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load personalization from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem('hr_dashboard_layout')
    if (savedLayout) {
      try {
        setLayout(JSON.parse(savedLayout))
      } catch (e) {
        // Fallback to default
      }
    }
    setIsLoaded(true)
  }, [])

  const toggleComponent = (id: string) => {
    setLayout(prev => {
      const newLayout = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      localStorage.setItem('hr_dashboard_layout', JSON.stringify(newLayout))
      return newLayout
    })
  }

  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT)
    localStorage.removeItem('hr_dashboard_layout')
  }

  // Calculate overall health score (mock logic for demo, usually comes from backend)
  const healthScore = Math.max(0, 100 - (props.attritionRisks?.length || 0) * 5)

  if (!isLoaded) return <div className="min-h-screen bg-background p-8 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">HR Command Center</h1>
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isEditMode ? 'bg-primary text-primary-foreground' : 'bg-card border border-border/50 hover:bg-muted text-foreground shadow-sm'}`}
          >
            <Settings2 className="w-4 h-4" />
            {isEditMode ? 'Done Customizing' : 'Customize Dashboard'}
          </button>
        </div>

        {/* Customization Panel */}
        <AnimatePresence>
          {isEditMode && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="bg-card border border-border/50 rounded-xl p-6 shadow-sm overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-4 text-foreground font-semibold">
                <LayoutTemplate className="w-5 h-5 text-primary" />
                <h3>Personalize Layout</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Toggle widgets to show or hide them on your dashboard. Changes are saved automatically.</p>
              
              <div className="flex flex-wrap gap-3">
                {Object.entries(COMPONENT_MAP).map(([id, label]) => {
                  const isVisible = layout.includes(id)
                  return (
                    <button
                      key={id}
                      onClick={() => toggleComponent(id)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${isVisible ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'}`}
                    >
                      {label} {isVisible && '✓'}
                    </button>
                  )
                })}
                <button 
                  onClick={resetLayout}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 ml-auto transition-colors"
                >
                  Reset to Default
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section - Always visible */}
        <ExecutiveHero 
          userName={props.userName} 
          companyName={props.companyName} 
          summary={props.summaryData.summary} 
        />

        {/* Dashboard Grid */}
        <motion.div layout className="flex flex-col gap-8">
          
          <AnimatePresence mode="popLayout">
            {layout.includes('kpi') && (
              <motion.div layout key="kpi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <KpiGrid stats={props.summaryData} />
              </motion.div>
            )}

            {layout.includes('analytics') && (
              <motion.div layout key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <InteractiveAnalytics analyticsData={props.analyticsData} />
              </motion.div>
            )}

            {layout.includes('insights') && (
              <motion.div layout key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EmployeeInsights risks={props.attritionRisks} />
              </motion.div>
            )}

            {layout.includes('workforce') && (
              <motion.div layout key="workforce" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <WorkforceAnalytics analyticsData={props.workforceData} equityData={props.equityData} />
              </motion.div>
            )}

            {layout.includes('health') && (
              <motion.div layout key="health" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-1">
                  <HrHealthScore score={healthScore} />
                </div>
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <div className="flex-1 bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex items-center justify-center text-muted-foreground text-sm">
                    {/* Placeholder for future Executive Summary AI generation component */}
                    <div className="text-center">
                      <h3 className="font-bold text-foreground mb-2 text-lg">AI Executive Summary</h3>
                      <p>Based on current metrics, workforce retention is stable but attention is needed in the Sales department regarding the recent correlation between performance reviews and revenue.</p>
                    </div>
                  </div>
                  <div>
                    <ExecutiveBriefingExport />
                  </div>
                </div>
              </motion.div>
            )}

            {layout.includes('performance') && (
              <motion.div layout key="performance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PerformanceCorrelation correlationData={props.correlationData} />
              </motion.div>
            )}

            {layout.includes('specialized') && (
              <motion.div layout key="specialized" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SpecializedDashboards />
              </motion.div>
            )}

            {layout.includes('activity') && (
              <motion.div layout key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ActivityAndNotifications />
              </motion.div>
            )}
            
          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  )
}
