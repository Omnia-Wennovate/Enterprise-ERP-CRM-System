'use client'


import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type { Project, ProjectStatus, ProjectPriority } from '@/types/tech'
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, HEALTH_LABELS, HEALTH_COLORS } from '@/types/tech'
import { Loader2, Plus, Search, Filter, Code2, Calendar, ArrowUpDown } from 'lucide-react'
import { getProjects } from '@/lib/services/projects'
import Link from 'next/link'

export default function ProjectsListPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try { setProfile(JSON.parse(authUser)) } catch { router.push('/login') }
  }, [router])

  useEffect(() => {
    if (!profile) return
    loadProjects()
  }, [profile, statusFilter, priorityFilter])

  const loadProjects = async () => {
    try {
      setIsLoading(true)
      const data = await getProjects({
        status: statusFilter,
        priority: priorityFilter,
        search: search || undefined,
      })
      setProjects(data)
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    loadProjects()
  }

  if (!profile) return null

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F7FA]">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F33]">Software Projects</h1>
              <p className="text-sm text-[#4B6B7A] mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
            </div>
            <Link
              href="/tech/projects/new"
              className="flex items-center gap-2 px-4 py-2 bg-[#0A8FA8] text-white rounded-lg hover:bg-[#088096] transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              New Project
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-[#F0F7FA] border border-[#BFDBFE] rounded-lg px-3 py-2">
                <Search size={16} className="text-[#4B6B7A]" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-transparent text-sm text-[#0B1F33] placeholder-[#94A3B8] outline-none flex-1"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] bg-white"
              >
                <option value="all">All Statuses</option>
                {Object.entries(PROJECT_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] bg-white"
              >
                <option value="all">All Priorities</option>
                {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Project List */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-[#0A8FA8]" size={48} />
            </div>
          ) : projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map((project) => {
                const daysLeft = project.deadline
                  ? Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null
                return (
                  <Link key={project.id} href={`/tech/projects/${project.id}`}>
                    <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm hover:shadow-md transition-all p-5 cursor-pointer">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-base font-semibold text-[#0B1F33] truncate">{project.name}</h3>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                              style={{
                                backgroundColor: `${PROJECT_STATUS_COLORS[project.status]}15`,
                                color: PROJECT_STATUS_COLORS[project.status],
                              }}
                            >
                              {PROJECT_STATUS_LABELS[project.status]}
                            </span>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                              style={{
                                backgroundColor: `${PRIORITY_COLORS[project.priority]}15`,
                                color: PRIORITY_COLORS[project.priority],
                              }}
                            >
                              {PRIORITY_LABELS[project.priority]}
                            </span>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                              style={{
                                backgroundColor: `${HEALTH_COLORS[project.health_indicator]}15`,
                                color: HEALTH_COLORS[project.health_indicator],
                              }}
                            >
                              {HEALTH_LABELS[project.health_indicator]}
                            </span>
                          </div>
                          {project.description && (
                            <p className="text-sm text-[#4B6B7A] truncate mb-3">{project.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-[#4B6B7A]">
                            {project.start_date && (
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                Start: {new Date(project.start_date).toLocaleDateString()}
                              </span>
                            )}
                            {project.deadline && (
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                Deadline: {new Date(project.deadline).toLocaleDateString()}
                              </span>
                            )}
                            {project.budget > 0 && (
                              <span>Budget: ${project.budget.toLocaleString()}</span>
                            )}
                            {daysLeft !== null && daysLeft >= 0 && (
                              <span className={`font-medium ${
                                daysLeft <= 3 ? 'text-[#EF4444]' : daysLeft <= 7 ? 'text-[#F59E0B]' : 'text-[#10B981]'
                              }`}>
                                {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <p className="text-lg font-bold text-[#0B1F33]">{project.progress_percent}%</p>
                          <div className="w-24 h-2 bg-[#DBEAFE] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${project.progress_percent}%`,
                                backgroundColor: project.progress_percent >= 100 ? '#10B981' :
                                  project.progress_percent >= 50 ? '#3B82F6' : '#F59E0B',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-12 text-center">
              <Code2 size={48} className="mx-auto text-[#DBEAFE] mb-4" />
              <h3 className="text-lg font-semibold text-[#0B1F33] mb-2">No Projects Found</h3>
              <p className="text-sm text-[#4B6B7A] mb-6">
                {search || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'No projects match your filters. Try adjusting your search criteria.'
                  : 'Get started by creating your first software project.'}
              </p>
              <Link
                href="/tech/projects/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A8FA8] text-white rounded-lg hover:bg-[#088096] transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Create Project
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
