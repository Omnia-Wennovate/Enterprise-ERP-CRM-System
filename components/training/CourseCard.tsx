'use client'

import { motion } from 'framer-motion'
import { Clock, Users, Award, Star, BookOpen, Tag, MoreVertical, Eye, Pencil, Copy, Archive, UserPlus } from 'lucide-react'
import type { TrainingCourse } from '@/types/hr'

interface CourseCardProps {
  course: TrainingCourse
  onView: (id: string) => void
  onEdit: (id: string) => void
  onAssign: (id: string) => void
  onDuplicate: (id: string) => void
  onArchive: (id: string) => void
  index?: number
}

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  beginner: { label: 'Beginner', color: 'bg-green-50 text-green-700 border-green-200' },
  intermediate: { label: 'Intermediate', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  advanced: { label: 'Advanced', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  expert: { label: 'Expert', color: 'bg-red-50 text-red-700 border-red-200' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-50 text-green-700' },
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600' },
  archived: { label: 'Archived', color: 'bg-amber-50 text-amber-700' },
}

export function CourseCard({ course, onView, onEdit, onAssign, onDuplicate, onArchive, index = 0 }: CourseCardProps) {
  const difficulty = DIFFICULTY_CONFIG[course.difficulty] || DIFFICULTY_CONFIG.beginner
  const status = STATUS_CONFIG[course.status] || STATUS_CONFIG.active
  const completionPercent = course.enrollment_count > 0
    ? Math.round((course.completion_count / course.enrollment_count) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group bg-white rounded-xl border border-slate-200/80 overflow-hidden hover:shadow-lg hover:border-teal-200 transition-all"
    >
      {/* Cover / Header */}
      <div className="relative h-2 bg-gradient-to-r from-teal-500 via-sky-500 to-blue-500">
        {course.is_mandatory && (
          <div className="absolute top-2 left-3 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded uppercase">
            Mandatory
          </div>
        )}
      </div>

      <div className="p-5">
        {/* Top Row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${status.color}`}>
                {status.label}
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${difficulty.color}`}>
                {difficulty.label}
              </span>
              {course.category && (
                <span className="px-2 py-0.5 text-[10px] font-medium text-slate-500 bg-slate-50 rounded-full">
                  {course.category}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 truncate">{course.title}</h3>
            {course.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{course.description}</p>
            )}
          </div>

          {/* Actions Dropdown */}
          <div className="relative group/menu flex-shrink-0">
            <button className="p-1.5 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-10 w-40 hidden group-hover/menu:block">
              <button onClick={() => onView(course.id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <Eye className="w-3.5 h-3.5" /> View Details
              </button>
              <button onClick={() => onEdit(course.id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => onAssign(course.id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <UserPlus className="w-3.5 h-3.5" /> Assign
              </button>
              <button onClick={() => onDuplicate(course.id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
              <button onClick={() => onArchive(course.id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                <Archive className="w-3.5 h-3.5" /> Archive
              </button>
            </div>
          </div>
        </div>

        {/* Instructor & Department */}
        <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
          {course.instructor_name && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {course.instructor_name}
            </span>
          )}
          {course.department && (
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" /> {course.department}
            </span>
          )}
          {course.duration_hours && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {course.duration_hours}h
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500">Completion</span>
            <span className="font-semibold text-slate-700">{completionPercent}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercent}%` }}
              transition={{ duration: 0.8, delay: index * 0.05 }}
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-sky-500"
            />
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {course.enrollment_count}
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3" /> {course.completion_count}
            </span>
            {course.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                {course.rating.toFixed(1)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onView(course.id)}
              className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
            >
              Details
            </button>
            <button
              onClick={() => onAssign(course.id)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Assign
            </button>
          </div>
        </div>

        {/* Tags */}
        {course.tags && course.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {course.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 text-[10px] bg-slate-50 text-slate-500 rounded">
                {tag}
              </span>
            ))}
            {course.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] text-slate-400">+{course.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
