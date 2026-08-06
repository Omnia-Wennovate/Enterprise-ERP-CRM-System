'use server'

import { createClient } from '@/lib/supabase/server'

export async function getExecutiveSummaryData() {
  const supabase = await createClient()

  // Fetch profiles counts
  const { count: totalEmployees } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: activeEmployees } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true)

  // Fetch attendance for today
  const today = new Date().toISOString().split('T')[0]
  const { data: todayAttendance } = await supabase.from('attendance').select('status, employee_id').eq('date', today)

  const present = todayAttendance?.filter(a => a.status === 'present').length || 0
  const late = todayAttendance?.filter(a => a.status === 'late').length || 0
  const absent = todayAttendance?.filter(a => a.status === 'absent').length || 0
  const onLeave = todayAttendance?.filter(a => a.status === 'leave').length || 0

  // Fetch pending leaves
  const { count: pendingLeaves } = await supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')

  // Fetch payroll info
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const { data: payrollData } = await supabase.from('payroll').select('net_salary').eq('period_month', currentMonth).eq('period_year', currentYear)
  const payrollTotal = payrollData?.reduce((sum, p) => sum + (p.net_salary || 0), 0) || 0

  // Quick summary string
  const summary = `${activeEmployees || 0} Active Employees, ${pendingLeaves || 0} Leave Requests Need Approval, ${absent || 0} Absent Today. Payroll this month: $${payrollTotal.toLocaleString()}`

  return {
    totalEmployees: totalEmployees || 0,
    activeEmployees: activeEmployees || 0,
    inactiveEmployees: (totalEmployees || 0) - (activeEmployees || 0),
    attendanceRate: activeEmployees ? Math.round(((present + late) / activeEmployees) * 100) : 0,
    lateEmployees: late,
    absentToday: absent,
    onLeave: onLeave,
    pendingLeaves: pendingLeaves || 0,
    payrollTotal,
    summary
  }
}

export async function getWorkforceAnalytics() {
  const supabase = await createClient()
  const { data: profiles } = await supabase.from('profiles').select('basic_salary, department, gender, date_joined, position')

  if (!profiles || profiles.length === 0) return null

  let totalSalary = 0
  const departmentCounts: Record<string, number> = {}

  profiles.forEach(p => {
    totalSalary += Number(p.basic_salary) || 0
    if (p.department) {
      departmentCounts[p.department] = (departmentCounts[p.department] || 0) + 1
    }
  })

  return {
    averageSalary: totalSalary / profiles.length,
    headcountByDepartment: Object.entries(departmentCounts).map(([name, value]) => ({ name, value }))
  }
}

export async function getCompensationEquity() {
  const supabase = await createClient()
  // Assuming HR Admin/Manager check is done before calling this, or handle here.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: currentUserProfile } = await supabase.from('profiles').select('department, role').eq('id', user.id).single()

  // Basic RBAC check
  const isHR = currentUserProfile?.department === 'HR' || currentUserProfile?.role === 'admin'
  if (!isHR) return null // Restricted

  const { data: profiles } = await supabase.from('profiles').select('basic_salary, department, gender, date_joined, position')

  if (!profiles) return null

  // Group by department and gender
  const equityData: any[] = []
  const depts = [...new Set(profiles.map(p => p.department).filter(Boolean))]

  depts.forEach(dept => {
    const deptProfiles = profiles.filter(p => p.department === dept)
    const maleProfiles = deptProfiles.filter(p => p.gender === 'Male' || p.gender === 'male')
    const femaleProfiles = deptProfiles.filter(p => p.gender === 'Female' || p.gender === 'female')

    const maleAvg = maleProfiles.length > 0 ? maleProfiles.reduce((s, p) => s + Number(p.basic_salary || 0), 0) / maleProfiles.length : 0
    const femaleAvg = femaleProfiles.length > 0 ? femaleProfiles.reduce((s, p) => s + Number(p.basic_salary || 0), 0) / femaleProfiles.length : 0

    equityData.push({
      department: dept,
      maleSalary: maleAvg,
      femaleSalary: femaleAvg,
      gap: maleAvg && femaleAvg ? Math.round(Math.abs((maleAvg - femaleAvg) / Math.max(maleAvg, femaleAvg)) * 100) : 0
    })
  })

  return equityData
}

