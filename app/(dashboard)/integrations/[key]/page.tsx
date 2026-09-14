'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Clock, ExternalLink, Settings, Loader2, Activity
} from 'lucide-react'
import Link from 'next/link'

interface Integration {
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

interface SyncLogEntry {
  id: string
  integration_key: string
  status: string
  records_processed: number | null
  error_message: string | null
  triggered_by: string
  started_at: string
  completed_at: string | null
}

const INTEGRATION_ICONS: Record<string, string> = {
  tiktok: '🎵', meta: '📘', linkedin: '💼',
  supabase_auth: '🔐', supabase_storage: '📦', smtp_email: '✉️',
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function timeAgo(iso: string | null) {
  if (!iso) return 'Never'
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    connected:      { cls: 'bg-emerald-100 text-emerald-700', label: 'Connected' },
    disconnected:   { cls: 'bg-red-100 text-red-700',        label: 'Disconnected' },
    not_configured: { cls: 'bg-muted text-muted-foreground', label: 'Not Configured' },
    error:          { cls: 'bg-red-100 text-red-700',        label: 'Error' },
    needs_attention:{ cls: 'bg-amber-100 text-amber-700',    label: 'Needs Attention' },
    syncing:        { cls: 'bg-blue-100 text-blue-700',      label: 'Syncing' },
    success:        { cls: 'bg-emerald-100 text-emerald-700',label: 'Success' },
    failure:        { cls: 'bg-red-100 text-red-700',        label: 'Failed' },
    started:        { cls: 'bg-blue-100 text-blue-700',      label: 'Started' },
  }
  const c = map[status] || map.not_configured
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.cls}`}>
      {c.label}
    </span>
  )
}

export default function IntegrationDetailPage() {
  const { key } = useParams<{ key: string }>()
  const router = useRouter()

  const [integration, setIntegration] = useState<Integration | null>(null)
  const [syncLog, setSyncLog]         = useState<SyncLogEntry[]>([])
  const [loading, setLoading]         = useState(true)
  const [syncing, setSyncing]         = useState(false)
  const [syncResult, setSyncResult]   = useState<{ ok: boolean; msg: string } | null>(null)

  const fetch_ = async () => {
    setLoading(true)
    try {
      const [intRes, logRes] = await Promise.all([
        fetch(`/api/integrations/${key}`),
        fetch(`/api/integrations/${key}/sync-log`),
      ])
      if (intRes.ok) setIntegration(await intRes.json())
      if (logRes.ok) setSyncLog(await logRes.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch_() }, [key])

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch(`/api/integrations/sync/${key}`, { method: 'POST' })
      const json = await res.json()
      setSyncResult({ ok: json.success, msg: json.success ? 'Sync completed.' : json.error || 'Sync failed.' })
      fetch_()
    } catch (e: any) {
      setSyncResult({ ok: false, msg: e.message })
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncResult(null), 6000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Loading integration…</span>
      </div>
    )
  }

  if (!integration) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-muted-foreground">Integration not found.</p>
        <Link href="/integrations" className="text-omnia-gold text-sm mt-3 inline-block">← Back to Integrations</Link>
      </div>
    )
  }

  const icon = INTEGRATION_ICONS[key] || '🔗'
  const isBuiltIn = ['supabase_auth', 'supabase_storage'].includes(key)

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Back */}
      <Link href="/integrations" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ArrowLeft size={14} /> Back to Integrations
      </Link>

      {/* Header card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-3xl shadow-sm">
              {icon}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{integration.display_name}</h1>
              <p className="text-sm text-muted-foreground capitalize">{integration.category.replace('_', ' ')}</p>
            </div>
          </div>
          <StatusBadge status={integration.connection_status} />
        </div>

        {/* Sync result */}
        {syncResult && (
          <div className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
            syncResult.ok
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {syncResult.ok ? <CheckCircle size={15} /> : <XCircle size={15} />}
            {syncResult.msg}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-5 flex gap-2 flex-wrap">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-omnia-gold hover:bg-omnia-gold-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {syncing ? (
              <><Loader2 size={14} className="animate-spin" /> Syncing…</>
            ) : (
              <><RefreshCw size={14} /> Sync Now</>
            )}
          </button>

          {!isBuiltIn && integration.connection_status !== 'connected' && (
            <Link
              href={`/marketing/accounts`}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <ExternalLink size={14} /> Connect via OAuth
            </Link>
          )}

          <button
            onClick={fetch_}
            className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors ml-auto"
          >
            <RefreshCw size={14} /> Refresh Status
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Connection info */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <Settings size={15} className="text-omnia-gold" /> Connection
          </h2>
          <DetailRow label="Status"           value={integration.connection_status} />
          <DetailRow label="Connected Account" value={integration.connected_account_name} />
          <DetailRow label="Platform ID"       value={integration.connected_account_id} note="Safe public identifier" />
          <DetailRow label="Enabled"           value={integration.is_enabled ? 'Yes' : 'No'} />
          {isBuiltIn && (
            <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-900">
              ✓ This is a built-in Supabase integration — always available.
            </p>
          )}
        </div>

        {/* Last sync */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <Clock size={15} className="text-omnia-gold" /> Last Sync
          </h2>
          <DetailRow label="Last Sync"         value={timeAgo(integration.last_sync_at)} />
          <DetailRow label="Sync Time"         value={formatDateTime(integration.last_sync_at)} />
          <DetailRow label="Sync Status"       value={integration.last_sync_status} />
          <DetailRow label="Records Processed" value={integration.records_processed?.toString()} />
          {integration.last_sync_error && (
            <div className="mt-2 p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Last Error</p>
              <p className="text-xs text-red-700 dark:text-red-300">{integration.last_sync_error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-muted/60 border border-border text-xs text-muted-foreground">
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-amber-500" />
        OAuth tokens, refresh tokens, API secrets, and private keys are never displayed here.
        Only safe public identifiers (account name, platform user ID) are shown.
        All sync events are recorded in the Audit Log.
      </div>

      {/* Sync log */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Activity size={15} className="text-omnia-gold" />
          <h2 className="font-semibold text-foreground text-sm">Sync History</h2>
          <span className="text-xs text-muted-foreground ml-1">({syncLog.length} recent events)</span>
        </div>

        {syncLog.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            No sync events recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {syncLog.map(entry => (
              <div key={entry.id} className="px-5 py-3 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={entry.status} />
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(entry.started_at)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {entry.triggered_by}
                    </span>
                  </div>
                  {entry.records_processed !== null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {entry.records_processed} records processed
                    </p>
                  )}
                  {entry.error_message && (
                    <p className="text-xs text-red-500 mt-1 truncate max-w-sm" title={entry.error_message}>
                      {entry.error_message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value, note }: { label: string; value: string | null | undefined; note?: string }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <div>
        <span className="text-xs text-muted-foreground">{label}</span>
        {note && <p className="text-[10px] text-muted-foreground/60">{note}</p>}
      </div>
      <span className="text-xs text-foreground font-medium text-right max-w-[180px] truncate" title={value ?? ''}>
        {value || '—'}
      </span>
    </div>
  )
}
