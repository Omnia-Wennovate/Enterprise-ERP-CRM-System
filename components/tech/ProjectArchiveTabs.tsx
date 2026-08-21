'use client'

import { useState, useEffect } from 'react'
import type { Profile } from '@/types'
import {
  Loader2, Code2, Server, GitMerge, FileText, BookOpen, Wrench, Activity, ExternalLink
} from 'lucide-react'
import { getProjectRepository } from '@/lib/services/project-repositories'
import { getProjectDeployments } from '@/lib/services/project-deployments'
import { getProjectReleases } from '@/lib/services/project-releases'
import { getProjectDocuments } from '@/lib/services/project-documents'
import { getProjectKnowledgeBase } from '@/lib/services/project-knowledge-base'
import { getProjectMaintenance } from '@/lib/services/project-maintenance'
import { calculateProjectHealth } from '@/lib/services/project-health'
import { DEPLOYMENT_ENV_COLORS, DEPLOYMENT_ENV_LABELS, HEALTH_COLORS, HEALTH_LABELS } from '@/types/tech'

type ArchiveTabType = 'repository' | 'deployment' | 'releases' | 'documents' | 'kb' | 'maintenance' | 'health'

interface ProjectArchiveTabsProps {
  projectId: string
  activeTab: ArchiveTabType
  profile: Profile
}