export async function getAttritionRisks() {
  const supabase = await createClient()

  const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, department, date_joined, avatar_url')
  const { data: reviews } = await supabase.from('performance_reviews').select('employee_id, achievement_percent, period_month, period_year').order('period_year', { ascending: false }).order('period_month', { ascending: false })
  const { data: leaves } = await supabase.from('leave_requests').select('employee_id, start_date').eq('reason', 'Unplanned')

  if (!profiles) return []

  const risks: any[] = []

  profiles.forEach(p => {
    let score = 0
    let reasons: string[] = []

    // 1. Tenure vs Promotion (Simulated: if > 1.5 years and no promotion record - we don't have promotion history table, so we use date_joined)
    if (p.date_joined) {
      const joinDate = new Date(p.date_joined)
      const monthsTenure = (new Date().getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      if (monthsTenure > 18) {
        score += 30
        reasons.push('In current role > 18 months')
      }
    }

    // 2. Declining Performance
    const empReviews = reviews?.filter(r => r.employee_id === p.id) || []
    if (empReviews.length >= 2) {
      // Sort by newest first
      const sorted = empReviews.sort((a, b) => {
        if (a.period_year !== b.period_year) return b.period_year - a.period_year
        return b.period_month - a.period_month
      })

      const last = sorted[0].achievement_percent || 0
      const prev = sorted[1].achievement_percent || 0

      if (last < prev - 10) {
        score += 40
        reasons.push('Declining performance score')
      } else if (last < 70) {
        score += 20
        reasons.push('Low recent performance')
      }
    }

    // 3. Unplanned leaves frequency
    const empLeaves = leaves?.filter(l => l.employee_id === p.id) || []
    const recentLeaves = empLeaves.filter(l => {
      const lDate = new Date(l.start_date)
      const diffDays = (new Date().getTime() - lDate.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays <= 90
    })

    if (recentLeaves.length >= 3) {
      score += 30
      reasons.push('High recent unplanned leave')
    }

    let riskLevel = 'Low'
    if (score >= 70) riskLevel = 'High'
    else if (score >= 40) riskLevel = 'Medium'

    if (score > 0) {
      risks.push({
        employee: p,
        score,
        riskLevel,
        reasons
      })
    }
  })

  return risks.sort((a, b) => b.score - a.score)
}

export async function getPerformanceCorrelation() {
  const supabase = await createClient()

  // Fetch Sales agents
  const { data: salesAgents } = await supabase.from('profiles').select('id, first_name, last_name').eq('department', 'Sales')
  if (!salesAgents || salesAgents.length === 0) return []

  const agentIds = salesAgents.map(a => a.id)

  // Fetch their reviews
  const { data: reviews } = await supabase.from('performance_reviews').select('employee_id, achievement_percent, period_month, period_year').in('employee_id', agentIds)

  // Fetch their commissions (as proxy for revenue)
  const { data: commissions } = await supabase.from('commissions').select('agent_id, base_amount, period_month, period_year').in('agent_id', agentIds)

  const correlationData: any[] = []

  salesAgents.forEach(agent => {
    // We aggregate their average performance and total revenue for the year 2026 for instance, or across all time
    const agentReviews = reviews?.filter(r => r.employee_id === agent.id) || []
    const agentCommissions = commissions?.filter(c => c.agent_id === agent.id) || []

    const avgScore = agentReviews.length > 0
      ? agentReviews.reduce((s, r) => s + (r.achievement_percent || 0), 0) / agentReviews.length
      : 0

    const totalRevenue = agentCommissions.reduce((s, c) => s + (c.base_amount || 0), 0)

    if (avgScore > 0 || totalRevenue > 0) {
      correlationData.push({
        id: agent.id,
        name: `${agent.first_name || 'Agent'} ${agent.last_name || ''}`.trim(),
        reviewScore: Math.round(avgScore),
        revenue: totalRevenue
      })
    }
  })

  return correlationData
}

export async function getInteractiveAnalytics() {
  const supabase = await createClient()

  // 1. Employee Growth (Simulated by date_joined)
  const { data: profiles } = await supabase.from('profiles').select('date_joined')
  const growthData: any[] = []
  if (profiles) {
    const byYearMonth: Record<string, number> = {}
    profiles.forEach(p => {
      if (p.date_joined) {
        const ym = p.date_joined.substring(0, 7)
        byYearMonth[ym] = (byYearMonth[ym] || 0) + 1
      }
    })

    let cumulative = 0
    Object.keys(byYearMonth).sort().forEach(ym => {
      cumulative += byYearMonth[ym]
      growthData.push({ month: ym, employees: cumulative })
    })
  }

  // 2. Attendance Trend
  const { data: attendance } = await supabase.from('attendance').select('date, status').order('date', { ascending: false }).limit(300)
  const attendanceTrend: any[] = []
  if (attendance) {
    const byDate: Record<string, { present: number, absent: number, late: number }> = {}
    attendance.forEach(a => {
      if (!byDate[a.date]) byDate[a.date] = { present: 0, absent: 0, late: 0 }
      if (a.status === 'present') byDate[a.date].present++
      else if (a.status === 'absent') byDate[a.date].absent++
      else if (a.status === 'late') byDate[a.date].late++
    })

    Object.keys(byDate).sort().forEach(d => {
      attendanceTrend.push({
        date: d,
        present: byDate[d].present,
        absent: byDate[d].absent,
        late: byDate[d].late
      })
    })
  }

  return {
    growthData: growthData.length > 0 ? growthData : [{ month: '2026-01', employees: 10 }, { month: '2026-02', employees: 15 }],
    attendanceTrend: attendanceTrend.length > 0 ? attendanceTrend : [{ date: '2026-08-01', present: 20, absent: 2, late: 1 }]
  }
}