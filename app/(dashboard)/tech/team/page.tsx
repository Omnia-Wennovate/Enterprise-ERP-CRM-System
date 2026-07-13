'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type { WorkloadScore } from '@/types/tech'
import { Loader2, Users, Code2, GitBranch, Calendar, Activity, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAllTechTeamWorkload } from '@/lib/services/tech-workload'
import Link from 'next/link'

interface TechProfile extends Profile {
  active_tasks?: number
  active_requests?: number
  workload_level?: string
  workload_color?: string
}

export default function TechTeamPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState<TechProfile[]>([])
  const [workloads, setWorkloads] = useState<WorkloadScore[]>([])
  const [stats, setStats] = useState({
    totalMembers: 0,
    available: 0,
    busy: 0,
    overloaded: 0,
  })

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try { setProfile(JSON.parse(authUser)) } catch { router.push('/login') }
  }, [router])

  useEffect(() => {
    if (!profile) return
    loadTeamData()
  }, [profile])

  const loadTeamData = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // Get tech team profiles
      const { data: members, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('department', 'technology')
        .order('first_name')

      if (error) throw error

      // Get workload data
      const wl = await getAllTechTeamWorkload()
      setWorkloads(wl)

      // Merge workload into profiles
      const workloadMap = new Map(wl.map(w => [w.profile_id, w]))
      const enrichedMembers = (members || []).map((m: any) => {
        const w = workloadMap.get(m.id)
        return {
          ...m,
          active_tasks: w?.active_tasks || 0,
          active_requests: w?.active_feature_requests || 0,
          workload_level: w?.level || 'available',
          workload_color: w?.color || '#10B981',
        }
      })

      setTeamMembers(enrichedMembers)

      // Calculate stats
      setStats({
        totalMembers: enrichedMembers.length,
        available: wl.filter(w => w.level === 'available').length,
        busy: wl.filter(w => w.level === 'busy').length,
        overloaded: wl.filter(w => w.level === 'overloaded').length,
      })
    } catch (err) {
      console.error('Failed to load team data:', err)
    } finally {
      setIsLoading(false)
    }
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
              <h1 className="text-2xl font-bold text-[#0B1F33]">Technology Team</h1>
              <p className="text-sm text-[#4B6B7A] mt-1">{stats.totalMembers} team member{stats.totalMembers !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex gap-3">
              <Link href="/hr/staff"
                className="flex items-center gap-2 px-4 py-2 border border-[#BFDBFE] text-[#4B6B7A] rounded-lg hover:bg-[#F0F7FA] transition-colors text-sm font-medium">
                <ExternalLink size={14} /> HR Staff View
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-[#0A8FA8]" size={48} />
            </div>
          ) : (
            <>
              {/* Workload Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-5">
                  <div className="w-full h-1 -mx-5 -mt-5 mb-4 rounded-t-xl bg-[#6366F1]" />
                  <p className="text-xs text-[#4B6B7A] font-medium">Total Members</p>
                  <p className="text-2xl font-bold text-[#0B1F33] mt-1">{stats.totalMembers}</p>
                </div>
                <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-5">
                  <div className="w-full h-1 -mx-5 -mt-5 mb-4 rounded-t-xl bg-[#10B981]" />
                  <p className="text-xs text-[#4B6B7A] font-medium">Available</p>
                  <p className="text-2xl font-bold text-[#10B981] mt-1">{stats.available}</p>
                </div>
                <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-5">
                  <div className="w-full h-1 -mx-5 -mt-5 mb-4 rounded-t-xl bg-[#F59E0B]" />
                  <p className="text-xs text-[#4B6B7A] font-medium">Busy</p>
                  <p className="text-2xl font-bold text-[#F59E0B] mt-1">{stats.busy}</p>
                </div>
                <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-5">
                  <div className="w-full h-1 -mx-5 -mt-5 mb-4 rounded-t-xl bg-[#EF4444]" />
                  <p className="text-xs text-[#4B6B7A] font-medium">Overloaded</p>
                  <p className="text-2xl font-bold text-[#EF4444] mt-1">{stats.overloaded}</p>
                </div>
              </div>

              {/* Team Members Grid */}
              {teamMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamMembers.map((member: any) => (
                    <div key={member.id} className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm hover:shadow-md transition-all p-6">
                      {/* Workload bar */}
                      <div className="w-full h-1 -mx-6 -mt-6 mb-5 rounded-t-xl" style={{ backgroundColor: member.workload_color }} />

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[#0A8FA8] rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {member.first_name?.[0]}{member.last_name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-[#0B1F33]">{member.first_name} {member.last_name}</h3>
                          <p className="text-xs text-[#4B6B7A]">{member.position || 'Developer'}</p>
                          <p className="text-xs text-[#94A3B8]">{member.email}</p>
                        </div>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: member.workload_color }} />
                          <span className="text-[10px] font-medium capitalize" style={{ color: member.workload_color }}>
                            {member.workload_level}
                          </span>
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="p-2.5 bg-[#F0F7FA] rounded-lg text-center">
                          <Code2 size={14} className="mx-auto text-[#3B82F6] mb-1" />
                          <p className="text-lg font-bold text-[#0B1F33]">{member.active_tasks}</p>
                          <p className="text-[10px] text-[#4B6B7A]">Active Tasks</p>
                        </div>
                        <div className="p-2.5 bg-[#F0F7FA] rounded-lg text-center">
                          <GitBranch size={14} className="mx-auto text-[#8B5CF6] mb-1" />
                          <p className="text-lg font-bold text-[#0B1F33]">{member.active_requests}</p>
                          <p className="text-[10px] text-[#4B6B7A]">Feature Requests</p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Link href="/hr/performance"
                          className="flex-1 text-center text-xs px-3 py-1.5 border border-[#DBEAFE] rounded-lg text-[#4B6B7A] hover:bg-[#F0F7FA] transition-colors">
                          Performance
                        </Link>
                        <Link href="/hr/leave"
                          className="flex-1 text-center text-xs px-3 py-1.5 border border-[#DBEAFE] rounded-lg text-[#4B6B7A] hover:bg-[#F0F7FA] transition-colors">
                          Attendance
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-12 text-center">
                  <Users size={48} className="mx-auto text-[#DBEAFE] mb-4" />
                  <h3 className="text-lg font-semibold text-[#0B1F33] mb-2">No Technology Team Members</h3>
                  <p className="text-sm text-[#4B6B7A] mb-4">
                    No profiles found with department = &quot;technology&quot;. Ensure staff profiles have the correct department assigned.
                  </p>
                  <Link href="/hr/staff"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A8FA8] text-white rounded-lg hover:bg-[#088096] text-sm font-medium">
                    <Users size={16} /> Manage Staff
                  </Link>
                </div>
              )}

              {/* Workload Legend */}
              <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-4 mt-6">
                <h4 className="text-xs font-semibold text-[#0B1F33] mb-3">Workload Indicator Legend</h4>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#10B981]" />
                    <span className="text-xs text-[#4B6B7A]">Available (0-3 items)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                    <span className="text-xs text-[#4B6B7A]">Busy (4-6 items)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
                    <span className="text-xs text-[#4B6B7A]">Overloaded (7+ items)</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
