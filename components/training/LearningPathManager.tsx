'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, Plus, Search, BookOpen, Shield, Users, CheckCircle, ArrowRight } from 'lucide-react'
import type { LearningPath } from '@/types/hr'

export function LearningPathManager() {
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [nonCompliant, setNonCompliant] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPaths()
  }, [])

  const loadPaths = async () => {
    try {
      setLoading(true)
      const { getLearningPaths, getNonCompliantCount } = await import('@/lib/services/learning-paths')
      const [pathsData, nonComp] = await Promise.all([
        getLearningPaths(),
        getNonCompliantCount()
      ])
      setPaths(pathsData)
      setNonCompliant(nonComp)
    } catch (err) {
      console.error('Failed to load learning paths:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-card p-6 rounded-xl border border-border/80 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-omnia-gold" />
              Role-Based Learning Paths
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Manage mandatory course sequences for onboarding and roles.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-omnia-gold text-primary-foreground rounded-lg hover:bg-omnia-gold-dark transition-colors text-sm font-medium shadow-sm shadow-teal-600/20">
            <Plus className="w-4 h-4" /> Create Path
          </button>
        </div>

        <div className="bg-rose-50 border border-rose-100 p-6 rounded-xl w-full md:w-64 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-rose-600 font-semibold mb-1">
            <Shield className="w-4 h-4" /> Non-Compliant Staff
          </div>
          <p className="text-3xl font-bold text-rose-700">{nonCompliant}</p>
          <p className="text-xs text-rose-600/80 mt-1">Employees missing required paths</p>
        </div>
      </div>

      {/* Path List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-card rounded-xl border border-border animate-pulse" />)}
        </div>
      ) : paths.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {paths.map((path, idx) => (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card rounded-xl border border-border/80 p-6 hover:border-omnia-gold/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {path.is_mandatory && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded uppercase">
                        Mandatory
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-muted text-slate-700 rounded uppercase">
                      {path.department || 'All Departments'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{path.name}</h3>
                  {path.description && (
                    <p className="text-sm text-muted-foreground mt-1">{path.description}</p>
                  )}
                </div>
                <button className="text-omnia-gold text-sm font-medium hover:text-omnia-gold-dark">Edit</button>
              </div>

              {/* Course Sequence */}
              <div className="mt-6 bg-muted/50 rounded-lg p-4 border border-slate-100">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Course Sequence</h4>
                
                <div className="space-y-2">
                  {path.courses && path.courses.length > 0 ? (
                    path.courses.sort((a, b) => a.sort_order - b.sort_order).map((pc, i) => (
                      <div key={pc.id} className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-card border-2 border-omnia-gold text-omnia-gold flex items-center justify-center text-xs font-bold z-10 relative">
                            {i + 1}
                          </div>
                          {i < path.courses!.length - 1 && (
                            <div className="w-0.5 h-6 bg-teal-200 absolute mt-6" />
                          )}
                        </div>
                        <div className="flex-1 bg-card border border-border rounded p-2 text-sm text-slate-700 font-medium truncate">
                          {pc.course?.title || 'Unknown Course'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground italic">No courses in this path yet.</div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-muted-foreground" /> {path.course_count} Courses</span>
                </div>
                <button className="flex items-center gap-1.5 text-sm font-medium text-slate-700 bg-card border border-border px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <Users className="w-4 h-4 text-muted-foreground" /> Assign to Staff
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-xl border border-border/80">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No Learning Paths</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Create structured sequences of courses that employees must complete for onboarding or role compliance.
          </p>
          <button className="text-omnia-gold hover:text-omnia-gold-dark font-medium text-sm">
            Create your first path
          </button>
        </div>
      )}
    </div>
  )
}
