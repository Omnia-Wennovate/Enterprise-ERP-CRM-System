'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type {
  Project, ProjectMember, ProjectMilestone, ProjectSprint,
  ProjectTask, ProjectComment, ProjectActivityLog, ProjectTaskStatus
} from '@/types/tech'
import {
  PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS,
  HEALTH_LABELS, HEALTH_COLORS, RISK_LABELS, TASK_STATUS_LABELS, TASK_STATUS_COLORS,
  MEMBER_ROLE_LABELS
} from '@/types/tech'
import {
  Loader2, ArrowLeft, Save, Plus, Trash2, CheckCircle2, Circle, Clock,
  Users, MessageSquare, History, Paperclip, Target, Calendar, X,
  GripVertical, ChevronRight, AlertTriangle, BarChart3
} from 'lucide-react'
import { getProjectById, updateProject, getProjectMembers, addProjectMember, removeProjectMember, getProjectComments, addProjectComment, getProjectAttachments, getProjectActivity } from '@/lib/services/projects'
import { getProjectTasks, getTasksByStatus, createProjectTask, updateTaskStatus, deleteProjectTask } from '@/lib/services/project-tasks'
import { getMilestones, createMilestone, completeMilestone, deleteMilestone } from '@/lib/services/milestones'
import { getSprints, createSprint, updateSprintStatus, deleteSprint } from '@/lib/services/sprints'
import Link from 'next/link'