export function ProjectArchiveTabs({ projectId, activeTab, profile }: ProjectArchiveTabsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    loadTabData()
  }, [projectId, activeTab])

  const loadTabData = async () => {
    setIsLoading(true)
    setData(null)
    try {
      switch (activeTab) {
        case 'repository':
          setData(await getProjectRepository(projectId))
          break
        case 'deployment':
          setData(await getProjectDeployments(projectId))
          break
        case 'releases':
          setData(await getProjectReleases(projectId))
          break
        case 'documents':
          setData(await getProjectDocuments(projectId))
          break
        case 'kb':
          setData(await getProjectKnowledgeBase(projectId))
          break
        case 'maintenance':
          setData(await getProjectMaintenance(projectId))
          break
        case 'health':
          const healthData = await calculateProjectHealth(projectId)
          setData(healthData)
          break
      }
    } catch (err) {
      console.error(`Failed to load ${activeTab} data:`, err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  if (activeTab === 'repository') {
    const repos = data || []
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Source Code Repositories</h3>
        </div>
        {repos.length > 0 ? (
          <div className="space-y-4">
            {repos.map((repo: any) => (
              <div key={repo.id} className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Code2 size={18} className="text-primary" />
                    <h4 className="font-semibold text-foreground">{repo.repository_name}</h4>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase">{repo.repository_type}</span>
                  </div>
                  <a href={repo.repository_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                    View <ExternalLink size={12} />
                  </a>
                </div>
                {repo.description && <p className="text-sm text-muted-foreground mb-3">{repo.description}</p>}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Branch: <span className="font-mono bg-card px-1.5 py-0.5 rounded border border-border">{repo.default_branch}</span></span>
                  {repo.last_commit_hash && (
                    <span>Last commit: <span className="font-mono bg-card px-1.5 py-0.5 rounded border border-border">{repo.last_commit_hash.substring(0, 7)}</span></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No repositories linked to this project.</p>
        )}
      </div>
    )
  }

  if (activeTab === 'deployment') {
    const deps = data || []
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Deployments & Environments</h3>
        </div>
        {deps.length > 0 ? (
          <div className="space-y-4">
            {deps.map((dep: any) => (
              <div key={dep.id} className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Server size={18} className="text-primary" />
                    <h4 className="font-semibold text-foreground">{dep.environment} Environment</h4>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-bold uppercase border"
                      style={{
                        backgroundColor: `${DEPLOYMENT_ENV_COLORS[dep.environment as keyof typeof DEPLOYMENT_ENV_COLORS]}15`,
                        color: DEPLOYMENT_ENV_COLORS[dep.environment as keyof typeof DEPLOYMENT_ENV_COLORS],
                        borderColor: `${DEPLOYMENT_ENV_COLORS[dep.environment as keyof typeof DEPLOYMENT_ENV_COLORS]}30`
                      }}
                    >
                      {DEPLOYMENT_ENV_LABELS[dep.environment as keyof typeof DEPLOYMENT_ENV_LABELS] || dep.environment}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${dep.status === 'success' ? 'bg-success/10 text-success' : dep.status === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                      {dep.status}
                    </span>
                  </div>
                  {dep.url && (
                    <a href={dep.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                      Open App <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Provider</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{dep.hosting_provider || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Version</p>
                    <p className="text-sm font-mono text-foreground mt-0.5">{dep.version || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Last Deployed</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{dep.deployed_at ? new Date(dep.deployed_at).toLocaleDateString() : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Deployed By</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{dep.deployed_by_name || 'System'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No deployment environments configured.</p>
        )}
      </div>
    )
  }

  if (activeTab === 'releases') {
    const rels = data || []
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Release History</h3>
        </div>
        {rels.length > 0 ? (
          <div className="space-y-4">
            {rels.map((rel: any) => (
              <div key={rel.id} className="bg-card rounded-lg p-5 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#FAFAF7]">
                  <div className="flex items-center gap-3">
                    <GitMerge size={20} className="text-[#8B5CF6]" />
                    <h4 className="text-lg font-bold text-foreground">{rel.version}</h4>
                    {rel.is_major && <span className="text-[10px] bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded-full font-bold uppercase">Major Release</span>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{rel.release_date ? new Date(rel.release_date).toLocaleDateString() : '—'}</p>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p className="whitespace-pre-wrap">{rel.release_notes || 'No release notes provided.'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No releases tracked for this project.</p>
        )}
      </div>
    )
  }

  if (activeTab === 'documents') {
    const docs = data || []
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Architecture & Documentation</h3>
        </div>
        {docs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map((doc: any) => (
              <div key={doc.id} className="bg-background rounded-lg p-4 border border-border hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground truncate" title={doc.title}>{doc.title}</h4>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{doc.document_type.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                {doc.description && <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{doc.description}</p>}
                <div className="mt-4 pt-3 border-t border-border">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline flex items-center justify-center gap-1">
                    View Document <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No technical documents available.</p>
        )}
      </div>
    )
  }

  if (activeTab === 'kb') {
    const kbs = data || []
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Knowledge Base & Learnings</h3>
        </div>
        {kbs.length > 0 ? (
          <div className="space-y-4">
            {kbs.map((kb: any) => (
              <div key={kb.id} className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="p-4 bg-muted border-b border-border flex items-center gap-3">
                  <BookOpen size={18} className="text-blue-500" />
                  <h4 className="font-bold text-foreground flex-1">{kb.title}</h4>
                  <span className="text-[10px] bg-omnia-gold/50/10 text-blue-500 border border-border px-2 py-0.5 rounded font-bold uppercase">{kb.category}</span>
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{kb.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No knowledge base articles created.</p>
        )}
      </div>
    )
  }

  if (activeTab === 'maintenance') {
    const reqs = data || []
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Maintenance Log</h3>
        </div>
        {reqs.length > 0 ? (
          <div className="space-y-3">
            {reqs.map((req: any) => (
              <div key={req.id} className="bg-card rounded-lg p-4 border border-border flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${req.request_type === 'bug' ? 'bg-destructive/10 text-destructive' : 'bg-background text-primary'}`}>
                  <Wrench size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{req.title}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${req.status === 'resolved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{req.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Type: {req.request_type}</span>
                    <span>Priority: {req.priority}</span>
                    <span>Reported: {new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No maintenance requests logged.</p>
        )}
      </div>
    )
  }

  if (activeTab === 'health') {
    const health = data
    if (!health) {
      return <p className="text-sm text-muted-foreground text-center py-8">No health metrics available for this project.</p>
    }
    
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-foreground">Project Health Metrics</h3>
          <span className="text-[11px] bg-muted text-muted-foreground px-2.5 py-1 rounded font-bold uppercase">
            Last updated: {new Date(health.last_updated).toLocaleString()}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Code Quality Score</p>
            <p className="text-2xl font-bold text-foreground">{health.code_quality_score}/100</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Test Coverage</p>
            <p className="text-2xl font-bold text-foreground">{health.test_coverage_percent}%</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Tech Debt Items</p>
            <p className="text-2xl font-bold text-destructive">{health.technical_debt_items}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Security Score</p>
            <p className="text-2xl font-bold text-success">{health.security_score}/100</p>
          </div>
        </div>

        {health.notes && (
          <div className="bg-muted rounded-lg p-5 border border-border">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              Architectural Notes
            </h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{health.notes}</p>
          </div>
        )}
      </div>
    )
  }

  return null
}
