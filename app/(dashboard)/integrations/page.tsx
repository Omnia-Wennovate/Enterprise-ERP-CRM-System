'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Zap, RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock,
  Settings, ExternalLink, Wifi, WifiOff, Loader2, ChevronRight
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Integration {
  id: string
  integration_key: string
  display_name: string
  category: string
  is_enabled: boolean
  connection_status: string
  connected_account_name: string | null
  connected_account_id: string | null
  last_sync_at: string | null
  last_sync_status: string | null
  last_sync_error: string | null
  records_processed: number | null
  config: Record<string, unknown>
}

const CATEGORY_LABELS: Record<string, string> = {
  social_media:  'Social Media',
  email:         'Email',
  storage:       'Storage',
  auth:          'Authentication',
  analytics:     'Analytics',
  communication: 'Communication',
}

const INTEGRATION_ICONS: Record<string, string> = {
  tiktok:          '🎵',
  meta:            '📘',
  linkedin:        '💼',
  supabase_auth:   '🔐',
  supabase_storage:'📦',
  smtp_email:      '✉️',
}

const INTEGRATION_COLORS: Record<string, string> = {
  tiktok:          'from-slate-900 to-slate-700',
  meta:            'from-blue-600 to-blue-800',
  linkedin:        'from-blue-500 to-blue-700',
  supabase_auth:   'from-emerald-600 to-emerald-800',
  supabase_storage:'from-violet-600 to-violet-800',
  smtp_email:      'from-orange-500 to-orange-700',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
    connected:       { label: 'Connected',      cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
    disconnected:    { label: 'Disconnected',   cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',         icon: XCircle },
    not_configured:  { label: 'Not Configured', cls: 'bg-muted text-muted-foreground',                                        icon: Settings },
    error:           { label: 'Error',          cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',         icon: AlertTriangle },
    needs_attention: { label: 'Needs Attention',cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertTriangle },
    syncing:         { label: 'Syncing',        cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',     icon: RefreshCw },
  }
  const c = cfg[status] || cfg.not_configured
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${c.cls}`}>
      <Icon size={11} />
      {c.label}
    </span>
  )
}

function timeAgo(iso: string | null) {
  if (!iso) return 'Never'
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ─── Integration Card ─────────────────────────────────────────────────────────

function IntegrationCard({
  integration,
  onSync,
  syncing,
}: {
  integration: Integration
  onSync: (key: string) => Promise<void>
  syncing: boolean
}) {
  const icon = INTEGRATION_ICONS[integration.integration_key] || '🔗'
  const color = INTEGRATION_COLORS[integration.integration_key] || 'from-slate-600 to-slate-800'
  const isConnected = integration.connection_status === 'connected'
  const isBuiltIn = ['supabase_auth', 'supabase_storage'].includes(integration.integration_key)

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all group">
      {/* Top bar gradient */}
      <div className={`h-1.5 bg-gradient-to-r ${color}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-xl shadow-sm`}>
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">{integration.display_name}</h3>
              <span className="text-xs text-muted-foreground capitalize">
                {CATEGORY_LABELS[integration.category] || integration.category}
              </span>
            </div>
          </div>
          <StatusBadge status={integration.connection_status} />
        </div>

        {/* Connected account */}
        {integration.connected_account_name && (
          <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
            <CheckCircle size={12} className="text-emerald-500" />
            <span>{integration.connected_account_name}</span>
          </div>
        )}

        {/* Last sync */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
          <Clock size={12} />
          <span>Last sync: {timeAgo(integration.last_sync_at)}</span>
          {integration.last_sync_status && (
            <span className={`ml-1 ${integration.last_sync_status === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
              ({integration.last_sync_status})
            </span>
          )}
        </div>

        {/* Error message */}
        {integration.last_sync_error && integration.connection_status === 'error' && (
          <div className="mb-3 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 line-clamp-2">
            {integration.last_sync_error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isBuiltIn && (
            <Link
              href={`/integrations/${integration.integration_key}`}
              className="flex items-center gap-1 text-xs text-omnia-gold hover:text-omnia-gold-dark font-medium transition-colors"
            >
              Manage <ChevronRight size={12} />
            </Link>
          )}

          <button
            onClick={() => onSync(integration.integration_key)}
            disabled={syncing || !integration.is_enabled}
            className="flex items-center gap-1 ml-auto text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <><Loader2 size={11} className="animate-spin" /> Syncing…</>
            ) : (
              <><RefreshCw size={11} /> Sync Now</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading]           = useState(true)
  const [syncing, setSyncing]           = useState<Record<string, boolean>>({})
  const [syncResult, setSyncResult]     = useState<{ key: string; ok: boolean; msg: string } | null>(null)
  const [filter, setFilter]             = useState<string>('all')

  const fetchIntegrations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/integrations')
      if (!res.ok) throw new Error('Failed to load')
      setIntegrations(await res.json())
    } catch {
      setIntegrations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchIntegrations() }, [fetchIntegrations])

  const handleSync = async (key: string) => {
    setSyncing(s => ({ ...s, [key]: true }))
    setSyncResult(null)
    try {
      const res = await fetch(`/api/integrations/sync/${key}`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setSyncResult({ key, ok: true, msg: 'Sync completed successfully.' })
        fetchIntegrations()
      } else {
        setSyncResult({ key, ok: false, msg: json.error || 'Sync failed.' })
        fetchIntegrations()
      }
    } catch (e: any) {
      setSyncResult({ key, ok: false, msg: e.message || 'Sync error.' })
    } finally {
      setSyncing(s => ({ ...s, [key]: false }))
      setTimeout(() => setSyncResult(null), 6000)
    }
  }

  // Stats
  const connected     = integrations.filter(i => i.connection_status === 'connected').length
  const errors        = integrations.filter(i => ['error', 'needs_attention'].includes(i.connection_status)).length
  const notConfigured = integrations.filter(i => i.connection_status === 'not_configured').length

  // Grouped by category
  const categories = [...new Set(integrations.map(i => i.category))]
  const filtered = filter === 'all' ? integrations : integrations.filter(i => i.category === filter)

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Zap size={22} className="text-omnia-gold" />
            Integrations
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage external service connections and synchronisation
          </p>
        </div>
        <button
          onClick={fetchIntegrations}
          className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',          value: integrations.length, color: 'text-foreground' },
          { label: 'Connected',      value: connected,     color: 'text-emerald-600' },
          { label: 'Errors',         value: errors,        color: 'text-red-500' },
          { label: 'Not Configured', value: notConfigured, color: 'text-muted-foreground' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl px-5 py-4 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Sync result banner */}
      {syncResult && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
          syncResult.ok
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20'
            : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20'
        }`}>
          {syncResult.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
          <span><strong>{syncResult.key}</strong>: {syncResult.msg}</span>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
            filter === 'all' ? 'bg-omnia-gold text-white' : 'border border-border hover:bg-muted text-muted-foreground'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors capitalize ${
              filter === cat ? 'bg-omnia-gold text-white' : 'border border-border hover:bg-muted text-muted-foreground'
            }`}
          >
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 gap-3">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
          <span className="text-muted-foreground text-sm">Loading integrations…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <Wifi size={36} className="text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No integrations in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(integration => (
            <IntegrationCard
              key={integration.integration_key}
              integration={integration}
              onSync={handleSync}
              syncing={!!syncing[integration.integration_key]}
            />
          ))}
        </div>
      )}

      {/* Important note */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-muted/60 border border-border text-sm text-muted-foreground">
        <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-amber-500" />
        <p>
          Only integrations with a real OAuth connection show <strong>Connected</strong> status.
          Connection status is read directly from the database — never manually set.
          Sync results and errors are recorded in the Audit Log.
        </p>
      </div>
    </div>
  )
}