type Tab = 'overview' | 'milestones' | 'sprints' | 'tasks' | 'team' | 'comments' | 'activity' | 'attachments'

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([])
  const [sprints, setSprints] = useState<ProjectSprint[]>([])
  const [tasksByStatus, setTasksByStatus] = useState<Record<string, ProjectTask[]>>({})
  const [comments, setComments] = useState<ProjectComment[]>([])
  const [activity, setActivity] = useState<ProjectActivityLog[]>([])
  const [attachments, setAttachments] = useState<any[]>([])

  // Form states
  const [newComment, setNewComment] = useState('')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [showSprintForm, setShowSprintForm] = useState(false)
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo', due_date: '' })
  const [milestoneForm, setMilestoneForm] = useState({ title: '', due_date: '' })
  const [sprintForm, setSprintForm] = useState({ sprint_name: '', start_date: '', end_date: '' })
  const [memberForm, setMemberForm] = useState({ profile_id: '', role: 'developer' })

  // Edit mode for overview
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>({})

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try { setProfile(JSON.parse(authUser)) } catch { router.push('/login') }
  }, [router])

  useEffect(() => {
    if (!profile || !id) return
    loadProject()
  }, [profile, id])

  const loadProject = async () => {
    try {
      setIsLoading(true)
      const p = await getProjectById(id)
      setProject(p)
      setEditForm(p)
      const [m, ml, sp, ts, cm, act, att] = await Promise.all([
        getProjectMembers(id),
        getMilestones(id),
        getSprints(id),
        getTasksByStatus(id),
        getProjectComments(id),
        getProjectActivity(id),
        getProjectAttachments(id),
      ])
      setMembers(m)
      setMilestones(ml)
      setSprints(sp)
      setTasksByStatus(ts)
      setComments(cm)
      setActivity(act)
      setAttachments(att)
    } catch (err) {
      console.error('Failed to load project:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveOverview = async () => {
    if (!profile || !project) return
    try {
      setSaving(true)
      await updateProject(project.id, {
        name: editForm.name,
        description: editForm.description,
        priority: editForm.priority,
        status: editForm.status,
        progress_percent: editForm.progress_percent,
        risk_level: editForm.risk_level,
        health_indicator: editForm.health_indicator,
        start_date: editForm.start_date,
        deadline: editForm.deadline,
        budget: editForm.budget,
      }, profile.id)
      setEditing(false)
      await loadProject()
    } catch (err) {
      console.error('Failed to update project:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleAddTask = async () => {
    if (!profile || !project || !taskForm.title.trim()) return
    try {
      setSaving(true)
      await createProjectTask(project.id, {
        title: taskForm.title,
        description: taskForm.description || undefined,
        priority: taskForm.priority as any,
        status: taskForm.status as any,
        due_date: taskForm.due_date || undefined,
      }, profile.id)
      setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo', due_date: '' })
      setShowTaskForm(false)
      const ts = await getTasksByStatus(project.id)
      setTasksByStatus(ts)
    } catch (err) {
      console.error('Failed to create task:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    if (!profile) return
    try {
      await updateTaskStatus(taskId, newStatus, profile.id)
      if (project) {
        const ts = await getTasksByStatus(project.id)
        setTasksByStatus(ts)
      }
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  }

  const handleAddMilestone = async () => {
    if (!profile || !project || !milestoneForm.title.trim()) return
    try {
      setSaving(true)
      await createMilestone(project.id, {
        title: milestoneForm.title,
        due_date: milestoneForm.due_date || undefined,
      }, profile.id)
      setMilestoneForm({ title: '', due_date: '' })
      setShowMilestoneForm(false)
      const ml = await getMilestones(project.id)
      setMilestones(ml)
    } catch (err) {
      console.error('Failed to create milestone:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCompleteMilestone = async (milestoneId: string) => {
    if (!profile || !project) return
    try {
      await completeMilestone(milestoneId, profile.id)
      const ml = await getMilestones(project.id)
      setMilestones(ml)
    } catch (err) {
      console.error('Failed to complete milestone:', err)
    }
  }

  const handleAddSprint = async () => {
    if (!profile || !project || !sprintForm.sprint_name.trim()) return
    try {
      setSaving(true)
      await createSprint(project.id, {
        sprint_name: sprintForm.sprint_name,
        start_date: sprintForm.start_date,
        end_date: sprintForm.end_date,
      }, profile.id)
      setSprintForm({ sprint_name: '', start_date: '', end_date: '' })
      setShowSprintForm(false)
      const sp = await getSprints(project.id)
      setSprints(sp)
    } catch (err) {
      console.error('Failed to create sprint:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleAddComment = async () => {
    if (!profile || !project || !newComment.trim()) return
    try {
      setSaving(true)
      await addProjectComment(project.id, profile.id, newComment)
      setNewComment('')
      const cm = await getProjectComments(project.id)
      setComments(cm)
    } catch (err) {
      console.error('Failed to add comment:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return null

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'milestones', label: 'Milestones', icon: Target },
    { key: 'sprints', label: 'Sprints', icon: Clock },
    { key: 'tasks', label: 'Tasks', icon: CheckCircle2 },
    { key: 'team', label: 'Team', icon: Users },
    { key: 'comments', label: 'Comments', icon: MessageSquare },
    { key: 'activity', label: 'Activity', icon: History },
    { key: 'attachments', label: 'Attachments', icon: Paperclip },
  ]

  const totalTasks = Object.values(tasksByStatus).flat().length
  const doneTasks = (tasksByStatus.done || []).length

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
          ) : !project ? (
            <div className="text-center py-20">
              <p className="text-[#4B6B7A]">Project not found</p>
              <Link href="/tech/projects" className="text-[#0A8FA8] hover:underline text-sm mt-2 inline-block">Back to Projects</Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <Link href="/tech/projects" className="p-2 rounded-lg hover:bg-[#DBEAFE] transition-colors">
                  <ArrowLeft size={20} className="text-[#4B6B7A]" />
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-[#0B1F33]">{project.name}</h1>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${PROJECT_STATUS_COLORS[project.status]}15`, color: PROJECT_STATUS_COLORS[project.status] }}>
                      {PROJECT_STATUS_LABELS[project.status]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${HEALTH_COLORS[project.health_indicator]}15`, color: HEALTH_COLORS[project.health_indicator] }}>
                      {HEALTH_LABELS[project.health_indicator]}
                    </span>
                  </div>
                  <p className="text-sm text-[#4B6B7A] mt-1">{project.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#0B1F33]">{project.progress_percent}%</p>
                    <div className="w-32 h-2 bg-[#DBEAFE] rounded-full overflow-hidden mt-1">
                      <div className="h-full rounded-full bg-[#0A8FA8] transition-all" style={{ width: `${project.progress_percent}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm mb-6">
                <div className="flex overflow-x-auto border-b border-[#DBEAFE]">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                          activeTab === tab.key
                            ? 'border-[#0A8FA8] text-[#0A8FA8]'
                            : 'border-transparent text-[#4B6B7A] hover:text-[#0B1F33]'
                        }`}
                      >
                        <Icon size={16} />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>

                <div className="p-6">
                  {/* ============ OVERVIEW TAB ============ */}
                  {activeTab === 'overview' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-[#0B1F33]">Project Details</h3>
                        {!editing ? (
                          <button onClick={() => setEditing(true)} className="text-xs text-[#0A8FA8] hover:underline">Edit</button>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={handleSaveOverview} disabled={saving} className="text-xs px-3 py-1 bg-[#0A8FA8] text-white rounded-lg hover:bg-[#088096]">
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={() => { setEditing(false); setEditForm(project) }} className="text-xs px-3 py-1 border border-[#BFDBFE] text-[#4B6B7A] rounded-lg">Cancel</button>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {editing ? (
                          <>
                            <div>
                              <label className="text-xs text-[#4B6B7A]">Status</label>
                              <select value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                                className="w-full mt-1 px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm bg-white">
                                {Object.entries(PROJECT_STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-[#4B6B7A]">Priority</label>
                              <select value={editForm.priority} onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                                className="w-full mt-1 px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm bg-white">
                                {Object.entries(PRIORITY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-[#4B6B7A]">Progress %</label>
                              <input type="number" min={0} max={100} value={editForm.progress_percent}
                                onChange={(e) => setEditForm({...editForm, progress_percent: parseInt(e.target.value) || 0})}
                                className="w-full mt-1 px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="text-xs text-[#4B6B7A]">Health</label>
                              <select value={editForm.health_indicator} onChange={(e) => setEditForm({...editForm, health_indicator: e.target.value})}
                                className="w-full mt-1 px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm bg-white">
                                {Object.entries(HEALTH_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-[#4B6B7A]">Risk Level</label>
                              <select value={editForm.risk_level} onChange={(e) => setEditForm({...editForm, risk_level: e.target.value})}
                                className="w-full mt-1 px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm bg-white">
                                {Object.entries(RISK_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-[#4B6B7A]">Budget ($)</label>
                              <input type="number" value={editForm.budget}
                                onChange={(e) => setEditForm({...editForm, budget: parseFloat(e.target.value) || 0})}
                                className="w-full mt-1 px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm" />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="p-3 bg-[#F0F7FA] rounded-lg">
                              <p className="text-xs text-[#4B6B7A]">Priority</p>
                              <p className="text-sm font-medium mt-1" style={{color: PRIORITY_COLORS[project.priority]}}>{PRIORITY_LABELS[project.priority]}</p>
                            </div>
                            <div className="p-3 bg-[#F0F7FA] rounded-lg">
                              <p className="text-xs text-[#4B6B7A]">Risk Level</p>
                              <p className="text-sm font-medium mt-1">{RISK_LABELS[project.risk_level]}</p>
                            </div>
                            <div className="p-3 bg-[#F0F7FA] rounded-lg">
                              <p className="text-xs text-[#4B6B7A]">Budget</p>
                              <p className="text-sm font-medium mt-1">${project.budget?.toLocaleString() || '0'}</p>
                            </div>
                            <div className="p-3 bg-[#F0F7FA] rounded-lg">
                              <p className="text-xs text-[#4B6B7A]">Start Date</p>
                              <p className="text-sm font-medium mt-1">{project.start_date ? new Date(project.start_date).toLocaleDateString() : '—'}</p>
                            </div>
                            <div className="p-3 bg-[#F0F7FA] rounded-lg">
                              <p className="text-xs text-[#4B6B7A]">Deadline</p>
                              <p className="text-sm font-medium mt-1">{project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}</p>
                            </div>
                            <div className="p-3 bg-[#F0F7FA] rounded-lg">
                              <p className="text-xs text-[#4B6B7A]">Tasks</p>
                              <p className="text-sm font-medium mt-1">{doneTasks}/{totalTasks} completed</p>
                            </div>
                            <div className="p-3 bg-[#F0F7FA] rounded-lg">
                              <p className="text-xs text-[#4B6B7A]">Team Members</p>
                              <p className="text-sm font-medium mt-1">{members.length}</p>
                            </div>
                            <div className="p-3 bg-[#F0F7FA] rounded-lg">
                              <p className="text-xs text-[#4B6B7A]">Milestones</p>
                              <p className="text-sm font-medium mt-1">{milestones.filter(m => m.is_completed).length}/{milestones.length} completed</p>
                            </div>
                            <div className="p-3 bg-[#F0F7FA] rounded-lg">
                              <p className="text-xs text-[#4B6B7A]">Created</p>
                              <p className="text-sm font-medium mt-1">{new Date(project.created_at).toLocaleDateString()}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ============ MILESTONES TAB ============ */}
                  {activeTab === 'milestones' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-[#0B1F33]">Milestones</h3>
                        <button onClick={() => setShowMilestoneForm(!showMilestoneForm)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#0A8FA8] text-white rounded-lg hover:bg-[#088096]">
                          <Plus size={14} /> Add Milestone
                        </button>
                      </div>
                      {showMilestoneForm && (
                        <div className="bg-[#F0F7FA] p-4 rounded-lg mb-4 space-y-3">
                          <input type="text" placeholder="Milestone title" value={milestoneForm.title}
                            onChange={(e) => setMilestoneForm({...milestoneForm, title: e.target.value})}
                            className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm" />
                          <input type="date" value={milestoneForm.due_date}
                            onChange={(e) => setMilestoneForm({...milestoneForm, due_date: e.target.value})}
                            className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm" />
                          <div className="flex gap-2">
                            <button onClick={handleAddMilestone} disabled={saving}
                              className="text-xs px-3 py-1.5 bg-[#0A8FA8] text-white rounded-lg">{saving ? 'Adding...' : 'Add'}</button>
                            <button onClick={() => setShowMilestoneForm(false)}
                              className="text-xs px-3 py-1.5 border border-[#BFDBFE] rounded-lg">Cancel</button>
                          </div>
                        </div>
                      )}
                      {milestones.length > 0 ? (
                        <div className="relative">
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#DBEAFE]" />
                          <div className="space-y-4">
                            {milestones.map((ms) => (
                              <div key={ms.id} className="relative flex items-start gap-4 pl-8">
                                <button onClick={() => !ms.is_completed && handleCompleteMilestone(ms.id)}
                                  className="absolute left-2 top-1 z-10">
                                  {ms.is_completed ? (
                                    <CheckCircle2 size={18} className="text-[#10B981]" />
                                  ) : (
                                    <Circle size={18} className="text-[#BFDBFE] hover:text-[#0A8FA8] transition-colors" />
                                  )}
                                </button>
                                <div className={`flex-1 p-3 rounded-lg ${ms.is_completed ? 'bg-[#F0FDF4] border border-[#BBF7D0]' : 'bg-[#F0F7FA] border border-[#DBEAFE]'}`}>
                                  <p className={`text-sm font-medium ${ms.is_completed ? 'text-[#166534] line-through' : 'text-[#0B1F33]'}`}>{ms.title}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {ms.due_date && <span className="text-xs text-[#4B6B7A]">Due: {new Date(ms.due_date).toLocaleDateString()}</span>}
                                    {ms.completed_at && <span className="text-xs text-[#10B981]">✓ Completed {new Date(ms.completed_at).toLocaleDateString()}</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-[#4B6B7A] text-center py-8">No milestones yet. Add your first milestone to track progress.</p>
                      )}
                    </div>
                  )}

                  {/* ============ SPRINTS TAB ============ */}
                  {activeTab === 'sprints' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-[#0B1F33]">Sprints</h3>
                        <button onClick={() => setShowSprintForm(!showSprintForm)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#0A8FA8] text-white rounded-lg hover:bg-[#088096]">
                          <Plus size={14} /> Add Sprint
                        </button>
                      </div>
                      {showSprintForm && (
                        <div className="bg-[#F0F7FA] p-4 rounded-lg mb-4 space-y-3">
                          <input type="text" placeholder="Sprint name" value={sprintForm.sprint_name}
                            onChange={(e) => setSprintForm({...sprintForm, sprint_name: e.target.value})}
                            className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm" />
                          <div className="grid grid-cols-2 gap-3">
                            <input type="date" placeholder="Start date" value={sprintForm.start_date}
                              onChange={(e) => setSprintForm({...sprintForm, start_date: e.target.value})}
                              className="px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm" />
                            <input type="date" placeholder="End date" value={sprintForm.end_date}
                              onChange={(e) => setSprintForm({...sprintForm, end_date: e.target.value})}
                              className="px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleAddSprint} disabled={saving}
                              className="text-xs px-3 py-1.5 bg-[#0A8FA8] text-white rounded-lg">{saving ? 'Adding...' : 'Add'}</button>
                            <button onClick={() => setShowSprintForm(false)}
                              className="text-xs px-3 py-1.5 border border-[#BFDBFE] rounded-lg">Cancel</button>
                          </div>
                        </div>
                      )}
                      {sprints.length > 0 ? (
                        <div className="space-y-3">
                          {sprints.map((sprint: any) => {
                            const statusColor = sprint.status === 'active' ? '#10B981' : sprint.status === 'completed' ? '#6B7280' : '#3B82F6'
                            return (
                              <div key={sprint.id} className="p-4 bg-[#F0F7FA] rounded-lg border border-[#DBEAFE]">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-[#0B1F33]">{sprint.sprint_name}</p>
                                    <p className="text-xs text-[#4B6B7A] mt-1">
                                      {new Date(sprint.start_date).toLocaleDateString()} — {new Date(sprint.end_date).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-[#4B6B7A]">
                                      {sprint.completed_task_count || 0}/{sprint.task_count || 0} tasks
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                      style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                                      {sprint.status}
                                    </span>
                                    {sprint.status === 'planned' && (
                                      <button onClick={() => updateSprintStatus(sprint.id, 'active', profile!.id).then(() => getSprints(project!.id).then(setSprints))}
                                        className="text-xs text-[#0A8FA8] hover:underline">Start</button>
                                    )}
                                    {sprint.status === 'active' && (
                                      <button onClick={() => updateSprintStatus(sprint.id, 'completed', profile!.id).then(() => getSprints(project!.id).then(setSprints))}
                                        className="text-xs text-[#10B981] hover:underline">Complete</button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-[#4B6B7A] text-center py-8">No sprints yet. Create your first sprint.</p>
                      )}
                    </div>
                  )}

                  {/* ============ TASKS TAB (Kanban Board) ============ */}
                  {activeTab === 'tasks' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-[#0B1F33]">Tasks ({totalTasks})</h3>
                        <button onClick={() => setShowTaskForm(!showTaskForm)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#0A8FA8] text-white rounded-lg hover:bg-[#088096]">
                          <Plus size={14} /> Add Task
                        </button>
                      </div>
                      {showTaskForm && (
                        <div className="bg-[#F0F7FA] p-4 rounded-lg mb-4 space-y-3">
                          <input type="text" placeholder="Task title" value={taskForm.title}
                            onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                            className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm" />
                          <textarea placeholder="Description (optional)" value={taskForm.description}
                            onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                            className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm resize-none" rows={2} />
                          <div className="grid grid-cols-3 gap-3">
                            <select value={taskForm.priority} onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                              className="px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm bg-white">
                              {Object.entries(PRIORITY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                            <select value={taskForm.status} onChange={(e) => setTaskForm({...taskForm, status: e.target.value})}
                              className="px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm bg-white">
                              {Object.entries(TASK_STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                            <input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({...taskForm, due_date: e.target.value})}
                              className="px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleAddTask} disabled={saving}
                              className="text-xs px-3 py-1.5 bg-[#0A8FA8] text-white rounded-lg">{saving ? 'Adding...' : 'Add Task'}</button>
                            <button onClick={() => setShowTaskForm(false)}
                              className="text-xs px-3 py-1.5 border border-[#BFDBFE] rounded-lg">Cancel</button>
                          </div>
                        </div>
                      )}
                      {/* Kanban Board */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {(['todo', 'in_progress', 'review', 'done'] as ProjectTaskStatus[]).map((status) => {
                          const tasks = tasksByStatus[status] || []
                          const color = TASK_STATUS_COLORS[status]
                          return (
                            <div key={status} className="bg-[#F0F7FA] rounded-lg p-3">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                  <span className="text-xs font-semibold text-[#0B1F33]">{TASK_STATUS_LABELS[status]}</span>
                                </div>
                                <span className="text-xs text-[#4B6B7A] bg-white px-2 py-0.5 rounded-full">{tasks.length}</span>
                              </div>
                              <div className="space-y-2 min-h-[100px]">
                                {tasks.map((task: any) => (
                                  <div key={task.id} className="bg-white p-3 rounded-lg border border-[#DBEAFE] shadow-sm hover:shadow-md transition-all">
                                    <p className="text-sm font-medium text-[#0B1F33] mb-1">{task.title}</p>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                                        style={{ backgroundColor: `${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}15`, color: PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] }}>
                                        {task.priority}
                                      </span>
                                      {task.assigned_to_name && (
                                        <span className="text-xs text-[#4B6B7A]">{task.assigned_to_name}</span>
                                      )}
                                    </div>
                                    {task.due_date && (
                                      <p className="text-xs text-[#94A3B8] mt-1">{new Date(task.due_date).toLocaleDateString()}</p>
                                    )}
                                    {/* Status change buttons */}
                                    <div className="flex gap-1 mt-2 flex-wrap">
                                      {status !== 'todo' && (
                                        <button onClick={() => handleTaskStatusChange(task.id, status === 'in_progress' ? 'todo' : status === 'review' ? 'in_progress' : 'review')}
                                          className="text-[10px] px-1.5 py-0.5 border border-[#DBEAFE] rounded hover:bg-[#F0F7FA]">← Back</button>
                                      )}
                                      {status !== 'done' && (
                                        <button onClick={() => handleTaskStatusChange(task.id, status === 'todo' ? 'in_progress' : status === 'in_progress' ? 'review' : 'done')}
                                          className="text-[10px] px-1.5 py-0.5 bg-[#0A8FA8]/10 text-[#0A8FA8] rounded hover:bg-[#0A8FA8]/20">Next →</button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* ============ TEAM TAB ============ */}
                  {activeTab === 'team' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-[#0B1F33]">Team Members ({members.length})</h3>
                        <button onClick={() => setShowMemberForm(!showMemberForm)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#0A8FA8] text-white rounded-lg hover:bg-[#088096]">
                          <Plus size={14} /> Add Member
                        </button>
                      </div>
                      {showMemberForm && (
                        <div className="bg-[#F0F7FA] p-4 rounded-lg mb-4 space-y-3">
                          <select value={memberForm.role} onChange={(e) => setMemberForm({...memberForm, role: e.target.value})}
                            className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm bg-white">
                            {Object.entries(MEMBER_ROLE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                          <p className="text-xs text-[#4B6B7A]">Note: In production, a developer picker would be shown here. For now, team members are managed through Supabase.</p>
                          <button onClick={() => setShowMemberForm(false)}
                            className="text-xs px-3 py-1.5 border border-[#BFDBFE] rounded-lg">Close</button>
                        </div>
                      )}
                      {members.length > 0 ? (
                        <div className="space-y-3">
                          {members.map((member: any) => (
                            <div key={member.id} className="flex items-center justify-between p-4 bg-[#F0F7FA] rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#0A8FA8] rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {member.first_name?.[0]}{member.last_name?.[0]}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-[#0B1F33]">{member.first_name} {member.last_name}</p>
                                  <p className="text-xs text-[#4B6B7A]">{member.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[#0A8FA8]/10 text-[#0A8FA8] font-medium">
                                  {MEMBER_ROLE_LABELS[member.role as keyof typeof MEMBER_ROLE_LABELS] || member.role}
                                </span>
                                <button onClick={() => removeProjectMember(member.id, project!.id, profile!.id).then(() => getProjectMembers(project!.id).then(setMembers))}
                                  className="p-1 text-[#EF4444] hover:bg-red-50 rounded">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-[#4B6B7A] text-center py-8">No team members assigned yet.</p>
                      )}
                    </div>
                  )}

                  {/* ============ COMMENTS TAB ============ */}
                  {activeTab === 'comments' && (
                    <div>
                      <h3 className="font-semibold text-[#0B1F33] mb-4">Comments ({comments.length})</h3>
                      <div className="space-y-3 mb-4">
                        {comments.length > 0 ? comments.map((comment: any) => (
                          <div key={comment.id} className="flex gap-3 p-3 bg-[#F0F7FA] rounded-lg">
                            <div className="w-8 h-8 bg-[#0A8FA8] rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                              {comment.author_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-[#0B1F33]">{comment.author_name || 'Unknown'}</span>
                                <span className="text-xs text-[#94A3B8]">{new Date(comment.created_at).toLocaleString()}</span>
                              </div>
                              <p className="text-sm text-[#4B6B7A] mt-1">{comment.content}</p>
                            </div>
                          </div>
                        )) : (
                          <p className="text-sm text-[#4B6B7A] text-center py-8">No comments yet. Start the conversation!</p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <input type="text" placeholder="Write a comment..." value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                          className="flex-1 px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm" />
                        <button onClick={handleAddComment} disabled={saving || !newComment.trim()}
                          className="px-4 py-2 bg-[#0A8FA8] text-white rounded-lg text-sm hover:bg-[#088096] disabled:opacity-50">
                          {saving ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ============ ACTIVITY TAB ============ */}
                  {activeTab === 'activity' && (
                    <div>
                      <h3 className="font-semibold text-[#0B1F33] mb-4">Activity History</h3>
                      {activity.length > 0 ? (
                        <div className="space-y-3">
                          {activity.map((entry: any) => (
                            <div key={entry.id} className="flex items-start gap-3 p-3 bg-[#F0F7FA] rounded-lg">
                              <div className="w-2 h-2 bg-[#0A8FA8] rounded-full mt-1.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm text-[#0B1F33]">
                                  <span className="font-medium">{entry.performed_by_name || 'System'}</span>
                                  {' — '}
                                  {entry.action}
                                </p>
                                <p className="text-xs text-[#94A3B8] mt-0.5">{new Date(entry.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-[#4B6B7A] text-center py-8">No activity recorded yet.</p>
                      )}
                    </div>
                  )}

                  {/* ============ ATTACHMENTS TAB ============ */}
                  {activeTab === 'attachments' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-[#0B1F33]">Attachments ({attachments.length})</h3>
                      </div>
                      {attachments.length > 0 ? (
                        <div className="space-y-3">
                          {attachments.map((att: any) => (
                            <div key={att.id} className="flex items-center justify-between p-3 bg-[#F0F7FA] rounded-lg">
                              <div className="flex items-center gap-3">
                                <Paperclip size={16} className="text-[#4B6B7A]" />
                                <div>
                                  <p className="text-sm font-medium text-[#0B1F33]">{att.file_name}</p>
                                  <p className="text-xs text-[#94A3B8]">{new Date(att.created_at).toLocaleString()}</p>
                                </div>
                              </div>
                              <a href={att.file_url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-[#0A8FA8] hover:underline">Download</a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-[#4B6B7A] text-center py-8">No attachments yet.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
