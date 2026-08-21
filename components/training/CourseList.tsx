'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Plus, FileDown } from 'lucide-react'
import { CourseCard } from './CourseCard'
import type { TrainingCourse, TrainingFilters } from '@/types/hr'
import { COURSE_CATEGORIES, DEPARTMENTS } from '@/types/hr'

interface CourseListProps {
  onNew: () => void
  onView: (id: string) => void
  onEdit: (id: string) => void
}

export function CourseList({ onNew, onView, onEdit }: CourseListProps) {
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<TrainingFilters>({
    search: '',
    status: 'all',
    category: 'all',
    department: 'all',
    difficulty: 'all',
    mandatory: 'all',
  })

  useEffect(() => {
    loadCourses()
  }, [filters])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const { getCourses } = await import('@/lib/services/training')
      const data = await getCourses(filters)
      setCourses(data)
    } catch (err) {
      console.error('Failed to load courses:', err)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = (id: string) => {
    // Open assignment modal (to be implemented)
    console.log('Assign', id)
  }

  const handleDuplicate = async (id: string) => {
    try {
      const { duplicateCourse } = await import('@/lib/services/training')
      await duplicateCourse(id)
      loadCourses()
    } catch (err) {
      console.error('Failed to duplicate:', err)
    }
  }

  const handleArchive = async (id: string) => {
    try {
      if (!confirm('Are you sure you want to archive this course?')) return
      const { updateCourse } = await import('@/lib/services/training')
      await updateCourse(id, { status: 'archived' })
      loadCourses()
    } catch (err) {
      console.error('Failed to archive:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search courses by name, description, or instructor..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-omnia-gold text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-muted border-border text-foreground' 
                : 'bg-card border-border text-slate-700 hover:bg-muted/50'
            }`}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-card border border-border text-slate-700 rounded-lg hover:bg-muted/50 transition-colors">
            <FileDown className="w-4 h-4" /> Export
          </button>
          
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-omnia-gold text-primary-foreground rounded-lg hover:bg-omnia-gold-dark transition-colors shadow-sm shadow-teal-600/20"
          >
            <Plus className="w-4 h-4" /> New Course
          </button>
        </div>
      </div>

      {/* Expandable Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card p-5 rounded-xl border border-border/80 grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-omnia-gold"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Category</label>
                <select 
                  value={filters.category}
                  onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-omnia-gold"
                >
                  <option value="all">All Categories</option>
                  {COURSE_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Department</label>
                <select 
                  value={filters.department}
                  onChange={(e) => setFilters(f => ({ ...f, department: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-omnia-gold"
                >
                  <option value="all">All Departments</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Difficulty</label>
                <select 
                  value={filters.difficulty}
                  onChange={(e) => setFilters(f => ({ ...f, difficulty: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-omnia-gold"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Requirement</label>
                <select 
                  value={filters.mandatory}
                  onChange={(e) => setFilters(f => ({ ...f, mandatory: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-omnia-gold"
                >
                  <option value="all">All</option>
                  <option value="mandatory">Mandatory Only</option>
                  <option value="optional">Optional Only</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl h-64 animate-pulse border border-border/80" />
          ))}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course, idx) => (
            <CourseCard
              key={course.id}
              course={course}
              index={idx}
              onView={onView}
              onEdit={onEdit}
              onAssign={handleAssign}
              onDuplicate={handleDuplicate}
              onArchive={handleArchive}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-xl border border-border/80">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No courses found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            We couldn't find any training courses matching your current filters.
          </p>
          <button
            onClick={() => setFilters({
              search: '', status: 'all', category: 'all', department: 'all', difficulty: 'all', mandatory: 'all'
            })}
            className="text-omnia-gold hover:text-omnia-gold-dark font-medium text-sm"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
