'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type { SocialAccount } from '@/types/marketing'
import { PLATFORM_COLORS, PLATFORM_LABELS } from '@/types/marketing'
import {
  Loader2, Plus, RefreshCw, ExternalLink, X, Link2, Unlink,
  CheckCircle2, AlertCircle, Clock, Wifi, WifiOff, AlertTriangle,
  TrendingUp, TrendingDown, Users, Heart, Eye, BarChart3, Info
} from 'lucide-react'
import {
  getSocialAccounts,
  disconnectSocialAccount,
  deleteSocialAccount,
  initiateOAuth,
  syncSocialAccount,
  updateAccountInfo,
  createManualAccount,
  getLatestMetricsForAccount,
  type LatestAccountMetrics,
  type SyncResponse,
} from '@/lib/services/social-accounts'
import { isOAuthSupported, OAUTH_SUPPORTED_PLATFORMS } from '@/lib/services/social/platform-registry'
import { PLATFORM_CAPABILITY_MATRIX as CAP } from '@/lib/services/social/social-provider'

// ─── Types ─────────────────────────────────────────────────────────────────

interface AccountWithMetrics {
  account: SocialAccount
  metrics: LatestAccountMetrics | null
  syncing: boolean
  syncError: string | null
  syncAction: 'reconnect' | 'retry_later' | 'retry' | null
  lastSyncedLabel: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

const CONNECTION_STATUS_CONFIG = {
  oauth_connected: { label: 'Connected', color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: Wifi, dot: 'bg-emerald-400' },
  manual:          { label: 'Not Connected', color: 'text-slate-500', bg: 'bg-slate-500/10', icon: WifiOff, dot: 'bg-slate-400' },
  disconnected:    { label: 'Disconnected', color: 'text-slate-400', bg: 'bg-slate-400/10', icon: WifiOff, dot: 'bg-slate-300' },
  expired:         { label: 'Token Expired', color: 'text-amber-600', bg: 'bg-amber-500/10', icon: AlertTriangle, dot: 'bg-amber-400' },
  error:           { label: 'Connection Error', color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertCircle, dot: 'bg-red-400' },
} as const

// ─── Platform Icons (emoji fallback — replace with SVGs if you have them) ───
const PLATFORM_ICONS: Record<string, string> = {
  tiktok: '🎵', instagram: '📸', facebook: '👍', linkedin: '💼',
  youtube: '▶️', twitter: '✕', telegram: '✈️', whatsapp: '💬',
}

// ─── Main Component ─────────────────────────────────────────────────────────

function SocialAccountsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [accountsData, setAccountsData] = useState<AccountWithMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [addForm, setAddForm] = useState({ platform: 'facebook', account_name: '', profile_url: '' })
  const [isAdding, setIsAdding] = useState(false)
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null)

  // Handle OAuth redirect result
  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    const platform = searchParams.get('platform')
    const account = searchParams.get('account')

    if (connected === 'true') {
      const label = platform ? PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] ?? platform : 'Account'
      showToast('success', `${label} — ${account ?? 'Account'} connected! Initial sync starting...`)
      // Clean URL
      router.replace('/marketing/accounts')
    } else if (error) {
      showToast('error', decodeURIComponent(error))
      router.replace('/marketing/accounts')
    }
  }, [searchParams, router])

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try { setProfile(JSON.parse(authUser)) } catch { router.push('/login') }
  }, [router])

  useEffect(() => {
    if (profile) loadAccounts()
  }, [profile])

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  const loadAccounts = useCallback(async () => {
    setIsLoading(true)
    try {
      const accounts = await getSocialAccounts()
      const withMetrics = await Promise.all(
        accounts.map(async (account) => {
          const metrics = await getLatestMetricsForAccount(account.id).catch(() => null)
          return {
            account,
            metrics,
            syncing: false,
            syncError: null,
            syncAction: null,
            lastSyncedLabel: relativeTime(account.last_sync_at),
          } satisfies AccountWithMetrics
        })
      )
      setAccountsData(withMetrics)
    } catch (err) {
      console.error('Failed to load accounts:', err)
      showToast('error', 'Failed to load accounts')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── OAuth Connect ─────────────────────────────────────────────────────────

  const handleConnect = async (platform: string) => {
    if (!profile) return
    setConnectingPlatform(platform)
    try {
      const result = await initiateOAuth(platform, profile.id)
      if ('error' in result) {
        if (result.setup_required) {
          showToast('error', `${PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] ?? platform} credentials not configured yet. Add ${platform.toUpperCase()}_CLIENT_KEY / CLIENT_SECRET to .env.local first.`)
        } else {
          showToast('error', result.error)
        }
      } else {
        // Redirect to platform OAuth page
        window.location.href = result.authUrl
      }
    } catch (err) {
      showToast('error', `Failed to start OAuth: ${(err as Error).message}`)
    } finally {
      setConnectingPlatform(null)
    }
  }

  // ─── Sync ─────────────────────────────────────────────────────────────────

  const handleSync = async (accountId: string) => {
    setAccountsData(prev => prev.map(d =>
      d.account.id === accountId ? { ...d, syncing: true, syncError: null } : d
    ))
    try {
      const result: SyncResponse = await syncSocialAccount(accountId)
      if (result.success) {
        // Refresh this account's data
        const metrics = await getLatestMetricsForAccount(accountId).catch(() => null)
        setAccountsData(prev => prev.map(d => {
          if (d.account.id !== accountId) return d
          return {
            ...d,
            account: result.account ?? d.account,
            metrics,
            syncing: false,
            syncError: null,
            syncAction: null,
            lastSyncedLabel: 'Just now',
          }
        }))
        const delta = result.followerDelta
        const deltaLabel = delta !== null && delta !== undefined
          ? ` (${delta >= 0 ? '+' : ''}${formatNumber(delta)} followers)`
          : ''
        showToast('success', `Synced${deltaLabel} — ${formatNumber(result.followersNow)} followers`)
      } else {
        setAccountsData(prev => prev.map(d => {
          if (d.account.id !== accountId) return d
          return {
            ...d, syncing: false,
            syncError: result.error ?? 'Sync failed',
            syncAction: result.action ?? 'retry',
          }
        }))
        showToast('error', result.error ?? 'Sync failed')
      }
    } catch (err) {
      setAccountsData(prev => prev.map(d =>
        d.account.id === accountId
          ? { ...d, syncing: false, syncError: (err as Error).message, syncAction: 'retry' }
          : d
      ))
    }
  }

  // ─── Disconnect ────────────────────────────────────────────────────────────

  const handleDisconnect = async (accountId: string) => {
    setShowDisconnectConfirm(null)
    try {
      const result = await disconnectSocialAccount(accountId)
      if (result.success) {
        showToast('info', 'Account disconnected. Historical data preserved.')
        await loadAccounts()
      } else {
        showToast('error', result.error ?? 'Disconnect failed')
      }
    } catch (err) {
      showToast('error', (err as Error).message)
    }
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (accountId: string) => {
    setShowDeleteConfirm(null)
    try {
      await deleteSocialAccount(accountId)
      showToast('success', 'Account removed.')
      setAccountsData(prev => prev.filter(d => d.account.id !== accountId))
    } catch (err) {
      showToast('error', (err as Error).message)
    }
  }

  // ─── Add Manual Account ────────────────────────────────────────────────────

  const handleAddManual = async () => {
    if (!addForm.account_name) return
    setIsAdding(true)
    try {
      await createManualAccount(addForm)
      setShowAddModal(false)
      setAddForm({ platform: 'facebook', account_name: '', profile_url: '' })
      showToast('success', 'Account added. Connect it to start syncing real data.')
      await loadAccounts()
    } catch (err) {
      showToast('error', (err as Error).message)
    } finally {
      setIsAdding(false)
    }
  }

  if (!profile) return null

  const oauthPlatforms = OAUTH_SUPPORTED_PLATFORMS
  const manualPlatforms = ['youtube', 'twitter', 'telegram', 'whatsapp'] as const

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Social Media Accounts</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Connect accounts via OAuth to sync real follower counts and analytics
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={16} /> Add Account
            </button>
          </div>

          {/* ── Credential Notice ── */}
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 flex gap-3">
            <Info size={18} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <span className="font-semibold">Setup required before connecting:</span> Add your platform app credentials to{' '}
              <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded font-mono text-xs">.env.local</code> —{' '}
              <code className="font-mono text-xs">TIKTOK_CLIENT_KEY</code>,{' '}
              <code className="font-mono text-xs">META_APP_ID</code>,{' '}
              <code className="font-mono text-xs">LINKEDIN_CLIENT_ID</code>, and{' '}
              <code className="font-mono text-xs">ENCRYPTION_KEY</code>.
              See <code className="font-mono text-xs">.env.local</code> for full instructions.
            </div>
          </div>

          {/* ── OAuth-Supported Platforms Quick Connect ── */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Connect via Official API (OAuth)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {oauthPlatforms.map(platform => {
                const label = PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] ?? platform
                const color = PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] ?? '#6B7280'
                const existing = accountsData.find(d => d.account.platform === platform)
                const isConnected = existing?.account.connection_status === 'oauth_connected'
                const isLoading = connectingPlatform === platform
                return (
                  <button
                    key={platform}
                    onClick={() => !isConnected && handleConnect(platform)}
                    disabled={isLoading || isConnected}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      isConnected
                        ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 cursor-default'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-foreground cursor-pointer'
                    }`}
                  >
                    <span className="text-xl">{PLATFORM_ICONS[platform] ?? '🔗'}</span>
                    <span className="flex-1 text-left">{label}</span>
                    {isLoading && <Loader2 size={14} className="animate-spin" />}
                    {isConnected && <CheckCircle2 size={14} className="text-emerald-500" />}
                    {!isConnected && !isLoading && (
                      <Link2 size={14} className="text-muted-foreground" />
                    )}
                    {/* platform color strip */}
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ backgroundColor: color }} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Account Cards ── */}
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="animate-spin text-primary" size={40} />
            </div>
          ) : accountsData.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <WifiOff className="mx-auto mb-4 text-muted-foreground" size={40} />
              <p className="text-foreground font-medium mb-1">No social accounts yet</p>
              <p className="text-muted-foreground text-sm mb-6">
                Click a platform above to connect via OAuth, or use Add Account for manual entries.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {accountsData.map(({ account, metrics, syncing, syncError, syncAction, lastSyncedLabel }) => {
                const color = PLATFORM_COLORS[account.platform as keyof typeof PLATFORM_COLORS] ?? '#6B7280'
                const label = PLATFORM_LABELS[account.platform as keyof typeof PLATFORM_LABELS] ?? account.platform
                const statusCfg = CONNECTION_STATUS_CONFIG[account.connection_status as keyof typeof CONNECTION_STATUS_CONFIG]
                  ?? CONNECTION_STATUS_CONFIG.manual
                const StatusIcon = statusCfg.icon
                const isOAuth = isOAuthSupported(account.platform)
                const cap = CAP[account.platform as keyof typeof CAP]
                const isConnected = account.connection_status === 'oauth_connected'
                const needsReconnect = ['expired', 'error'].includes(account.connection_status)

                // Follower display: use real metrics if available, fall back to column (but show warning)
                const followersFromMetrics = metrics?.followers
                const followersFromDb = account.followers_count
                const displayFollowers = isConnected ? (followersFromMetrics ?? followersFromDb) : null
                const isMetricsReal = isConnected && followersFromMetrics !== null && followersFromMetrics !== undefined
                const followerDelta = isMetricsReal ? metrics?.followerDelta : null
                const followerDeltaPct = isMetricsReal ? metrics?.followerDeltaPct : null

                return (
                  <div key={account.id} className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                    {/* Platform color bar */}
                    <div className="h-1" style={{ backgroundColor: color }} />

                    <div className="p-5 flex-1 flex flex-col">
                      {/* Header row */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                            style={{ backgroundColor: `${color}18` }}
                          >
                            {account.avatar_url
                              ? <img src={account.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                              : PLATFORM_ICONS[account.platform] ?? '🔗'
                            }
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground leading-tight">
                              {account.account_name}
                            </p>
                            {account.username && (
                              <p className="text-xs text-muted-foreground">@{account.username}</p>
                            )}
                            <p className="text-xs font-medium mt-0.5" style={{ color }}>{label}</p>
                          </div>
                        </div>

                        {/* Connection status badge */}
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </div>
                      </div>

                      {/* ── Metrics Grid ── */}
                      {isConnected ? (
                        <>
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {/* Followers */}
                            <div className="bg-background rounded-lg p-3">
                              <div className="flex items-center gap-1 mb-1">
                                <Users size={11} className="text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Followers</p>
                              </div>
                              <p className="text-lg font-bold text-foreground">
                                {displayFollowers !== null ? formatNumber(displayFollowers) : '—'}
                              </p>
                              {followerDelta !== null && (
                                <div className={`flex items-center gap-0.5 text-xs mt-0.5 ${followerDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {followerDelta >= 0
                                    ? <TrendingUp size={10} />
                                    : <TrendingDown size={10} />
                                  }
                                  {followerDelta >= 0 ? '+' : ''}{formatNumber(followerDelta)}
                                  {followerDeltaPct !== null && (
                                    <span className="text-muted-foreground ml-0.5">({followerDeltaPct > 0 ? '+' : ''}{followerDeltaPct}%)</span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Engagements or Impressions */}
                            <div className="bg-background rounded-lg p-3">
                              <div className="flex items-center gap-1 mb-1">
                                <BarChart3 size={11} className="text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                  {cap?.impressions ? 'Impressions' : cap?.engagements ? 'Engagements' : 'Reach'}
                                </p>
                              </div>
                              {cap?.impressions || cap?.engagements || cap?.reach ? (
                                <p className="text-lg font-bold text-foreground">
                                  {formatNumber(metrics?.impressions ?? metrics?.engagements ?? metrics?.reach ?? null)}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">Not available</p>
                              )}
                            </div>

                            {/* Likes / Video Views */}
                            <div className="bg-background rounded-lg p-3">
                              <div className="flex items-center gap-1 mb-1">
                                <Heart size={11} className="text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Likes</p>
                              </div>
                              {cap?.likes ? (
                                <p className="text-base font-bold text-foreground">
                                  {formatNumber(metrics?.likes ?? null)}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">N/A</p>
                              )}
                            </div>

                            {/* Last sync / API status */}
                            <div className="bg-background rounded-lg p-3">
                              <div className="flex items-center gap-1 mb-1">
                                <Clock size={11} className="text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Last synced</p>
                              </div>
                              <p className="text-sm font-medium text-foreground">
                                {account.last_sync_status === 'success'
                                  ? lastSyncedLabel
                                  : account.last_sync_status === 'syncing'
                                  ? 'Syncing...'
                                  : account.last_sync_at
                                  ? lastSyncedLabel
                                  : 'Not yet'
                                }
                              </p>
                              {account.last_sync_status === 'failed' && (
                                <p className="text-xs text-red-500 mt-0.5">Last sync failed</p>
                              )}
                            </div>
                          </div>

                          {/* Metrics data source note */}
                          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                            <CheckCircle2 size={10} className="text-emerald-500" />
                            Live data from {label} API
                            {metrics?.metricDate && ` · ${new Date(metrics.metricDate).toLocaleDateString()}`}
                          </p>
                        </>
                      ) : (
                        /* Not connected state */
                        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                          <WifiOff size={28} className="text-muted-foreground mb-2" />
                          <p className="text-sm font-medium text-foreground mb-1">Not API connected</p>
                          <p className="text-xs text-muted-foreground mb-3">
                            {account.connection_status === 'manual'
                              ? isOAuth
                                ? 'Connect via OAuth to sync real data'
                                : 'This platform does not support OAuth yet'
                              : needsReconnect
                              ? 'Token expired — reconnect to resume syncing'
                              : 'Connect this account to see live metrics'
                            }
                          </p>
                          {account.followers_count > 0 && (
                            <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-1.5">
                              ⚠ Showing {account.followers_count.toLocaleString()} manually entered followers — not from API
                            </p>
                          )}
                        </div>
                      )}

                      {/* ── Sync error ── */}
                      {syncError && (
                        <div className="mb-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                          <AlertCircle size={12} className="inline mr-1" />
                          {syncError}
                        </div>
                      )}

                      {/* ── Actions ── */}
                      <div className="flex items-center gap-2 pt-3 border-t border-border mt-auto flex-wrap">
                        {/* Sync / Connect / Reconnect */}
                        {isConnected ? (
                          <button
                            onClick={() => handleSync(account.id)}
                            disabled={syncing}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
                          >
                            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                            {syncing ? 'Syncing...' : syncAction === 'retry_later' ? 'Rate limited' : 'Sync'}
                          </button>
                        ) : isOAuth ? (
                          <button
                            onClick={() => handleConnect(account.platform)}
                            disabled={connectingPlatform === account.platform}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            {connectingPlatform === account.platform
                              ? <><Loader2 size={12} className="animate-spin" /> Connecting...</>
                              : needsReconnect
                              ? <><RefreshCw size={12} /> Reconnect</>
                              : <><Link2 size={12} /> Connect</>
                            }
                          </button>
                        ) : null}

                        {/* Open on platform */}
                        {account.profile_url && (
                          <a
                            href={account.profile_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-background rounded-lg hover:bg-primary/10 transition-colors"
                          >
                            <ExternalLink size={12} /> Open
                          </a>
                        )}

                        {/* Disconnect */}
                        {isConnected && (
                          <button
                            onClick={() => setShowDisconnectConfirm(account.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-background rounded-lg hover:bg-amber-50 hover:text-amber-700 transition-colors"
                          >
                            <Unlink size={12} /> Disconnect
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => setShowDeleteConfirm(account.id)}
                          className="ml-auto px-3 py-1.5 text-xs font-medium text-destructive bg-destructive/10 rounded-lg hover:bg-destructive/20 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Manual / Unsupported Platforms info ── */}
          <div className="mt-8 p-4 rounded-xl border border-border bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Platforms without OAuth support (manual entry only):
            </p>
            <div className="flex gap-2 flex-wrap">
              {manualPlatforms.map(p => (
                <span key={p} className="text-xs text-muted-foreground px-2.5 py-1 bg-background rounded-lg border border-border">
                  {PLATFORM_ICONS[p]} {PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS] ?? p}
                </span>
              ))}
            </div>
          </div>

        </main>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50 max-w-sm ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' :
          toast.type === 'error' ? 'bg-red-600 text-white' :
          'bg-slate-800 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> :
           toast.type === 'error' ? <AlertCircle size={16} /> :
           <Info size={16} />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Add Manual Account Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Add Social Account</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  For OAuth-supported platforms, use the Connect buttons above instead
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Platform</label>
                <select
                  value={addForm.platform}
                  onChange={e => setAddForm({ ...addForm, platform: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <optgroup label="OAuth Supported (use Connect above)">
                    {OAUTH_SUPPORTED_PLATFORMS.map(p => (
                      <option key={p} value={p}>{PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS]} (OAuth)</option>
                    ))}
                  </optgroup>
                  <optgroup label="Manual Entry Only">
                    {manualPlatforms.map(p => (
                      <option key={p} value={p}>{PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS] ?? p}</option>
                    ))}
                  </optgroup>
                </select>
                {isOAuthSupported(addForm.platform) && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠ This platform supports OAuth. Use the Connect button above for live API data.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Account Name</label>
                <input
                  type="text"
                  value={addForm.account_name}
                  onChange={e => setAddForm({ ...addForm, account_name: e.target.value })}
                  placeholder="e.g. @omniatravel"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Profile URL (optional)</label>
                <input
                  type="url"
                  value={addForm.profile_url}
                  onChange={e => setAddForm({ ...addForm, profile_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200">
                <Info size={12} className="inline mr-1" />
                Followers will show as 0 until an OAuth connection is made. No manual follower count entry.
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleAddManual}
                disabled={!addForm.account_name || isAdding}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {isAdding && <Loader2 size={14} className="animate-spin" />}
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Disconnect Confirm ── */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <AlertTriangle className="text-amber-500 mb-3" size={32} />
            <h3 className="text-base font-semibold text-foreground mb-2">Disconnect account?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              The OAuth token will be revoked and credentials cleared. Historical metrics and posts are preserved.
              You can reconnect at any time.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDisconnectConfirm(null)}
                className="flex-1 px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:bg-background"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDisconnect(showDisconnectConfirm)}
                className="flex-1 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <AlertCircle className="text-red-500 mb-3" size={32} />
            <h3 className="text-base font-semibold text-foreground mb-2">Remove account?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              This permanently removes the account record and all associated metrics. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:bg-background"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-destructive text-white text-sm font-medium rounded-lg hover:bg-destructive/90"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default function SocialAccountsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
      <SocialAccountsContent />
    </Suspense>
  )
}
