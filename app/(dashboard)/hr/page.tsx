import { createClient } from '@/lib/supabase/server'
import { 
  getExecutiveSummaryData, 
  getWorkforceAnalytics, 
  getCompensationEquity, 
  getAttritionRisks, 
  getPerformanceCorrelation, 
  getInteractiveAnalytics 
} from '@/lib/services/hr-dashboard'
import { HrDashboardClient } from '@/components/hr/dashboard/HrDashboardClient'
import { LegacyHRDashboard } from '@/components/hr/dashboard/LegacyHRDashboard'

export default async function HRDashboard() {
  const supabase = await createClient()
  
  // Get current user info
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, company_name')
    .eq('id', user?.id)
    .single()

  const userName = profile?.first_name || 'HR Manager'
  const companyName = profile?.company_name || 'Omnia ERP'

  // Fetch all dashboard data concurrently
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

  return (
    <div className="min-h-screen bg-background">

      {/* ── Section 1: HR Overview (original) ── */}
      <LegacyHRDashboard
        stats={{
          totalEmployees: summaryData.totalEmployees,
          activeEmployees: summaryData.activeEmployees,
          onLeave: summaryData.onLeave,
          pendingLeaves: summaryData.pendingLeaves,
          payrollTotal: summaryData.payrollTotal,
          absentToday: summaryData.absentToday,
        }}
      />

      {/* ── Divider ── */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="w-full h-px bg-border"></div>
        <div className="text-center py-8">
          <span className="bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
            Enterprise Analytics Dashboard
          </span>
          <p className="text-muted-foreground text-sm mt-2">Advanced workforce intelligence powered by real-time data</p>
        </div>
      </div>

      {/* ── Section 2: Enterprise Analytics Dashboard ── */}
      <HrDashboardClient 
        userName={userName}
        companyName={companyName}
        summaryData={summaryData}
        workforceData={workforceData}
        equityData={equityData}
        attritionRisks={attritionRisks}
        correlationData={correlationData}
        analyticsData={analyticsData}
      />

    </div>
  )
}
