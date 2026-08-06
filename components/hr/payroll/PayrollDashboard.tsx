'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PayrollHero } from './PayrollHero'
import { PayrollKPIGrid } from './PayrollKPIGrid'
import { PayrollGenerator } from './PayrollGenerator'
import { PayrollTable } from './PayrollTable'
import { PayrollCharts } from './PayrollCharts'
import { PayrollInsights } from './PayrollInsights'
import { DepartmentPayroll } from './DepartmentPayroll'
import { PayrollHistory } from './PayrollHistory'
import { EmployeePayslipDrawer } from './EmployeePayslipDrawer'
import { Loader2 } from 'lucide-react'
import {
  actionGetPayroll, actionGetKPIs, actionGetDepartmentPayroll,
  actionGetMonthlyTrend, actionGetPayrollHistory, actionGetInsights
} from '@/app/actions/payroll'

interface Props {
  initialMonth: number
  initialYear: number
}

export function PayrollDashboard({ initialMonth, initialYear }: Props) {
  const [month, setMonth] = useState(initialMonth)
  const [year, setYear] = useState(initialYear)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [records, kpis, deptData, trend, history, insights] = await Promise.all([
        actionGetPayroll(month, year),
        actionGetKPIs(month, year),
        actionGetDepartmentPayroll(month, year),
        actionGetMonthlyTrend(6),
        actionGetPayrollHistory(),
        actionGetInsights(month, year),
      ])
      setData({ records, kpis, deptData, trend, history, insights })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [month, year])

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  const daysUntilClose = new Date(year, month, 0).getDate() - new Date().getDate()
  const displayDays = daysUntilClose > 0 && month === new Date().getMonth() + 1 ? daysUntilClose : 0

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <PayrollHero 
          month={month} 
          year={year} 
          totalEmployees={data?.kpis?.totalEmployees || 0}
          totalPayroll={data?.kpis?.totalMonthlyPayroll || 0}
          daysUntilClose={displayDays}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content (3/4 width on large screens) */}
          <div className="lg:col-span-3 space-y-6">
            {data?.kpis && <PayrollKPIGrid kpis={data.kpis} />}
            {data?.insights && <PayrollInsights insights={data.insights} />}
            
            <PayrollGenerator 
              month={month} 
              year={year} 
              hasExisting={data?.records?.length > 0} 
              onSuccess={loadData} 
            />
            
            {data?.records && data?.trend && data?.deptData && (
              <PayrollCharts 
                records={data.records} 
                trend={data.trend} 
                deptData={data.deptData} 
              />
            )}
            
            {data?.records && (
              <PayrollTable 
                records={data.records} 
                onRefresh={loadData} 
                onSelectRecord={setSelectedRecord}
              />
            )}
          </div>

          {/* Sidebar (1/4 width on large screens) */}
          <div className="lg:col-span-1 space-y-6">
            <PayrollHistory 
              history={data?.history || []} 
              currentMonth={month}
              currentYear={year}
              onSelectPeriod={(m, y) => { setMonth(m); setYear(y) }}
            />
            {data?.deptData && (
              <DepartmentPayroll data={data.deptData} />
            )}
          </div>
        </div>
      </div>

      <EmployeePayslipDrawer 
        record={selectedRecord} 
        onClose={() => setSelectedRecord(null)} 
      />
    </div>
  )
}
