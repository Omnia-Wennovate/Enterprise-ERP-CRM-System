'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type { Project } from '@/types/tech'
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, HEALTH_LABELS, HEALTH_COLORS } from '@/types/tech'
import { Loader2, Plus, Search, Code2, Calendar, Archive, LayoutGrid } from 'lucide-react'
import { getProjects } from '@/lib/services/projects'
import { getArchivedProjects } from '@/lib/services/project-archive'
import Link from 'next/link'

type TabType = 'active' | 'archived'

export default function ProjectsListPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<TabType>('active')

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try { setProfile(JSON.parse(authUser)) } catch { router.push('/login') }
  }, [router])

  useEffect(() => {
    if (!profile) return
    loadProjects()
  }, [profile, statusFilter, priorityFilter, activeTab])

  const loadProjects = async () => {
    try {
      setIsLoading(true)
      
      let data: Project[] = []
      
      if (activeTab === 'active') {
        data = await getProjects({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          search: search || undefined,
        })
        // Filter out completed and archived if status filter is 'all'
        if (statusFilter === 'all') {
          data = data.filter(p => p.status !== 'completed' && p.status !== 'archived')
        }
      } else {
        // Archived tab
        data = await getArchivedProjects({
          search: search || undefined,
        })
      }
      
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
            <div className="flex items-center gap-3">
              <Link
                href="/tech/archive"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#DBEAFE] text-[#0A8FA8] rounded-lg hover:bg-[#F0F7FA] transition-colors text-sm font-medium shadow-sm"
              >
                <Archive size={16} />
                Archive Analytics
              </Link>
              <Link
                href="/tech/projects/new"
                className="flex items-center gap-2 px-4 py-2 bg-[#0A8FA8] text-white rounded-lg hover:bg-[#088096] transition-colors text-sm font-medium shadow-sm"
              >
                <Plus size={16} />
                New Project
              </Link>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-[#BFDBFE] mb-6">
            <button
              onClick={() => { setActiveTab('active'); setStatusFilter('all'); }}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'active' 
                  ? 'border-[#0A8FA8] text-[#0A8FA8] bg-white rounded-t-lg' 
                  : 'border-transparent text-[#4B6B7A] hover:text-[#0B1F33] hover:border-[#94A3B8]'
              }`}
            >
              <LayoutGrid size={16} />
              Active Projects
            </button>
            <button
              onClick={() => { setActiveTab('archived'); setStatusFilter('all'); }}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'archived' 
                  ? 'border-[#0A8FA8] text-[#0A8FA8] bg-white rounded-t-lg' 
                  : 'border-transparent text-[#4B6B7A] hover:text-[#0B1F33] hover:border-[#94A3B8]'
              }`}
            >
              <Archive size={16} />
              Archived & Completed
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-[#F0F7FA] border border-[#BFDBFE] rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#0A8FA8] focus-within:border-transparent transition-shadow">
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
              
              {activeTab === 'active' && (
                <>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] bg-white hover:border-[#0A8FA8] transition-colors focus:ring-2 focus:ring-[#0A8FA8] outline-none"
                  >
                    <option value="all">All Statuses</option>
                    {Object.entries(PROJECT_STATUS_LABELS)
                      .filter(([key]) => key !== 'completed' && key !== 'archived')
                      .map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] bg-white hover:border-[#0A8FA8] transition-colors focus:ring-2 focus:ring-[#0A8FA8] outline-none"
                  >
                    <option value="all">All Priorities</option>
                    {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </>
              )}
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
                    <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm hover:shadow-md hover:border-[#0A8FA8] transition-all p-5 cursor-pointer group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-base font-semibold text-[#0B1F33] truncate group-hover:text-[#0A8FA8] transition-colors">{project.name}</h3>
                            <span
                              className="text-xs px-2.5 py-1 rounded-md font-semibold flex-shrink-0"
                              style={{
                                backgroundColor: `${PROJECT_STATUS_COLORS[project.status]}15`,
                                color: PROJECT_STATUS_COLORS[project.status],
                                border: `1px solid ${PROJECT_STATUS_COLORS[project.status]}30`
                              }}
                            >
                              {PROJECT_STATUS_LABELS[project.status]}
                            </span>
                            <span
                              className="text-xs px-2.5 py-1 rounded-md font-semibold flex-shrink-0"
                              style={{
                                backgroundColor: `${PRIORITY_COLORS[project.priority]}15`,
                                color: PRIORITY_COLORS[project.priority],
                                border: `1px solid ${PRIORITY_COLORS[project.priority]}30`
                              }}
                            >
                              {PRIORITY_LABELS[project.priority]}
                            </span>
                            {project.health_indicator && (
                              <span
                                className="text-xs px-2.5 py-1 rounded-md font-semibold flex-shrink-0"
                                style={{
                                  backgroundColor: `${HEALTH_COLORS[project.health_indicator]}15`,
                                  color: HEALTH_COLORS[project.health_indicator],
                                  border: `1px solid ${HEALTH_COLORS[project.health_indicator]}30`
                                }}
                              >
                                {HEALTH_LABELS[project.health_indicator]}
                              </span>
                            )}
                          </div>
                          {project.description && (
                            <p className="text-sm text-[#4B6B7A] truncate mb-3">{project.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-[#4B6B7A] font-medium">
                            {project.start_date && (
                              <span className="flex items-center gap-1.5 bg-[#F0F7FA] px-2 py-1 rounded-md">
                                <Calendar size={14} className="text-[#0A8FA8]" />
                                Start: {new Date(project.start_date).toLocaleDateString()}
                              </span>
                            )}
                            {project.deadline && (
                              <span className="flex items-center gap-1.5 bg-[#F0F7FA] px-2 py-1 rounded-md">
                                <Calendar size={14} className="text-[#0A8FA8]" />
                                Deadline: {new Date(project.deadline).toLocaleDateString()}
                              </span>
                            )}
                            {project.budget > 0 && (
                              <span className="bg-[#F0F7FA] px-2 py-1 rounded-md text-[#0A8FA8]">
                                Budget: ${project.budget.toLocaleString()}
                              </span>
                            )}
                            {activeTab === 'active' && daysLeft !== null && daysLeft >= 0 && (
                              <span className={`px-2 py-1 rounded-md ${
                                daysLeft <= 3 ? 'bg-[#FEF2F2] text-[#EF4444]' : daysLeft <= 7 ? 'bg-[#FFFBEB] text-[#F59E0B]' : 'bg-[#ECFDF5] text-[#10B981]'
                              }`}>
                                {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {activeTab === 'active' && (
                          <div className="flex flex-col items-end gap-2 flex-shrink-0 bg-[#F0F7FA] p-3 rounded-lg border border-[#DBEAFE]">
                            <div className="flex items-baseline gap-1">
                              <p className="text-2xl font-bold text-[#0B1F33] leading-none">{project.progress_percent}</p>
                              <span className="text-sm font-semibold text-[#4B6B7A]">%</span>
                            </div>
                            <div className="w-24 h-2.5 bg-[#DBEAFE] rounded-full overflow-hidden shadow-inner">
                              <div
                                className="h-full rounded-full transition-all duration-500 shadow-sm"
                                style={{
                                  width: `${project.progress_percent}%`,
                                  backgroundColor: project.progress_percent >= 100 ? '#10B981' :
                                    project.progress_percent >= 50 ? '#0A8FA8' : '#F59E0B',
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-[#F0F7FA] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#BFDBFE]">
                {activeTab === 'archived' ? (
                  <Archive size={32} className="text-[#0A8FA8]" />
                ) : (
                  <Code2 size={32} className="text-[#0A8FA8]" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-[#0B1F33] mb-2">
                {activeTab === 'archived' ? 'No Archived Projects' : 'No Projects Found'}
              </h3>
              <p className="text-sm text-[#4B6B7A] mb-6 max-w-md mx-auto">
                {search || (statusFilter !== 'all') || (priorityFilter !== 'all')
                  ? 'No projects match your filters. Try adjusting your search criteria.'
                  : activeTab === 'archived' 
                    ? 'Projects that are marked as Completed or Archived will appear here.'
                    : 'Get started by creating your first software project.'}
              </p>
              {activeTab === 'active' && !search && statusFilter === 'all' && (
                <Link
                  href="/tech/projects/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A8FA8] text-white rounded-lg hover:bg-[#088096] transition-colors text-sm font-semibold shadow-md hover:shadow-lg"
                >
                  <Plus size={18} />
                  Create Your First Project
                </Link>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
