'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Calendar, DollarSign, Users, Briefcase, Monitor } from 'lucide-react'

const TABS = [
  { id: 'attendance', label: 'Attendance', icon: Clock, color: 'text-blue-500' },
  { id: 'leave', label: 'Leave', icon: Calendar, color: 'text-emerald-500' },
  { id: 'payroll', label: 'Payroll', icon: DollarSign, color: 'text-purple-500' },
  { id: 'recruitment', label: 'Recruitment', icon: Briefcase, color: 'text-amber-500' },
  { id: 'assets', label: 'Assets', icon: Monitor, color: 'text-stone-500' },
  { id: 'department', label: 'Departments', icon: Users, color: 'text-pink-500' },
]

export function SpecializedDashboards() {
  const [activeTab, setActiveTab] = useState('attendance')

  return (
    <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden mb-8">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-border/50 p-2 gap-2 bg-muted/10">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-background shadow-sm border border-border/50 font-bold' 
                  : 'hover:bg-muted/50 text-muted-foreground font-medium border border-transparent'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? tab.color : 'opacity-70'}`} />
              <span className={isActive ? 'text-foreground' : ''}>{tab.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeTabIndicator" 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full hidden" 
                />
              )}
            </button>
          )
        })}
      </div>
      
      {/* Tab Content Area */}
      <div className="p-6 min-h-[300px] relative bg-background/50">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col items-center justify-center text-center p-8"
          >
            {(() => {
              const activeTabData = TABS.find(t => t.id === activeTab)
              if (!activeTabData) return null
              const Icon = activeTabData.icon
              return (
                <>
                  <div className={`p-4 rounded-full bg-muted mb-4`}>
                    <Icon className={`w-12 h-12 ${activeTabData.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {activeTabData.label} Dashboard Module
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Full interactive {activeTabData.label.toLowerCase()} dashboard. This section dynamically loads the specialized metrics, tables, and actions for this domain.
                  </p>
                  <button className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
                    Open Full View
                  </button>
                </>
              )
            })()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
