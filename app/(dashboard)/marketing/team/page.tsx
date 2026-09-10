'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/lib/context/profile-context'
import type { Profile } from '@/types'
import { Loader2, Mail, Briefcase, Clock, Activity, CheckCircle } from 'lucide-react'
import { getSocialMediaTeam, getEmployeeContentStatuses, updateEmployeeContentStatus } from '@/lib/services/marketing-analytics'
import { getRequestsByAssignedTeamMember } from '@/lib/services/content-production'

export default function TeamPage() {
  const router = useRouter()
  const profile = useProfile()
  const [team, setTeam] = useState<Profile[]>([])
  const [statuses, setStatuses] = useState<any[]>([])
  const [memberTasks, setMemberTasks] = useState<Record<string, any[]>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [t, s] = await Promise.all([getSocialMediaTeam(), getEmployeeContentStatuses()])
      setTeam(t)
      setStatuses(s || [])

      // Load tasks for each team member
      const tasks: Record<string, any[]> = {}
      await Promise.all(t.map(async (member) => {
        const reqs = await getRequestsByAssignedTeamMember(member.id)
        tasks[member.id] = reqs
      }))
      setMemberTasks(tasks)
    } catch (err) { console.error(err) }
    finally { setIsLoading(false) }
  }

  const handleUpdateStatus = async (employeeId: string, status: string) => {
    try {
      await updateEmployeeContentStatus(employeeId, status)
      await loadData()
    } catch (err) { console.error(err) }
  }

  const getInitials = (name?: string) => (name || 'TM').trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'TM'
  const statusColors: Record<string, string> = { active: '#22C55E', busy: '#EF4444', offline: '#9CA3AF', meeting: '#F59E0B' }

  return (
    <div className="space-y-6">
      <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Marketing Team</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage team members, tasks, and availability</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={48} /></div>
          ) : team.length === 0 ? (
            <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
              <p className="text-muted-foreground">No team members found in the Social Media department.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.map(member => {
                const empStatus = statuses.find(s => s.employee_id === member.id)
                const currentStatus = empStatus?.current_status || 'offline'
                const tasks = memberTasks[member.id] || []
                
                return (
                  <div key={member.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C8A951] to-[#E2CC7E] flex items-center justify-center text-primary-foreground font-bold">
                              {getInitials(`${member.first_name || ''} ${member.last_name || ''}`)}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white" style={{ backgroundColor: statusColors[currentStatus] || '#9CA3AF' }} />
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground">{member.first_name} {member.last_name}</h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Briefcase size={10} /> {member.position}</p>
                          </div>
                        </div>
                        {profile?.id === member.id && (
                          <select 
                            value={currentStatus} 
                            onChange={(e) => handleUpdateStatus(member.id, e.target.value)}
                            className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground focus:outline-none"
                          >
                            <option value="active">Active</option>
                            <option value="busy">Busy</option>
                            <option value="meeting">In Meeting</option>
                            <option value="offline">Offline</option>
                          </select>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-5 bg-muted">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1"><Activity size={14} className="text-primary" /> Current Tasks</h4>
                        <span className="text-xs font-medium text-muted-foreground bg-[#E2E8F0] px-2 py-0.5 rounded-full">{tasks.length}</span>
                      </div>
                      
                      <div className="space-y-2">
                        {tasks.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic text-center py-2">No active tasks assigned</p>
                        ) : tasks.slice(0, 3).map(task => (
                          <div key={task.id} className="bg-card border border-border rounded-lg p-2.5 flex items-start gap-2">
                            <Clock size={14} className="text-warning flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{task.title}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] text-muted-foreground capitalize">{task.status}</span>
                                {task.due_date && <span className="text-[10px] text-destructive font-medium">{new Date(task.due_date).toLocaleDateString()}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                        {tasks.length > 3 && (
                          <button onClick={() => router.push('/marketing/production-requests')} className="w-full text-xs text-primary font-medium py-1 hover:underline">
                            View all {tasks.length} tasks
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
    </div>
  )
}
