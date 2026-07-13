'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type { FeatureRequest, FeatureRequestComment, Project } from '@/types/tech'
import {
  FR_STATUS_LABELS, FR_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS,
  DEPARTMENT_LABELS
} from '@/types/tech'
import {
  Loader2, ArrowLeft, CheckCircle2, XCircle, User, MessageSquare,
  Paperclip, Clock, GitBranch, ArrowRight, Zap, Calendar
} from 'lucide-react'
import {
  getFeatureRequestById, updateFeatureRequest, approveFeatureRequest,
  rejectFeatureRequest, assignDeveloper, updateFeatureRequestStatus,
  getFeatureRequestComments, addFeatureRequestComment, getFeatureRequestAttachments
} from '@/lib/services/feature-requests'
import { getProjects } from '@/lib/services/projects'
import { createTaskFromFeatureRequest } from '@/lib/services/project-tasks'
import { getAllTechTeamWorkload } from '@/lib/services/tech-workload'
import type { WorkloadScore } from '@/types/tech'
import Link from 'next/link'

export default function FeatureRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [request, setRequest] = useState<FeatureRequest | null>(null)
  const [comments, setComments] = useState<FeatureRequestComment[]>([])
  const [attachments, setAttachments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [rejectNotes, setRejectNotes] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showConvertForm, setShowConvertForm] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [createNewProject, setCreateNewProject] = useState(false)
  const [developers, setDevelopers] = useState<WorkloadScore[]>([])
  const [showAssignForm, setShowAssignForm] = useState(false)

  // Determine if user is tech team
  const isTechTeam = profile?.department === 'technology' || profile?.role === 'super_admin' || profile?.role === 'admin'

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try { setProfile(JSON.parse(authUser)) } catch { router.push('/login') }
  }, [router])

  useEffect(() => {
    if (!profile || !id) return
    loadRequest()
  }, [profile, id])

  const loadRequest = async () => {
    try {
      setIsLoading(true)
      const [req, cm, att, devs] = await Promise.all([
        getFeatureRequestById(id),
        getFeatureRequestComments(id),
        getFeatureRequestAttachments(id),
        getAllTechTeamWorkload(),
      ])
      setRequest(req)
      setComments(cm)
      setAttachments(att)
      setDevelopers(devs)
    } catch (err) {
      console.error('Failed to load feature request:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!profile || !request) return
    try {
      setSaving(true)
      await approveFeatureRequest(request.id, profile.id)
      await loadRequest()
    } catch (err) {
      console.error('Failed to approve:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleReject = async () => {
    if (!profile || !request) return
    try {
      setSaving(true)
      await rejectFeatureRequest(request.id, profile.id, rejectNotes)
      setShowRejectForm(false)
      setRejectNotes('')
      await loadRequest()
    } catch (err) {
      console.error('Failed to reject:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleAssign = async (developerId: string) => {
    if (!profile || !request) return
    try {
      setSaving(true)
      await assignDeveloper(request.id, developerId, profile.id)
      setShowAssignForm(false)
      await loadRequest()
    } catch (err) {
      console.error('Failed to assign:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!profile || !request) return
    try {
      setSaving(true)
      await updateFeatureRequestStatus(request.id, newStatus, profile.id)
      await loadRequest()
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleConvertToTask = async () => {
    if (!profile || !request) return
    try {
      setSaving(true)
      if (createNewProject) {
        // Create a new project from the request, then convert
        const { createProject } = await import('@/lib/services/projects')
        const project = await createProject({
          name: request.title,
          description: request.description,
          priority: request.priority,
          status: 'planning',
        }, profile.id)
        await createTaskFromFeatureRequest(project.id, request.id, profile.id)
        router.push(`/tech/projects/${project.id}`)
      } else if (selectedProjectId) {
        await createTaskFromFeatureRequest(selectedProjectId, request.id, profile.id)
        await loadRequest()
        setShowConvertForm(false)
      }
    } catch (err) {
      console.error('Failed to convert:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleAddComment = async () => {
    if (!profile || !request || !newComment.trim()) return
    try {
      setSaving(true)
      await addFeatureRequestComment(request.id, profile.id, newComment)
      setNewComment('')
      const cm = await getFeatureRequestComments(request.id)
      setComments(cm)
    } catch (err) {
      console.error('Failed to add comment:', err)
    } finally {
      setSaving(false)
    }
  }

  const openConvertForm = async () => {
    const p = await getProjects()
    setProjects(p)
    setShowConvertForm(true)
  }

  if (!profile) return null

  const statusSteps = ['requested', 'approved', 'development', 'testing', 'completed']
  const currentStepIndex = request ? statusSteps.indexOf(request.status) : -1

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
          ) : !request ? (
            <div className="text-center py-20">
              <p className="text-[#4B6B7A]">Feature request not found</p>
              <Link href="/tech/feature-requests" className="text-[#0A8FA8] hover:underline text-sm mt-2 inline-block">Back to Requests</Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <Link href="/tech/feature-requests" className="p-2 rounded-lg hover:bg-[#DBEAFE] transition-colors mt-1">
                  <ArrowLeft size={20} className="text-[#4B6B7A]" />
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-[#0B1F33]">{request.title}</h1>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${FR_STATUS_COLORS[request.status]}15`, color: FR_STATUS_COLORS[request.status] }}>
                      {FR_STATUS_LABELS[request.status]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${PRIORITY_COLORS[request.priority]}15`, color: PRIORITY_COLORS[request.priority] }}>
                      {PRIORITY_LABELS[request.priority]}
                    </span>
                  </div>
                  <p className="text-sm text-[#4B6B7A]">
                    From {DEPARTMENT_LABELS[request.department] || request.department} department
                    {request.requested_by_name && ` — by ${request.requested_by_name}`}
                  </p>
                </div>
              </div>

              {/* Status Timeline */}
              {request.status !== 'rejected' && (
                <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6 mb-6">
                  <h3 className="text-sm font-semibold text-[#0B1F33] mb-4">Status Timeline</h3>
                  <div className="flex items-center justify-between">
                    {statusSteps.map((step, i) => {
                      const isActive = i <= currentStepIndex
                      const isCurrent = i === currentStepIndex
                      const color = FR_STATUS_COLORS[step as keyof typeof FR_STATUS_COLORS]
                      return (
                        <div key={step} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                              isCurrent ? 'border-[#0A8FA8] bg-[#0A8FA8] text-white scale-110' :
                              isActive ? 'border-[#10B981] bg-[#10B981] text-white' :
                              'border-[#DBEAFE] bg-white text-[#94A3B8]'
                            }`}>
                              {isActive && i < currentStepIndex ? '✓' : i + 1}
                            </div>
                            <span className={`text-[10px] mt-1 font-medium ${isCurrent ? 'text-[#0A8FA8]' : isActive ? 'text-[#10B981]' : 'text-[#94A3B8]'}`}>
                              {FR_STATUS_LABELS[step as keyof typeof FR_STATUS_LABELS]}
                            </span>
                          </div>
                          {i < statusSteps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 ${isActive && i < currentStepIndex ? 'bg-[#10B981]' : 'bg-[#DBEAFE]'}`} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {request.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-700 font-medium">❌ This request has been rejected</p>
                  {request.notes && <p className="text-xs text-red-600 mt-1">Reason: {request.notes}</p>}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Description */}
                  <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                    <h3 className="font-semibold text-[#0B1F33] mb-3">Description</h3>
                    <p className="text-sm text-[#4B6B7A] whitespace-pre-wrap">{request.description || 'No description provided'}</p>
                    {request.business_impact && (
                      <div className="mt-4 p-3 bg-[#FEF3C7] rounded-lg">
                        <p className="text-xs font-medium text-[#92400E]">💡 Business Impact</p>
                        <p className="text-sm text-[#78350F] mt-1">{request.business_impact}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions for Tech Team */}
                  {isTechTeam && (
                    <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                      <h3 className="font-semibold text-[#0B1F33] mb-4">Actions</h3>
                      <div className="flex flex-wrap gap-3">
                        {request.status === 'requested' && (
                          <>
                            <button onClick={handleApprove} disabled={saving}
                              className="flex items-center gap-2 px-4 py-2 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] text-sm font-medium disabled:opacity-50">
                              <CheckCircle2 size={16} /> Approve
                            </button>
                            <button onClick={() => setShowRejectForm(!showRejectForm)} disabled={saving}
                              className="flex items-center gap-2 px-4 py-2 bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626] text-sm font-medium disabled:opacity-50">
                              <XCircle size={16} /> Reject
                            </button>
                          </>
                        )}
                        {request.status === 'approved' && (
                          <>
                            <button onClick={() => handleStatusChange('development')} disabled={saving}
                              className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED] text-sm font-medium disabled:opacity-50">
                              <ArrowRight size={16} /> Move to Development
                            </button>
                            <button onClick={openConvertForm} disabled={saving}
                              className="flex items-center gap-2 px-4 py-2 bg-[#0A8FA8] text-white rounded-lg hover:bg-[#088096] text-sm font-medium disabled:opacity-50">
                              <Zap size={16} /> Convert to Project Task
                            </button>
                          </>
                        )}
                        {request.status === 'development' && (
                          <button onClick={() => handleStatusChange('testing')} disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-[#0A8FA8] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                            <ArrowRight size={16} /> Move to Testing
                          </button>
                        )}
                        {request.status === 'testing' && (
                          <button onClick={() => handleStatusChange('completed')} disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-[#10B981] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                            <CheckCircle2 size={16} /> Mark Completed
                          </button>
                        )}
                        {!request.assigned_developer && request.status !== 'rejected' && request.status !== 'completed' && (
                          <button onClick={() => setShowAssignForm(!showAssignForm)}
                            className="flex items-center gap-2 px-4 py-2 border border-[#BFDBFE] text-[#4B6B7A] rounded-lg text-sm font-medium hover:bg-[#F0F7FA]">
                            <User size={16} /> Assign Developer
                          </button>
                        )}
                      </div>

                      {/* Reject Form */}
                      {showRejectForm && (
                        <div className="mt-4 p-4 bg-red-50 rounded-lg space-y-3">
                          <textarea placeholder="Reason for rejection..." value={rejectNotes}
                            onChange={(e) => setRejectNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm resize-none" rows={3} />
                          <div className="flex gap-2">
                            <button onClick={handleReject} disabled={saving}
                              className="text-xs px-3 py-1.5 bg-[#EF4444] text-white rounded-lg">{saving ? 'Rejecting...' : 'Confirm Reject'}</button>
                            <button onClick={() => setShowRejectForm(false)}
                              className="text-xs px-3 py-1.5 border border-red-200 rounded-lg">Cancel</button>
                          </div>
                        </div>
                      )}

                      {/* Assign Developer Form */}
                      {showAssignForm && (
                        <div className="mt-4 p-4 bg-[#F0F7FA] rounded-lg space-y-3">
                          <p className="text-xs font-medium text-[#0B1F33]">Select a developer to assign:</p>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {developers.map((dev) => (
                              <button key={dev.profile_id} onClick={() => handleAssign(dev.profile_id)}
                                className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-[#DBEAFE] hover:border-[#0A8FA8] transition-colors text-left">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-[#0A8FA8] rounded-full flex items-center justify-center text-white text-xs">
                                    {dev.first_name?.[0]}{dev.last_name?.[0]}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-[#0B1F33]">{dev.first_name} {dev.last_name}</p>
                                    <p className="text-xs text-[#4B6B7A]">{dev.position}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-[#4B6B7A]">{dev.total_items} items</span>
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dev.color }}
                                    title={dev.level} />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Convert to Project Task Form */}
                      {showConvertForm && (
                        <div className="mt-4 p-4 bg-[#F0F7FA] rounded-lg space-y-3">
                          <p className="text-sm font-medium text-[#0B1F33]">Convert to Project Task</p>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" checked={!createNewProject} onChange={() => setCreateNewProject(false)}
                                className="accent-[#0A8FA8]" />
                              <span className="text-sm text-[#0B1F33]">Add to existing project</span>
                            </label>
                            {!createNewProject && (
                              <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="w-full px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm bg-white">
                                <option value="">Select a project...</option>
                                {projects.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            )}
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" checked={createNewProject} onChange={() => setCreateNewProject(true)}
                                className="accent-[#0A8FA8]" />
                              <span className="text-sm text-[#0B1F33]">Create new project from this request</span>
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleConvertToTask}
                              disabled={saving || (!createNewProject && !selectedProjectId)}
                              className="text-xs px-3 py-1.5 bg-[#0A8FA8] text-white rounded-lg disabled:opacity-50">
                              {saving ? 'Converting...' : 'Convert'}
                            </button>
                            <button onClick={() => setShowConvertForm(false)}
                              className="text-xs px-3 py-1.5 border border-[#BFDBFE] rounded-lg">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comments */}
                  <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                    <h3 className="font-semibold text-[#0B1F33] mb-4">
                      <MessageSquare size={16} className="inline mr-2" />
                      Discussion ({comments.length})
                    </h3>
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
                        <p className="text-sm text-[#4B6B7A] text-center py-6">No comments yet</p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <input type="text" placeholder="Write a comment..." value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                        className="flex-1 px-3 py-2 border border-[#BFDBFE] rounded-lg text-sm" />
                      <button onClick={handleAddComment} disabled={saving || !newComment.trim()}
                        className="px-4 py-2 bg-[#0A8FA8] text-white rounded-lg text-sm hover:bg-[#088096] disabled:opacity-50">
                        Send
                      </button>
                    </div>
                    {request.conversation_id && (
                      <p className="text-xs text-[#94A3B8] mt-2">
                        💬 <Link href="/communication" className="text-[#0A8FA8] hover:underline">Open in Communication Center</Link>
                      </p>
                    )}
                  </div>
                </div>

                {/* Sidebar Details */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                    <h3 className="font-semibold text-[#0B1F33] mb-4">Details</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-[#4B6B7A]">Department</p>
                        <p className="text-sm font-medium text-[#0B1F33] mt-0.5 capitalize">{DEPARTMENT_LABELS[request.department] || request.department}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#4B6B7A]">Requested By</p>
                        <p className="text-sm font-medium text-[#0B1F33] mt-0.5">{request.requested_by_name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#4B6B7A]">Assigned Developer</p>
                        <p className="text-sm font-medium text-[#0B1F33] mt-0.5">{request.assigned_developer_name || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#4B6B7A]">Approved By</p>
                        <p className="text-sm font-medium text-[#0B1F33] mt-0.5">{request.approved_by_name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#4B6B7A]">Requested Date</p>
                        <p className="text-sm font-medium text-[#0B1F33] mt-0.5">{request.requested_date ? new Date(request.requested_date).toLocaleDateString() : '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#4B6B7A]">Due Date</p>
                        <p className="text-sm font-medium text-[#0B1F33] mt-0.5">{request.due_date ? new Date(request.due_date).toLocaleDateString() : '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#4B6B7A]">Estimated Effort</p>
                        <p className="text-sm font-medium text-[#0B1F33] mt-0.5 capitalize">{request.estimated_effort || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#4B6B7A]">Completion</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-[#DBEAFE] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{
                              width: `${request.completion_percent}%`,
                              backgroundColor: FR_STATUS_COLORS[request.status],
                            }} />
                          </div>
                          <span className="text-xs font-bold text-[#0B1F33]">{request.completion_percent}%</span>
                        </div>
                      </div>
                      {request.converted_project_id && (
                        <div>
                          <p className="text-xs text-[#4B6B7A]">Linked Project</p>
                          <Link href={`/tech/projects/${request.converted_project_id}`}
                            className="text-sm font-medium text-[#0A8FA8] hover:underline mt-0.5 inline-block">
                            View Project →
                          </Link>
                        </div>
                      )}
                      {request.notes && (
                        <div>
                          <p className="text-xs text-[#4B6B7A]">Notes</p>
                          <p className="text-sm text-[#0B1F33] mt-0.5">{request.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attachments */}
                  <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                    <h3 className="font-semibold text-[#0B1F33] mb-3">
                      <Paperclip size={14} className="inline mr-2" />
                      Attachments ({attachments.length})
                    </h3>
                    {attachments.length > 0 ? (
                      <div className="space-y-2">
                        {attachments.map((att: any) => (
                          <div key={att.id} className="flex items-center gap-2 p-2 bg-[#F0F7FA] rounded-lg">
                            <Paperclip size={12} className="text-[#4B6B7A]" />
                            <span className="text-xs text-[#0B1F33] truncate flex-1">{att.file_name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#94A3B8]">No attachments</p>
                    )}
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
