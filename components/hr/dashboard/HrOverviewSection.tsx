'use client'

import { useEffect, useState } from 'react'
import { HrDashboardClient } from '@/components/hr/dashboard/HrDashboardClient'
import { 
  getExecutiveSummaryData, 
  getWorkforceAnalytics, 
  getCompensationEquity, 
  getAttritionRisks, 
  getPerformanceCorrelation, 
  getInteractiveAnalytics 
} from '@/lib/services/hr-dashboard'
import { Loader2 } from 'lucide-react'

export function HrOverviewSection({ profile }: { profile: any }) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const [
        summaryData,
        workforceData,
        equityData,
        attritionRisks,
        correlationData,
        analyticsData
      ] = await Promise.all([
        getExecutiveSummaryData(),
        getWorkforceAnalytics(),
        getCompensationEquity(),
        getAttritionRisks(),
        getPerformanceCorrelation(),
        getInteractiveAnalytics()
      ])

      setData({
        summaryData,
        workforceData,
        equityData,
        attritionRisks,
        correlationData,
        analyticsData
      })
    }
    load()
  }, [])

  if (!data) {
    return (
      <div className="py-12 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const userName = profile?.full_name?.split(' ')[0] || 'HR Manager'
  const companyName = profile?.company_name || 'Omnia ERP'

  return (
    <div className="mt-12">
      <div className="w-full h-px bg-border my-8"></div>
      <div className="text-center mb-12">
        <span className="bg-primary/10 text-primary text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
          Enterprise Analytics
        </span>
      </div>
      <HrDashboardClient 
        userName={userName}
        companyName={companyName}
        summaryData={data.summaryData}
        workforceData={data.workforceData}
        equityData={data.equityData}
        attritionRisks={data.attritionRisks}
        correlationData={data.correlationData}
        analyticsData={data.analyticsData}
      />
    </div>
  )
}
