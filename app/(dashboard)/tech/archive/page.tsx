'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type { ArchiveAnalytics, Project } from '@/types/tech'
import { Loader2, Archive, CheckCircle2, Bug, Code2, Layers, Search, Calendar, ChevronRight, Database } from 'lucide-react'
import { getArchiveAnalytics, getArchivedProjects } from '@/lib/services/project-archive'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '@/types/tech'

const COLORS = ['#C8A951', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F59E0B', '#10B981']

export default function ArchivePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ArchiveAnalytics | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try {
      const parsed = JSON.parse(authUser)
      if (!['super_admin', 'admin'].includes(parsed.role) && parsed.department !== 'technology') {
        router.push('/dashboard')
        return
      }
      setProfile(parsed)
    } catch { router.push('/login') }
  }, [router])

  useEffect(() => {
    if (!profile) return
    loadData()
  }, [profile])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [s, p] = await Promise.all([
        getArchiveAnalytics(),
        getArchivedProjects(),
      ])
      setStats(s)
      setProjects(p)
    } catch (err: any) {
      console.error('Failed to load archive data:', err)
      setError(err?.message || err?.details || JSON.stringify(err) || 'Database connection error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    try {
      setIsLoading(true)
      const p = await getArchivedProjects({ search: search || undefined })
      setProjects(p)
    } catch (err) {
      console.error('Failed to search archive:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile) return null

  const statCards = [
    { label: 'Completed Projects', value: stats?.completedProjects || 0, icon: CheckCircle2, color: '#10B981', bg: '#ECFDF5' },
    { label: 'Archived Projects', value: stats?.archivedProjects || 0, icon: Archive, color: '#64748B', bg: '#F1F5F9' },
    { label: 'Projects in Maintenance', value: stats?.maintenanceProjects || 0, icon: Layers, color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Avg Completion Days', value: stats?.averageCompletionDays || 0, icon: Calendar, color: '#8B5CF6', bg: '#F5F3FF' },
    { label: 'Deployment Success Rate', value: `${stats?.deploymentSuccessRate || 0}%`, icon: Code2, color: '#C8A951', bg: '#FAFAF7' },
    { label: 'Repository Health', value: `${stats?.repositoryHealth || 0}%`, icon: CheckCircle2, color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Technical Debt Items', value: stats?.technicalDebtScore || 0, icon: Bug, color: '#EF4444', bg: '#FEF2F2' },
  ]

  const statusData = [
    { name: 'Completed', value: stats?.completedProjects || 0 },
    { name: 'Archived', value: stats?.archivedProjects || 0 },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Link href="/tech/dashboard" className="hover:text-primary">Technology</Link>
                <ChevronRight size={14} />
                <span className="text-foreground font-medium">Project Archive</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Archive size={28} className="text-primary" />
                Project Archive & Analytics
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Permanent knowledge base, analytics, and repository data for completed projects
              </p>
            </div>
            <Link
              href="/tech/credentials"
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-primary rounded-lg hover:bg-background transition-colors text-sm font-medium shadow-sm"
            >
              Credential Vault
            </Link>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-4 rounded-lg mb-6 shadow-sm flex items-start gap-3">
              <Database size={20} className="mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-sm">Database Error</h3>
                <p className="text-sm mt-1">{error}</p>
                <p className="text-xs mt-2 font-medium opacity-80">Make sure you executed the phase-x-project-archive-schema.sql file in Supabase.</p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-primary" size={48} />
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                {statCards.map((card, i) => {
                  const Icon = card.icon
                  return (
                    <div key={i} className="bg-card rounded-xl border border-border shadow-sm p-4 hover:shadow-md hover:border-primary transition-all group">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110" style={{ backgroundColor: card.bg, color: card.color }}>
                        <Icon size={20} />
                      </div>
                      <p className="text-2xl font-bold text-foreground mb-1">{card.value}</p>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight">{card.label}</p>
                    </div>
                  )
                })}
              </div>

              {/* Analytics Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Most Used Tech (Bar Chart) */}
                <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm p-6">
                  <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Code2 size={18} className="text-primary" />
                    Most Used Technologies
                  </h3>
                  <div className="h-[300px] w-full">
                    {stats?.mostUsedTechnologies && stats.mostUsedTechnologies.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.mostUsedTechnologies} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#DBEAFE" vertical={false} />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#4B6B7A', fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#4B6B7A', fontSize: 12 }}
                          />
                          <Tooltip
                            cursor={{ fill: '#FAFAF7' }}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #DBEAFE', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="count" fill="#C8A951" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No technology data available yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Distribution (Pie Chart) */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                  <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Layers size={18} className="text-primary" />
                    Archive Status Distribution
                  </h3>
                  <div className="h-[300px] w-full">
                    {statusData.some(d => d.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#64748B'} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #DBEAFE' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No archive data available
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Archive Search & List */}
              <div className="bg-card rounded-xl border border-border shadow-sm">
                <div className="p-6 border-b border-border">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">Knowledge Base & Repositories</h3>
                      <p className="text-sm text-muted-foreground mt-1">Search through {projects.length} archived projects</p>
                    </div>

                    <div className="flex items-center gap-2 min-w-[300px] bg-background border border-border rounded-lg px-4 py-2.5 focus-within:ring-2 focus-within:ring-[#C8A951] focus-within:border-transparent transition-shadow">
                      <Search size={18} className="text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by project name, tech, or client..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="bg-transparent text-sm text-foreground placeholder-[#94A3B8] outline-none flex-1"
                      />
                    </div>
                  </div>
                </div>

                {projects.length > 0 ? (
                  <div className="divide-y divide-[#DBEAFE]">
                    {projects.map((project) => (
                      <Link key={project.id} href={`/tech/projects/${project.id}`}>
                        <div className="p-6 hover:bg-background transition-colors cursor-pointer group">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{project.name}</h4>
                                <span
                                  className="text-[11px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider"
                                  style={{
                                    backgroundColor: `${PROJECT_STATUS_COLORS[project.status]}15`,
                                    color: PROJECT_STATUS_COLORS[project.status],
                                    border: `1px solid ${PROJECT_STATUS_COLORS[project.status]}30`
                                  }}
                                >
                                  {PROJECT_STATUS_LABELS[project.status]}
                                </span>
                              </div>
                              {project.description && (
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
                                {project.client && (
                                  <span className="flex items-center gap-1.5 bg-card border border-border px-2.5 py-1.5 rounded-md shadow-sm">
                                    <span className="text-muted-foreground">Client:</span>
                                    <span className="text-foreground">{project.client}</span>
                                  </span>
                                )}
                                {project.start_date && project.deadline && (
                                  <span className="flex items-center gap-1.5 bg-card border border-border px-2.5 py-1.5 rounded-md shadow-sm">
                                    <Calendar size={14} className="text-primary" />
                                    {new Date(project.start_date).toLocaleDateString()} — {new Date(project.deadline).toLocaleDateString()}
                                  </span>
                                )}
                                {project.updated_at && (
                                  <span className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground">Archived on:</span>
                                    {new Date(project.updated_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all group-hover:scale-110 group-hover:border-primary">
                              <ChevronRight size={20} />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                      <Archive size={40} className="text-[#DBEAFE]" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">No Archived Projects Found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {search ? "No projects match your search query." : "There are currently no completed or archived projects in the knowledge base."}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}