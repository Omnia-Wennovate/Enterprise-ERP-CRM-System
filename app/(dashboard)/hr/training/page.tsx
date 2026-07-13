'use client'

import { useState } from 'react'
import { LayoutDashboard, BookOpen, Calendar as CalendarIcon, Target, Medal, Plane, BarChart2 } from 'lucide-react'
import { TrainingDashboard } from '@/components/training/TrainingDashboard'
import { CourseList } from '@/components/training/CourseList'
import { CourseDetail } from '@/components/training/CourseDetail'
import { TrainingCalendar } from '@/components/training/TrainingCalendar'
import { LearningPathManager } from '@/components/training/LearningPathManager'
import { Leaderboard } from '@/components/training/Leaderboard'
import { ExternalTrainingForm } from '@/components/training/ExternalTrainingForm'

type TabId = 'dashboard' | 'courses' | 'calendar' | 'paths' | 'leaderboard' | 'external' | 'reports'

export default function TrainingPage() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'paths', label: 'Learning Paths', icon: Target },
    { id: 'leaderboard', label: 'Leaderboard', icon: Medal },
    { id: 'external', label: 'External', icon: Plane },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
  ] as const

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header & Tabs Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Training & LMS</h1>
              <p className="text-slate-600 mt-1">Enterprise Learning Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto no-scrollbar">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id && !selectedCourseId
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setSelectedCourseId(null)
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'dashboard' && !selectedCourseId && (
            <TrainingDashboard onViewCourses={() => setActiveTab('courses')} />
          )}

          {activeTab === 'courses' && !selectedCourseId && (
            <CourseList 
              onNew={() => console.log('new')} 
              onView={(id) => setSelectedCourseId(id)}
              onEdit={(id) => console.log('edit', id)}
            />
          )}

          {selectedCourseId && (
            <CourseDetail 
              courseId={selectedCourseId} 
              onBack={() => setSelectedCourseId(null)} 
            />
          )}

          {activeTab === 'calendar' && (
            <TrainingCalendar />
          )}

          {activeTab === 'paths' && (
            <LearningPathManager />
          )}

          {activeTab === 'leaderboard' && (
            <Leaderboard />
          )}

          {activeTab === 'external' && (
            <ExternalTrainingForm />
          )}

          {activeTab === 'reports' && (
            <div className="bg-white p-20 text-center rounded-xl border border-slate-200">
              <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900">Training Reports</h2>
              <p className="text-slate-500">Report generation interface coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
