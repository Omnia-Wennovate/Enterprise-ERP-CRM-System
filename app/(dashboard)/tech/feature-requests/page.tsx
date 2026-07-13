'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type { FeatureRequest } from '@/types/tech'
import { FR_STATUS_LABELS, FR_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, DEPARTMENT_LABELS } from '@/types/tech'
import { Loader2, Plus, Search, GitBranch, Filter } from 'lucide-react'
import { getFeatureRequests } from '@/lib/services/feature-requests'
import Link from 'next/link'

export default function FeatureRequestsListPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [requests, setRequests] = useState<FeatureRequest[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try { setProfile(JSON.parse(authUser)) } catch { router.push('/login') }
  }, [router])

  useEffect(() => {
    if (!profile) return
    loadRequests()
  }, [profile, statusFilter, departmentFilter, priorityFilter])

  const loadRequests = async () => {
    try {
      setIsLoading(true)
      const data = await getFeatureRequests({
        status: statusFilter,
        department: departmentFilter,
        priority: priorityFilter,
        search: search || undefined,
      })
      setRequests(data)
    } catch (err) {
      console.error('Failed to load feature requests:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile) return null

  // Kanban grouping
  const kanbanColumns = ['requested', 'approved', 'development', 'testing', 'completed', 'rejected'] as const
  const groupedRequests = kanbanColumns.reduce((acc, status) => {
    acc[status] = requests.filter(r => r.status === status)
    return acc
  }, {} as Record<string, FeatureRequest[]>)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F7FA]">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F33]">Feature Requests</h1>
              <p className="text-sm text-[#4B6B7A] mt-1">{requests.length} request{requests.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex gap-3">
              <div className="flex border border-[#BFDBFE] rounded-lg overflow-hidden">
                <button onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'list' ? 'bg-[#0A8FA8] text-white' : 'bg-white text-[#4B6B7A]'}`}>
                  List
                </button>
                <button onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'kanban' ? 'bg-[#0A8FA8] text-white' : 'bg-white text-[#4B6B7A]'}`}>
                  Kanban
                </button>
              </div>
              <Link
                href="/tech/feature-requests/new"
                className="flex items-center gap-2 px-4 py-2 bg-[#0A8FA8] text-white rounded-lg hover:bg-[#088096] transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                New Request
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-[#F0F7FA] border border-[#BFDBFE] rounded-lg px-3 py-2">
                <Search size={16} className="text-[#4B6B7A]" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadRequests()}
                  className="bg-transparent text-sm text-[#0B1F33] placeholder-[#94A3B8] outline-none flex-1"
                />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] bg-white">
                <option value="all">All Statuses</option>
                {Object.entries(FR_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] bg-white">
                <option value="all">All Departments</option>
                {Object.entries(DEPARTMENT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm text-[#0B1F33] bg-white">
                <option value="all">All Priorities</option>
                {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-[#0A8FA8]" size={48} />
            </div>
          ) : viewMode === 'kanban' ? (
            /* ===== KANBAN VIEW ===== */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto">
              {kanbanColumns.map((status) => {
                const items = groupedRequests[status] || []
                const color = FR_STATUS_COLORS[status]
                return (
                  <div key={status} className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm min-w-[220px]">
                    <div className="p-3 border-b border-[#DBEAFE]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-xs font-semibold text-[#0B1F33]">{FR_STATUS_LABELS[status]}</span>
                        <span className="text-xs text-[#4B6B7A] bg-[#F0F7FA] px-2 py-0.5 rounded-full ml-auto">{items.length}</span>
                      </div>
                    </div>
                    <div className="p-2 space-y-2 max-h-[500px] overflow-y-auto">
                      {items.map((req) => (
                        <Link key={req.id} href={`/tech/feature-requests/${req.id}`}>
                          <div className="p-3 bg-[#F0F7FA] rounded-lg hover:bg-[#E0EEF5] transition-colors cursor-pointer border border-transparent hover:border-[#BFDBFE]">
                            <p className="text-xs font-medium text-[#0B1F33] mb-1 line-clamp-2">{req.title}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#4B6B7A] capitalize">{req.department}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                                style={{ backgroundColor: `${PRIORITY_COLORS[req.priority]}15`, color: PRIORITY_COLORS[req.priority] }}>
                                {req.priority}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                      {items.length === 0 && (
                        <p className="text-xs text-[#94A3B8] text-center py-4">None</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : requests.length > 0 ? (
            /* ===== LIST VIEW ===== */
            <div className="space-y-3">
              {requests.map((req) => (
                <Link key={req.id} href={`/tech/feature-requests/${req.id}`}>
                  <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm hover:shadow-md transition-all p-5 cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-sm font-semibold text-[#0B1F33] truncate">{req.title}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                            style={{ backgroundColor: `${FR_STATUS_COLORS[req.status]}15`, color: FR_STATUS_COLORS[req.status] }}>
                            {FR_STATUS_LABELS[req.status]}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                            style={{ backgroundColor: `${PRIORITY_COLORS[req.priority]}15`, color: PRIORITY_COLORS[req.priority] }}>
                            {PRIORITY_LABELS[req.priority]}
                          </span>
                        </div>
                        {req.description && (
                          <p className="text-xs text-[#4B6B7A] truncate mb-2">{req.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-[#4B6B7A]">
                          <span className="capitalize">📂 {DEPARTMENT_LABELS[req.department] || req.department}</span>
                          {req.requested_by_name && <span>👤 {req.requested_by_name}</span>}
                          {req.assigned_developer_name && <span>🔧 {req.assigned_developer_name}</span>}
                          {req.requested_date && <span>📅 {new Date(req.requested_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <p className="text-sm font-bold text-[#0B1F33]">{req.completion_percent}%</p>
                        <div className="w-16 h-1.5 bg-[#DBEAFE] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${req.completion_percent}%`, backgroundColor: FR_STATUS_COLORS[req.status] }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-12 text-center">
              <GitBranch size={48} className="mx-auto text-[#DBEAFE] mb-4" />
              <h3 className="text-lg font-semibold text-[#0B1F33] mb-2">No Feature Requests Found</h3>
              <p className="text-sm text-[#4B6B7A] mb-6">
                {search || statusFilter !== 'all' || departmentFilter !== 'all'
                  ? 'No requests match your filters.'
                  : 'Submit your first feature request to get started.'}
              </p>
              <Link href="/tech/feature-requests/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A8FA8] text-white rounded-lg hover:bg-[#088096] transition-colors text-sm font-medium">
                <Plus size={16} /> Submit Request
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
