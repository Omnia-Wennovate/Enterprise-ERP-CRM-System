'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line, PieChart, Pie, Cell, ComposedChart
} from 'recharts'
import { Maximize2, Download, Filter, ChevronDown } from 'lucide-react'

// Dummy data for the 15+ charts since we only get a few from the backend for now
const dummyData = {
  departments: [
    { name: 'Sales', value: 40 },
    { name: 'Engineering', value: 30 },
    { name: 'Marketing', value: 15 },
    { name: 'HR', value: 10 },
    { name: 'Finance', value: 5 },
  ],
  gender: [
    { name: 'Male', value: 55 },
    { name: 'Female', value: 42 },
    { name: 'Other', value: 3 },
  ],
  salaryDist: [
    { range: '<50k', count: 10 },
    { range: '50-80k', count: 35 },
    { range: '80-120k', count: 40 },
    { range: '120k+', count: 15 },
  ]
}

const COLORS = ['#C8A951', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E']

function ChartCard({ title, children, fullWidth = false }: { title: string, children: React.ReactNode, fullWidth?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div 
      layout
      className={`bg-card border border-border/50 rounded-2xl p-5 shadow-sm ${fullWidth ? 'col-span-full' : 'col-span-1'} ${isExpanded ? 'fixed inset-4 z-50 overflow-y-auto' : 'relative'}`}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <div className="flex gap-2">
          <button className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors">
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className={`w-full ${isExpanded ? 'h-[calc(100vh-150px)]' : 'h-[300px]'}`}>
        {children}
      </div>
    </motion.div>
  )
}

export function InteractiveAnalytics({ analyticsData }: { analyticsData: any }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Interactive Analytics</h2>
          <p className="text-muted-foreground">Deep dive into workforce metrics</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            Last 12 Months <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* 1. Employee Growth (Area) */}
        <ChartCard title="Employee Growth" fullWidth={true}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsData?.growthData || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C8A951" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#C8A951" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
              <XAxis dataKey="month" stroke="currentColor" className="text-muted-foreground text-xs" />
              <YAxis stroke="currentColor" className="text-muted-foreground text-xs" />
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="employees" stroke="#C8A951" strokeWidth={3} fillOpacity={1} fill="url(#colorGrowth)" animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2. Attendance Trend (Composed) */}
        <ChartCard title="Attendance Trend" fullWidth={true}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={analyticsData?.attendanceTrend || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
              <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground text-xs" />
              <YAxis stroke="currentColor" className="text-muted-foreground text-xs" />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="present" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} animationDuration={1500} />
              <Bar dataKey="late" stackId="a" fill="#F59E0B" animationDuration={1500} />
              <Bar dataKey="absent" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} animationDuration={1500} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 3. Department Distribution (Pie) */}
        <ChartCard title="Department Headcount">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dummyData.departments}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                animationDuration={1500}
              >
                {dummyData.departments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 4. Salary Distribution (Bar) */}
        <ChartCard title="Salary Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dummyData.salaryDist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="currentColor" className="opacity-10" />
              <XAxis type="number" stroke="currentColor" className="text-muted-foreground text-xs" />
              <YAxis dataKey="range" type="category" stroke="currentColor" className="text-muted-foreground text-xs" width={60} />
              <RechartsTooltip cursor={{ fill: 'transparent' }} />
              <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} animationDuration={1500}>
                {dummyData.salaryDist.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 5. Gender Diversity (Donut) */}
        <ChartCard title="Gender Diversity">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dummyData.gender}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                animationDuration={1500}
              >
                <Cell fill="#C8A951" />
                <Cell fill="#EC4899" />
                <Cell fill="#94A3B8" />
              </Pie>
              <RechartsTooltip />
              <Legend verticalAlign="middle" layout="vertical" align="right" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </div>
  )
}
