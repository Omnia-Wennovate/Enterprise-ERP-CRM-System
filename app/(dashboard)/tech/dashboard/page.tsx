'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type { TechDashboardStats, Project, FeatureRequest, WorkloadScore, ArchiveAnalytics } from '@/types/tech'
import { PROJECT_STATUS_COLORS, FR_STATUS_COLORS, PRIORITY_COLORS } from '@/types/tech'
import {
  Loader2, Cpu, Code2, GitBranch, AlertTriangle, CheckCircle2,
  Clock, Users, TrendingUp, ArrowUpRight, Bug, Layers,
  Plus, Calendar, BarChart3, Archive, KeyRound, Activity
} from 'lucide-react'
import { getTechDashboardStats, getRecentProjects, getProjectsNearDeadline } from '@/lib/services/projects'
import { getFeatureRequests } from '@/lib/services/feature-requests'
import { getAllTechTeamWorkload } from '@/lib/services/tech-workload'
import { getArchiveAnalytics } from '@/lib/services/project-archive'
import Link from 'next/link'

export default function TechDashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<TechDashboardStats | null>(null)
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [nearDeadline, setNearDeadline] = useState<Project[]>([])
  const [recentRequests, setRecentRequests] = useState<FeatureRequest[]>([])
  const [teamWorkload, setTeamWorkload] = useState<WorkloadScore[]>([])
  const [archiveStats, setArchiveStats] = useState<ArchiveAnalytics | null>(null)

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try {
      setProfile(JSON.parse(authUser))
    } catch { router.push('/login') }
  }, [router])

  useEffect(() => {
    if (!profile) return
    loadData()
  }, [profile])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [s, rp, nd, rr, tw, as] = await Promise.all([
        getTechDashboardStats(),
        getRecentProjects(5),
        getProjectsNearDeadline(7),
        getFeatureRequests({ status: 'requested' }),
        getAllTechTeamWorkload(),
        getArchiveAnalytics()
      ])
      setStats(s)
      setRecentProjects(rp)
      setNearDeadline(nd)
      setRecentRequests(rr)
      setTeamWorkload(tw)
      setArchiveStats(as)
    } catch (err) {
      console.error('Failed to load tech dashboard:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile) return null

  const statCards = [
    { icon: Code2, label: 'Active Projects', value: stats?.activeProjects || 0, color: '#3B82F6', href: '/tech/projects' },
    { icon: Archive, label: 'Archived Projects', value: archiveStats?.archivedProjects || 0, color: '#64748B', href: '/tech/archive' },
    { icon: Clock, label: 'Near Deadline', value: stats?.projectsNearDeadline || 0, color: '#F59E0B', href: '/tech/projects' },
    { icon: CheckCircle2, label: 'Completed', value: stats?.completedProjects || 0, color: '#10B981', href: '/tech/projects' },
    { icon: GitBranch, label: 'Total Requests', value: stats?.totalRequests || 0, color: '#8B5CF6', href: '/tech/feature-requests' },
    { icon: Bug, label: 'In Maintenance', value: archiveStats?.maintenanceProjects || 0, color: '#EF4444', href: '/tech/archive' },
    { icon: Activity, label: 'Repo Health', value: `${archiveStats?.repositoryHealth || 0}%`, color: '#0A8FA8', href: '/tech/archive' },
    { icon: Users, label: 'Team Size', value: stats?.teamSize || 0, color: '#6366F1', href: '/tech/team' },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F7FA]">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-[#0A8FA8]" size={48} />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-[#0B1F33]">Technology Dashboard</h1>
                  <p className="text-sm text-[#4B6B7A] mt-1">Software project management & feature request operations</p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/tech/archive"
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#DBEAFE] text-[#0A8FA8] rounded-lg hover:bg-[#F0F7FA] transition-colors text-sm font-medium shadow-sm"
                  >
                    <Archive size={16} />
                    View Archive
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

              {/* KPI Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((card, i) => {
                  const Icon = card.icon
                  return (
                    <Link key={i} href={card.href}>
                      <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm hover:shadow-md hover:border-[#0A8FA8] transition-all p-5 cursor-pointer group">
                        <div className="w-full h-1 -mx-5 -mt-5 mb-4 rounded-t-xl opacity-80 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: card.color }} />
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-xs text-[#4B6B7A] font-medium group-hover:text-[#0B1F33] transition-colors">{card.label}</p>
                            <p className="text-2xl font-bold text-[#0B1F33] mt-1">{card.value}</p>
                          </div>
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: `${card.color}15` }}>
                            <Icon size={20} style={{ color: card.color }} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Recent Projects */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#0B1F33]">Recent Projects</h3>
                    <Link href="/tech/projects" className="text-xs text-[#0A8FA8] hover:underline font-medium">View All</Link>
                  </div>
                  {recentProjects.length > 0 ? (
                    <div className="space-y-3">
                      {recentProjects.map((project) => (
                        <Link key={project.id} href={`/tech/projects/${project.id}`}>
                          <div className="flex items-center justify-between p-3 bg-[#F0F7FA] rounded-lg hover:bg-[#E0EEF5] transition-colors cursor-pointer group">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#0B1F33] truncate group-hover:text-[#0A8FA8] transition-colors">{project.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                                  style={{
                                    backgroundColor: `${PROJECT_STATUS_COLORS[project.status]}15`,
                                    color: PROJECT_STATUS_COLORS[project.status],
                                    border: `1px solid ${PROJECT_STATUS_COLORS[project.status]}30`
                                  }}
                                >
                                  {project.status.replace(/_/g, ' ')}
                                </span>
                                <span
                                  className="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                                  style={{
                                    backgroundColor: `${PRIORITY_COLORS[project.priority]}15`,
                                    color: PRIORITY_COLORS[project.priority],
                                    border: `1px solid ${PRIORITY_COLORS[project.priority]}30`
                                  }}
                                >
                                  {project.priority}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-bold text-[#0B1F33]">{project.progress_percent}%</p>
                                <p className="text-[10px] text-[#4B6B7A] uppercase tracking-wider font-semibold">progress</p>
                              </div>
                              <div className="w-16 h-2 bg-[#DBEAFE] rounded-full overflow-hidden shadow-inner">
                                <div
                                  className="h-full rounded-full transition-all duration-500 shadow-sm"
                                  style={{
                                    width: `${project.progress_percent}%`,
                                    backgroundColor: PROJECT_STATUS_COLORS[project.status],
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-[#4B6B7A]">
                      <Code2 size={32} className="mb-2 text-[#DBEAFE]" />
                      <p className="text-sm font-medium">No projects yet. Create your first project!</p>
                    </div>
                  )}
                </div>

                {/* Team Workload */}
                <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#0B1F33]">Team Workload</h3>
                    <Link href="/tech/team" className="text-xs text-[#0A8FA8] hover:underline font-medium">View All</Link>
                  </div>
                  {teamWorkload.length > 0 ? (
                    <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      {teamWorkload.map((member) => (
                        <div key={member.profile_id} className="flex items-center justify-between p-3 bg-[#F0F7FA] rounded-lg border border-transparent hover:border-[#BFDBFE] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-[#0A8FA8] to-[#088096] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                              {member.first_name?.[0]}{member.last_name?.[0]}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#0B1F33]">{member.first_name} {member.last_name}</p>
                              <p className="text-[11px] text-[#4B6B7A] uppercase tracking-wider font-medium">{member.position}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-bold text-[#0B1F33]">{member.total_items} <span className="font-medium text-[#4B6B7A]">items</span></span>
                            <span
                              className="w-12 h-1.5 rounded-full shadow-inner"
                              style={{ backgroundColor: member.color }}
                              title={member.level}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-[#4B6B7A] flex-1">
                      <Users size={32} className="mb-2 text-[#DBEAFE]" />
                      <p className="text-sm font-medium">No tech team members found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Feature Requests */}
                <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#0B1F33]">Pending Feature Requests</h3>
                    <Link href="/tech/feature-requests" className="text-xs text-[#0A8FA8] hover:underline font-medium">View All</Link>
                  </div>
                  {recentRequests.length > 0 ? (
                    <div className="space-y-3">
                      {recentRequests.slice(0, 5).map((req) => (
                        <Link key={req.id} href={`/tech/feature-requests/${req.id}`}>
                          <div className="flex items-start justify-between p-3 bg-[#F0F7FA] rounded-lg hover:bg-[#E0EEF5] transition-colors cursor-pointer group">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#0B1F33] truncate group-hover:text-[#0A8FA8] transition-colors">{req.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] text-[#4B6B7A] uppercase tracking-wider font-semibold">{req.department}</span>
                                <span className="text-xs text-[#94A3B8]">•</span>
                                <span
                                  className="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                                  style={{
                                    backgroundColor: `${PRIORITY_COLORS[req.priority]}15`,
                                    color: PRIORITY_COLORS[req.priority],
                                    border: `1px solid ${PRIORITY_COLORS[req.priority]}30`
                                  }}
                                >
                                  {req.priority}
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] px-2.5 py-1 rounded-md bg-[#FFFBEB] text-[#F59E0B] font-bold border border-[#FDE68A] shadow-sm uppercase tracking-wider">
                              Pending
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-[#4B6B7A]">
                      <GitBranch size={32} className="mb-2 text-[#DBEAFE]" />
                      <p className="text-sm font-medium">No pending feature requests</p>
                    </div>
                  )}
                </div>

                {/* Projects Near Deadline */}
                <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#0B1F33]">⚠️ Near Deadline</h3>
                    <Link href="/tech/projects" className="text-xs text-[#0A8FA8] hover:underline font-medium">View All</Link>
                  </div>
                  {nearDeadline.length > 0 ? (
                    <div className="space-y-3">
                      {nearDeadline.map((project) => {
                        const daysLeft = project.deadline
                          ? Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                          : null
                        return (
                          <Link key={project.id} href={`/tech/projects/${project.id}`}>
                            <div className="flex items-center justify-between p-3 bg-[#FEF3C7] rounded-lg hover:bg-[#FDE68A] transition-colors cursor-pointer border border-[#FDE68A]">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#92400E] truncate">{project.name}</p>
                                <p className="text-[11px] text-[#B45309] mt-1 font-medium uppercase tracking-wider flex items-center gap-1.5">
                                  <Calendar size={12} />
                                  {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                                </p>
                              </div>
                              {daysLeft !== null && (
                                <span className={`text-[11px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider shadow-sm border ${
                                  daysLeft <= 1 ? 'bg-[#FEF2F2] text-[#EF4444] border-[#FECACA]' :
                                  daysLeft <= 3 ? 'bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]' :
                                  'bg-[#EFF6FF] text-[#3B82F6] border-[#BFDBFE]'
                                }`}>
                                  {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                                </span>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-[#4B6B7A]">
                      <Calendar size={32} className="mb-2 text-[#DBEAFE]" />
                      <p className="text-sm font-medium">No projects near deadline</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6 mt-6">
                <h3 className="font-semibold text-[#0B1F33] mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-[#0A8FA8]" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'New Project', href: '/tech/projects/new', icon: Plus, color: '#10B981', bg: '#ECFDF5' },
                    { label: 'Project Archive', href: '/tech/archive', icon: Archive, color: '#64748B', bg: '#F1F5F9' },
                    { label: 'Credential Vault', href: '/tech/credentials', icon: KeyRound, color: '#F59E0B', bg: '#FFFBEB' },
                    { label: 'All Projects', href: '/tech/projects', icon: Code2, color: '#3B82F6', bg: '#EFF6FF' },
                    { label: 'All Requests', href: '/tech/feature-requests', icon: GitBranch, color: '#8B5CF6', bg: '#F5F3FF' },
                    { label: 'Tech Team', href: '/tech/team', icon: Users, color: '#0A8FA8', bg: '#F0F7FA' },
                  ].map((action, i) => {
                    const Icon = action.icon
                    return (
                      <button
                        key={i}
                        onClick={() => router.push(action.href)}
                        className="flex flex-col items-center gap-3 p-4 rounded-xl border border-[#DBEAFE] hover:border-[#0A8FA8] hover:shadow-md transition-all group bg-white"
                      >
                        <div className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: action.bg, color: action.color }}>
                          <Icon size={24} />
                        </div>
                        <span className="text-xs font-semibold text-[#0B1F33] group-hover:text-[#0A8FA8] transition-colors">{action.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
