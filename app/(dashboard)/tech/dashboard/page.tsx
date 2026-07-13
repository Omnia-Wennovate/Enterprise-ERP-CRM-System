'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type { TechDashboardStats, Project, FeatureRequest, WorkloadScore } from '@/types/tech'
import { PROJECT_STATUS_COLORS, FR_STATUS_COLORS, PRIORITY_COLORS } from '@/types/tech'
import {
  Loader2, Cpu, Code2, GitBranch, AlertTriangle, CheckCircle2,
  Clock, Users, TrendingUp, ArrowUpRight, Bug, Layers,
  Plus, Calendar, BarChart3
} from 'lucide-react'
import { getTechDashboardStats, getRecentProjects, getProjectsNearDeadline } from '@/lib/services/projects'
import { getFeatureRequests } from '@/lib/services/feature-requests'
import { getAllTechTeamWorkload } from '@/lib/services/tech-workload'
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
      const [s, rp, nd, rr, tw] = await Promise.all([
        getTechDashboardStats(),
        getRecentProjects(5),
        getProjectsNearDeadline(7),
        getFeatureRequests({ status: 'requested' }),
        getAllTechTeamWorkload(),
      ])
      setStats(s)
      setRecentProjects(rp)
      setNearDeadline(nd)
      setRecentRequests(rr)
      setTeamWorkload(tw)
    } catch (err) {
      console.error('Failed to load tech dashboard:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile) return null

  const statCards = [
    { icon: Code2, label: 'Active Projects', value: stats?.activeProjects || 0, color: '#3B82F6', href: '/tech/projects' },
    { icon: Clock, label: 'Near Deadline', value: stats?.projectsNearDeadline || 0, color: '#F59E0B', href: '/tech/projects' },
    { icon: AlertTriangle, label: 'Delayed Projects', value: stats?.delayedProjects || 0, color: '#EF4444', href: '/tech/projects' },
    { icon: CheckCircle2, label: 'Completed', value: stats?.completedProjects || 0, color: '#10B981', href: '/tech/projects' },
    { icon: GitBranch, label: 'Total Requests', value: stats?.totalRequests || 0, color: '#8B5CF6', href: '/tech/feature-requests' },
    { icon: Layers, label: 'Pending Approval', value: stats?.pendingApproval || 0, color: '#F97316', href: '/tech/feature-requests' },
    { icon: Bug, label: 'In Development', value: stats?.inDevelopment || 0, color: '#0A8FA8', href: '/tech/feature-requests' },
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
                    href="/tech/projects/new"
                    className="flex items-center gap-2 px-4 py-2 bg-[#0A8FA8] text-white rounded-lg hover:bg-[#088096] transition-colors text-sm font-medium"
                  >
                    <Plus size={16} />
                    New Project
                  </Link>
                  <Link
                    href="/tech/feature-requests/new"
                    className="flex items-center gap-2 px-4 py-2 border border-[#0A8FA8] text-[#0A8FA8] rounded-lg hover:bg-[#0A8FA8]/10 transition-colors text-sm font-medium"
                  >
                    <Plus size={16} />
                    New Request
                  </Link>
                </div>
              </div>

              {/* KPI Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((card, i) => {
                  const Icon = card.icon
                  return (
                    <Link key={i} href={card.href}>
                      <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm hover:shadow-md transition-all p-5 cursor-pointer">
                        <div className="w-full h-1 -mx-5 -mt-5 mb-4 rounded-t-xl" style={{ backgroundColor: card.color }} />
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-xs text-[#4B6B7A] font-medium">{card.label}</p>
                            <p className="text-2xl font-bold text-[#0B1F33] mt-1">{card.value}</p>
                          </div>
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}20` }}>
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
                    <Link href="/tech/projects" className="text-xs text-[#0A8FA8] hover:underline">View All</Link>
                  </div>
                  {recentProjects.length > 0 ? (
                    <div className="space-y-3">
                      {recentProjects.map((project) => (
                        <Link key={project.id} href={`/tech/projects/${project.id}`}>
                          <div className="flex items-center justify-between p-3 bg-[#F0F7FA] rounded-lg hover:bg-[#E0EEF5] transition-colors cursor-pointer">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#0B1F33] truncate">{project.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    backgroundColor: `${PROJECT_STATUS_COLORS[project.status]}15`,
                                    color: PROJECT_STATUS_COLORS[project.status],
                                  }}
                                >
                                  {project.status.replace(/_/g, ' ')}
                                </span>
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    backgroundColor: `${PRIORITY_COLORS[project.priority]}15`,
                                    color: PRIORITY_COLORS[project.priority],
                                  }}
                                >
                                  {project.priority}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-bold text-[#0B1F33]">{project.progress_percent}%</p>
                                <p className="text-xs text-[#4B6B7A]">progress</p>
                              </div>
                              <div className="w-16 h-2 bg-[#DBEAFE] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
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
                      <p className="text-sm">No projects yet. Create your first project!</p>
                    </div>
                  )}
                </div>

                {/* Team Workload */}
                <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#0B1F33]">Team Workload</h3>
                    <Link href="/tech/team" className="text-xs text-[#0A8FA8] hover:underline">View All</Link>
                  </div>
                  {teamWorkload.length > 0 ? (
                    <div className="space-y-3">
                      {teamWorkload.map((member) => (
                        <div key={member.profile_id} className="flex items-center justify-between p-3 bg-[#F0F7FA] rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#0A8FA8] rounded-full flex items-center justify-center text-white text-xs font-medium">
                              {member.first_name?.[0]}{member.last_name?.[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#0B1F33]">{member.first_name} {member.last_name}</p>
                              <p className="text-xs text-[#4B6B7A]">{member.position}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[#4B6B7A]">{member.total_items} items</span>
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: member.color }}
                              title={member.level}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-[#4B6B7A]">
                      <Users size={32} className="mb-2 text-[#DBEAFE]" />
                      <p className="text-sm">No tech team members found</p>
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
                    <Link href="/tech/feature-requests" className="text-xs text-[#0A8FA8] hover:underline">View All</Link>
                  </div>
                  {recentRequests.length > 0 ? (
                    <div className="space-y-3">
                      {recentRequests.slice(0, 5).map((req) => (
                        <Link key={req.id} href={`/tech/feature-requests/${req.id}`}>
                          <div className="flex items-start justify-between p-3 bg-[#F0F7FA] rounded-lg hover:bg-[#E0EEF5] transition-colors cursor-pointer">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#0B1F33] truncate">{req.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-[#4B6B7A] capitalize">{req.department}</span>
                                <span className="text-xs text-[#94A3B8]">•</span>
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    backgroundColor: `${PRIORITY_COLORS[req.priority]}15`,
                                    color: PRIORITY_COLORS[req.priority],
                                  }}
                                >
                                  {req.priority}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] font-medium">
                              Pending
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-[#4B6B7A]">
                      <GitBranch size={32} className="mb-2 text-[#DBEAFE]" />
                      <p className="text-sm">No pending feature requests</p>
                    </div>
                  )}
                </div>

                {/* Projects Near Deadline */}
                <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#0B1F33]">⚠️ Near Deadline</h3>
                    <Link href="/tech/projects" className="text-xs text-[#0A8FA8] hover:underline">View All</Link>
                  </div>
                  {nearDeadline.length > 0 ? (
                    <div className="space-y-3">
                      {nearDeadline.map((project) => {
                        const daysLeft = project.deadline
                          ? Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                          : null
                        return (
                          <Link key={project.id} href={`/tech/projects/${project.id}`}>
                            <div className="flex items-center justify-between p-3 bg-[#FEF3C7] rounded-lg hover:bg-[#FDE68A] transition-colors cursor-pointer">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#0B1F33] truncate">{project.name}</p>
                                <p className="text-xs text-[#92400E] mt-1">
                                  {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                                </p>
                              </div>
                              {daysLeft !== null && (
                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                  daysLeft <= 1 ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                                  daysLeft <= 3 ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                                  'bg-[#3B82F6]/10 text-[#3B82F6]'
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
                      <p className="text-sm">No projects near deadline</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6 mt-6">
                <h3 className="font-semibold text-[#0B1F33] mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'New Project', href: '/tech/projects/new', emoji: '🚀' },
                    { label: 'New Request', href: '/tech/feature-requests/new', emoji: '💡' },
                    { label: 'All Projects', href: '/tech/projects', emoji: '📁' },
                    { label: 'All Requests', href: '/tech/feature-requests', emoji: '📋' },
                    { label: 'Tech Team', href: '/tech/team', emoji: '👥' },
                    { label: 'Communication', href: '/communication', emoji: '💬' },
                  ].map((action, i) => (
                    <button
                      key={i}
                      onClick={() => router.push(action.href)}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border border-[#DBEAFE] hover:border-[#0A8FA8] hover:shadow-md transition-all"
                    >
                      <span className="text-2xl">{action.emoji}</span>
                      <span className="text-xs font-medium text-[#0B1F33]">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
