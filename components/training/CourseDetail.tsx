'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Clock, Users, Award, PlayCircle, FileText, 
  CheckCircle, Shield, Calendar, Edit, MessageSquare
} from 'lucide-react'
import type { TrainingCourse, TrainingModule } from '@/types/hr'

interface CourseDetailProps {
  courseId: string
  onBack: () => void
}

export function CourseDetail({ courseId, onBack }: CourseDetailProps) {
  const [course, setCourse] = useState<TrainingCourse | null>(null)
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'content' | 'enrollees' | 'discussions'>('content')

  useEffect(() => {
    loadCourseData()
  }, [courseId])

  const loadCourseData = async () => {
    try {
      setLoading(true)
      const [{ getCourseById, getModules }] = await Promise.all([
        import('@/lib/services/training')
      ])

      const [courseData, modulesData] = await Promise.all([
        getCourseById(courseId),
        getModules(courseId)
      ])

      setCourse(courseData)
      setModules(modulesData)
    } catch (err) {
      console.error('Failed to load course details:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-48 bg-slate-200 rounded-xl w-full" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="h-32 bg-slate-200 rounded" />
          </div>
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-20 bg-white rounded-xl">
        <h3 className="text-lg font-bold text-slate-900">Course not found</h3>
        <button onClick={onBack} className="text-teal-600 mt-2">Go back</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header / Hero */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-teal-800 to-sky-900 absolute top-0 left-0 right-0" />
        
        <div className="relative pt-6 px-6 pb-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to courses
          </button>

          <div className="flex items-start justify-between">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 flex-1 max-w-3xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg uppercase">
                  {course.category}
                </span>
                {course.is_mandatory && (
                  <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-lg uppercase flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Mandatory
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                {course.title}
              </h1>
              <p className="text-slate-600 mb-6">
                {course.description || 'No description provided.'}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {course.duration_hours} Hours
                </span>
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  {course.enrollment_count} Enrolled
                </span>
                <span className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-slate-400" />
                  {course.completion_count} Completed
                </span>
              </div>
            </div>

            <div className="hidden lg:flex gap-2 ml-4 mt-16">
              <button className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium">
                <Edit className="w-4 h-4" /> Edit Course
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium shadow-lg shadow-teal-600/20">
                <Users className="w-4 h-4" /> Assign Staff
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              {['content', 'enrollees', 'discussions'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors capitalize ${
                    activeTab === tab 
                      ? 'border-teal-600 text-teal-700' 
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center justify-between">
                    Course Modules
                    <span className="text-sm font-normal text-slate-500">{modules.length} Modules</span>
                  </h3>
                  
                  {modules.length > 0 ? (
                    <div className="space-y-3">
                      {modules.map((mod, i) => (
                        <div key={mod.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-teal-300 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-teal-600 font-bold border border-teal-100 shadow-sm">
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">{mod.title}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  {mod.content_type === 'video' ? <PlayCircle className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                  {mod.content_type}
                                </span>
                                {mod.duration_minutes > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {mod.duration_minutes}m
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <CheckCircle className="w-5 h-5 text-slate-300" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg">
                      <p className="text-slate-500 text-sm">No modules added to this course yet.</p>
                      <button className="mt-2 text-teal-600 font-medium text-sm">Add Module</button>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'enrollees' && (
                <div className="text-center py-10">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Enrollees list placeholder</p>
                </div>
              )}
              {activeTab === 'discussions' && (
                <div className="text-center py-10">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Course discussions placeholder</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Course Info</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Instructor</p>
                <p className="font-medium text-slate-900">{course.instructor_name || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Department</p>
                <p className="font-medium text-slate-900">{course.department || 'General'}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Difficulty</p>
                <p className="font-medium text-slate-900 capitalize">{course.difficulty}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Passing Score</p>
                <p className="font-medium text-slate-900">{course.passing_score}%</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Expiry</p>
                <p className="font-medium text-slate-900">{course.expiry_months ? `${course.expiry_months} months` : 'Never expires'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
