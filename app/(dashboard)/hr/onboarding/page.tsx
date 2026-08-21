'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getOnboardings,
  getOnboardingKPIs,
  subscribeToOnboardingChanges,
  calculateHealthScore,
  generateCSVExport
} from '@/lib/services/onboarding'
import type { OnboardingWithDetails, OnboardingKPIs } from '@/types/hr'

import { OnboardingHeader } from './components/OnboardingHeader'
import { KPICards } from './components/KPICards'
import { ExecutiveSummary } from './components/ExecutiveSummary'
import { HealthScoreWidget } from './components/HealthScoreWidget'
import { StartOnboardingDialog } from './components/StartOnboardingDialog'
import { OnboardingCard } from './components/OnboardingCard'
import { OnboardingDetailDrawer } from './components/OnboardingDetailDrawer'
import { OnboardingAnalytics } from './components/OnboardingAnalytics'
import { UpcomingOnboardings } from './components/UpcomingOnboardings'
import { DeadlineIntelligence } from './components/DeadlineIntelligence'
import { SmartFilters } from './components/SmartFilters'
import { OnboardingLeaderboard } from './components/OnboardingLeaderboard'
import { EmptyState } from './components/EmptyState'
import { SkeletonLoading } from './components/SkeletonLoading'

import { Download } from 'lucide-react'

export default function OnboardingPage() {
  const [onboardings, setOnboardings] = useState<OnboardingWithDetails[]>([])
  const [filteredOnboardings, setFilteredOnboardings] = useState<OnboardingWithDetails[]>([])
  const [kpis, setKpis] = useState<OnboardingKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('active')

  const [currentUserId, setCurrentUserId] = useState<string>('')
  
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [selectedOnboarding, setSelectedOnboarding] = useState<OnboardingWithDetails | null>(null)

  // Initial load
  const loadData = async () => {
    try {
      const [obs, kpiData] = await Promise.all([
        getOnboardings(),
        getOnboardingKPIs(),
      ])
      setOnboardings(obs)
      setKpis(kpiData)
      setLoading(false)
    } catch (err) {
      console.error('Failed to load onboarding data:', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    
    // Get current user for completions
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id)
    })

    // Subscribe to realtime changes
    const unsubscribe = subscribeToOnboardingChanges(() => {
      loadData()
    })
    
    return () => unsubscribe()
  }, [])

  // Aggregate health score for the active onboardings
  const globalHealthScore = useMemo(() => {
    const active = onboardings.filter(o => !['completed', 'cancelled'].includes(o.status))
    if (active.length === 0) return { score: 100, taskCompletion: 100, overdueImpact: 0, blockedImpact: 0, deadlineProximity: 0, requiredCompletion: 100, recommendations: [] }
    
    // Combine all tasks from active onboardings
    const allActiveTasks = active.flatMap(o => o.tasks)
    return calculateHealthScore(allActiveTasks)
  }, [onboardings])

  const handleExportCSV = () => {
    const csv = generateCSVExport(filteredOnboardings)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `onboardings_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto">
          <SkeletonLoading />
        </div>
      </div>
    )
  }

  if (onboardings.length === 0 && !isStartDialogOpen) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 max-w-[1400px] w-full mx-auto p-6 lg:p-8 flex flex-col justify-center">
          <EmptyState onStartOnboarding={() => setIsStartDialogOpen(true)} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-omnia-gold/15 selection:text-foreground">
      <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
        {/* Header */}
        <OnboardingHeader 
          kpis={kpis!} 
          onStartOnboarding={() => setIsStartDialogOpen(true)} 
        />
        
        {/* KPI Cards */}
        <KPICards 
          kpis={kpis!} 
          onFilterClick={(filter) => {
            setActiveFilter(filter)
            window.scrollTo({ top: document.getElementById('onboarding-list')?.offsetTop || 0, behavior: 'smooth' })
          }} 
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Column */}
          <div className="xl:col-span-2 space-y-6">
            <ExecutiveSummary onboardings={onboardings} kpis={kpis!} />
            
            <OnboardingAnalytics onboardings={onboardings} />
            
            <DeadlineIntelligence 
              onboardings={onboardings} 
              onSelectOnboarding={(o) => setSelectedOnboarding(o)} 
            />

            <div id="onboarding-list" className="scroll-mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Employee Onboardings</h2>
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg bg-card"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
              
              <SmartFilters 
                onboardings={onboardings} 
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                onFilter={setFilteredOnboardings} 
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOnboardings.map((o, index) => (
                  <OnboardingCard 
                    key={o.id} 
                    onboarding={o} 
                    index={index}
                    onClick={() => setSelectedOnboarding(o)} 
                  />
                ))}
              </div>
              
              {filteredOnboardings.length === 0 && (
                <div className="text-center py-12 bg-card rounded-xl border border-border mt-4">
                  <p className="text-muted-foreground">No onboardings match your filters.</p>
                  <button 
                    onClick={() => setActiveFilter('all')}
                    className="text-omnia-gold font-medium text-sm mt-2 hover:underline"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            <HealthScoreWidget health={globalHealthScore} size={140} />
            <UpcomingOnboardings 
              onboardings={onboardings} 
              onSelect={(o) => setSelectedOnboarding(o)} 
            />
            <OnboardingLeaderboard onboardings={onboardings} />
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <StartOnboardingDialog 
        isOpen={isStartDialogOpen} 
        onClose={() => setIsStartDialogOpen(false)} 
        onSuccess={loadData} 
      />
      
      {selectedOnboarding && (
        <OnboardingDetailDrawer 
          onboarding={selectedOnboarding}
          isOpen={!!selectedOnboarding}
          onClose={() => setSelectedOnboarding(null)}
          onUpdate={loadData}
          currentUserId={currentUserId}
        />
      )}
    </div>
  )
}
