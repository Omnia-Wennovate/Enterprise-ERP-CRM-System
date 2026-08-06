'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type { ProjectCredential, CredentialAccessLog, CredentialType, DeploymentEnvironment } from '@/types/tech'
import { CREDENTIAL_TYPE_LABELS, CREDENTIAL_TYPE_COLORS, DEPLOYMENT_ENV_LABELS } from '@/types/tech'
import {
  Loader2, KeyRound, Search, Shield, Eye, EyeOff, RotateCw, Plus, Calendar, AlertTriangle, ChevronRight, Lock, Database
} from 'lucide-react'
import { getAllCredentials, getCredentialAccessLog, revealCredential, createCredential, deleteCredential } from '@/lib/services/project-credentials'
import { getProjects } from '@/lib/services/projects'
import Link from 'next/link'

export default function CredentialVaultPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<ProjectCredential[]>([])
  const [accessLogs, setAccessLogs] = useState<CredentialAccessLog[]>([])
  const [projects, setProjects] = useState<{id: string, name: string}[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  
  // Security/Reveal states
  const [revealedCreds, setRevealedCreds] = useState<Record<string, string>>({})
  const [isRevealing, setIsRevealing] = useState<string | null>(null)
  const [masterKeyPrompt, setMasterKeyPrompt] = useState<{isOpen: boolean, targetId: string | null}>({isOpen: false, targetId: null})
  const [masterKey, setMasterKey] = useState('')
  const [keyError, setKeyError] = useState('')

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
  }, [profile, typeFilter])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [creds, logs, projs] = await Promise.all([
        getAllCredentials({ type: typeFilter !== 'all' ? typeFilter : undefined, search: search || undefined }),
        getCredentialAccessLog(undefined, 20),
        getProjects({ status: 'all' })
      ])
      setCredentials(creds)
      setAccessLogs(logs)
      setProjects(projs.map(p => ({ id: p.id, name: p.name })))
    } catch (err: any) {
      console.error('Failed to load vault data:', err)
      const errorMsg = err?.message || err?.details || err?.hint || JSON.stringify(err) || 'Unknown error occurred'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    loadData()
  }

  const handleRevealClick = (id: string) => {
    if (revealedCreds[id]) {
      // Hide if already revealed
      const newRevealed = { ...revealedCreds }
      delete newRevealed[id]
      setRevealedCreds(newRevealed)
    } else {
      // Prompt for master key
      setMasterKey('')
      setKeyError('')
      setMasterKeyPrompt({ isOpen: true, targetId: id })
    }
  }

  const submitMasterKey = async () => {
    if (!masterKeyPrompt.targetId || !profile) return
    if (!masterKey.trim()) {
      setKeyError('Master key is required')
      return
    }

    try {
      setIsRevealing(masterKeyPrompt.targetId)
      setKeyError('')
      
      const secret = await revealCredential(masterKeyPrompt.targetId, profile.id, masterKey)
      
      setRevealedCreds(prev => ({
        ...prev,
        [masterKeyPrompt.targetId as string]: secret
      }))
      
      setMasterKeyPrompt({ isOpen: false, targetId: null })
      
      // Refresh logs
      const logs = await getCredentialAccessLog(undefined, 20)
      setAccessLogs(logs)
      
    } catch (err: any) {
      console.error('Failed to reveal credential:', err)
      setKeyError(err.message || 'Invalid master key or permission denied')
    } finally {
      setIsRevealing(null)
    }
  }

  if (!profile) return null

  const hasRevealAccess = ['super_admin', 'admin'].includes(profile.role) || (profile.department === 'technology' && profile.position === 'Technical Lead')

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6 relative">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Link href="/tech/dashboard" className="hover:text-primary">Technology</Link>
                <ChevronRight size={14} />
                <span className="text-foreground font-medium">Credential Vault</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Shield size={28} className="text-warning" />
                Secure Credential Vault
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and audit access to encrypted project secrets, API keys, and database passwords
              </p>
            </div>
            {hasRevealAccess && (
              <button
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
              >
                <Plus size={16} />
                Add Credential
              </button>
            )}
          </div>

          {!hasRevealAccess && (
            <div className="bg-warning/10 border border-[#FDE68A] text-[#B45309] px-4 py-3 rounded-lg mb-6 flex items-center gap-3 shadow-sm">
              <Lock size={20} className="text-warning" />
              <div>
                <p className="font-semibold text-sm">Restricted Access</p>
                <p className="text-xs">You have view-only access to credential metadata. Revealing secrets requires Administrator or Technical Lead permissions.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-4 rounded-lg mb-6 shadow-sm flex items-start gap-3">
              <Database size={20} className="mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-sm">Database Connection Error</h3>
                <p className="text-sm mt-1">{error}</p>
                <p className="text-xs mt-2 font-medium opacity-80">Did you forget to apply the SQL schema for this module in Supabase?</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Credentials List */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Filters */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-background border border-border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#0A8FA8] focus-within:border-transparent transition-shadow">
                    <Search size={16} className="text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search credentials..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="bg-transparent text-sm text-foreground placeholder-[#94A3B8] outline-none flex-1"
                    />
                  </div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg text-sm text-foreground bg-card hover:border-primary transition-colors focus:ring-2 focus:ring-[#0A8FA8] outline-none"
                  >
                    <option value="all">All Types</option>
                    {Object.entries(CREDENTIAL_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* List */}
              <div className="bg-card rounded-xl border border-border shadow-sm">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin text-primary" size={48} />
                  </div>
                ) : credentials.length > 0 ? (
                  <div className="divide-y divide-[#DBEAFE]">
                    {credentials.map((cred) => {
                      const isRevealed = !!revealedCreds[cred.id]
                      const secretText = isRevealed ? revealedCreds[cred.id] : '••••••••••••••••'
                      const isExpired = cred.expiry_date && new Date(cred.expiry_date) < new Date()
                      
                      return (
                        <div key={cred.id} className={`p-5 transition-colors ${!cred.is_active ? 'bg-gray-50 opacity-75' : isExpired ? 'bg-destructive/10' : 'hover:bg-background'}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                  {cred.credential_name}
                                  {!cred.is_active && <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Inactive</span>}
                                  {isExpired && <span className="text-[10px] bg-[#FECACA] text-[#DC2626] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Expired</span>}
                                </h3>
                                <span
                                  className="text-[11px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider flex items-center gap-1.5"
                                  style={{
                                    backgroundColor: `${CREDENTIAL_TYPE_COLORS[cred.credential_type]}15`,
                                    color: CREDENTIAL_TYPE_COLORS[cred.credential_type],
                                    border: `1px solid ${CREDENTIAL_TYPE_COLORS[cred.credential_type]}30`
                                  }}
                                >
                                  <KeyRound size={12} />
                                  {CREDENTIAL_TYPE_LABELS[cred.credential_type]}
                                </span>
                                <span className="text-[11px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider bg-muted text-[#475569] border border-border">
                                  {DEPLOYMENT_ENV_LABELS[cred.environment]}
                                </span>
                              </div>
                              
                              <p className="text-sm text-muted-foreground font-medium mb-3">Project: <Link href={`/tech/projects/${cred.project_id}`} className="text-primary hover:underline">{cred.project_name}</Link></p>
                              
                              <div className="bg-muted border border-border rounded-lg p-3 inline-block min-w-[300px]">
                                {cred.username && (
                                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Username</span>
                                    <span className="text-sm font-mono text-[#0F172A]">{cred.username}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Secret</span>
                                  <div className="flex items-center gap-3">
                                    <span className={`text-sm font-mono ${isRevealed ? 'text-[#0F172A]' : 'text-muted-foreground tracking-widest'}`}>
                                      {secretText}
                                    </span>
                                    {hasRevealAccess && (
                                      <button 
                                        onClick={() => handleRevealClick(cred.id)}
                                        className="text-muted-foreground hover:text-primary transition-colors p-1"
                                        disabled={isRevealing === cred.id}
                                        title={isRevealed ? "Hide secret" : "Reveal secret"}
                                      >
                                        {isRevealing === cred.id ? <Loader2 size={16} className="animate-spin" /> : isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground">
                              {cred.expiry_date && (
                                <span className={`flex items-center gap-1 ${isExpired ? 'text-[#DC2626] font-bold' : ''}`}>
                                  <Calendar size={12} />
                                  Expires: {new Date(cred.expiry_date).toLocaleDateString()}
                                </span>
                              )}
                              <span>Created: {new Date(cred.created_at).toLocaleDateString()}</span>
                              {hasRevealAccess && (
                                <button className="mt-2 flex items-center gap-1.5 px-3 py-1.5 border border-border bg-background text-primary rounded hover:bg-primary/10 transition-colors font-medium">
                                  <RotateCw size={14} />
                                  Rotate Key
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                      <KeyRound size={32} className="text-[#DBEAFE]" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Credentials Found</h3>
                    <p className="text-sm text-muted-foreground">No encrypted credentials match your search criteria.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Audit Log */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border shadow-sm sticky top-6">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Shield size={18} className="text-primary" />
                    Access Audit Log
                  </h3>
                  <span className="text-[10px] bg-background text-primary px-2 py-1 rounded font-bold uppercase tracking-wider">Live</span>
                </div>
                <div className="p-0">
                  {accessLogs.length > 0 ? (
                    <div className="divide-y divide-[#F1F5F9] max-h-[600px] overflow-y-auto custom-scrollbar">
                      {accessLogs.map((log) => (
                        <div key={log.id} className="p-4 hover:bg-muted transition-colors">
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-sm font-semibold text-[#0F172A]">{log.accessed_by_name}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                              log.action === 'reveal' ? 'bg-blue-500/10 text-blue-500' :
                              log.action === 'create' ? 'bg-success/10 text-success' :
                              log.action === 'rotate' ? 'bg-warning/10 text-warning' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {log.action}
                            </span>
                            <span className="text-xs text-muted-foreground">credential:</span>
                            <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">{log.credential_name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      No recent access logs.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Master Key Modal */}
      {masterKeyPrompt.isOpen && (
        <div className="fixed inset-0 bg-[#0B1F33]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-border">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-warning/10 text-warning flex items-center justify-center mb-4 border border-[#FDE68A]">
                <Shield size={24} />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Security Verification</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Please enter the Vault Master Key to decrypt and reveal this credential. This action will be logged in the audit trail.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-foreground mb-1.5">Vault Master Key</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitMasterKey()}
                    className="w-full pl-9 pr-4 py-2.5 bg-muted border border-[#CBD5E1] rounded-lg text-sm text-[#0F172A] focus:ring-2 focus:ring-[#0A8FA8] focus:border-transparent outline-none transition-shadow"
                    placeholder="Enter master key..."
                    autoFocus
                  />
                </div>
                {keyError && <p className="text-xs text-destructive mt-1.5 font-medium">{keyError}</p>}
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-8">
                <button
                  onClick={() => setMasterKeyPrompt({ isOpen: false, targetId: null })}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitMasterKey}
                  disabled={isRevealing !== null}
                  className="flex items-center gap-2 px-5 py-2 bg-[#F59E0B] text-primary-foreground text-sm font-bold rounded-lg hover:bg-[#D97706] transition-colors disabled:opacity-70 shadow-sm hover:shadow"
                >
                  {isRevealing !== null ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                  Reveal Secret
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
