'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, Filter, Calendar, RefreshCw, ChevronLeft, ChevronRight,
  ArrowUpDown, AlertTriangle, Shield, X, Eye, Clock, User,
  Globe, Monitor, FileText, ChevronDown, Archive, Download
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: string
  user_id: string | null
  user_email: string | null
  user_name: string | null
  department: string | null
  role: string | null
  action: string
  module: string
  page: string | null
  description: string | null
  entity_type: string | null
  entity_id: string | null
  ip_address: string | null
  user_agent: string | null
  result: 'success' | 'failure' | 'warning'
  before_value: Record<string, unknown> | null
  after_value: Record<string, unknown> | null
  created_at: string
}

interface PagedResult {
  data: AuditEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface SecurityAlert {
  rule_key: string
  label: string
  description: string
  user_email: string | null
  user_name: string | null
  count: number
  threshold: number
  window_minutes: number
  first_event: string
  last_event: string
  severity: 'warning' | 'critical'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function resultBadge(result: string) {
  if (result === 'success') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  if (result === 'failure') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
}

function moduleBadgeColor(mod: string) {
  const map: Record<string, string> = {
    auth: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    crm: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    finance: 'bg-emerald-100 text-emerald-700',
    hr: 'bg-amber-100 text-amber-700',
    bookings: 'bg-cyan-100 text-cyan-700',
    settings: 'bg-orange-100 text-orange-700',
    integrations: 'bg-pink-100 text-pink-700',
    communication: 'bg-indigo-100 text-indigo-700',
    system: 'bg-slate-100 text-slate-700',
  }
  return map[mod] || 'bg-gray-100 text-gray-700'
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const [data, setData]               = useState<AuditEntry[]>([])
  const [total, setTotal]             = useState(0)
  const [page, setPage]               = useState(1)
  const [totalPages, setTotalPages]   = useState(1)
  const [loading, setLoading]         = useState(true)
  const [sort, setSort]               = useState<'asc' | 'desc'>('desc')
  const [selectedEntry, setSelected]  = useState<AuditEntry | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [archiving, setArchiving]     = useState(false)
  const [archiveResult, setArchiveResult] = useState<string | null>(null)

  // Filters
  const [search, setSearch]         = useState('')
  const [module, setModule]         = useState('')
  const [action, setAction]         = useState('')
  const [result, setResult]         = useState('')
  const [department, setDepartment] = useState('')
  const [dateFrom, setDateFrom]     = useState('')
  const [dateTo, setDateTo]         = useState('')

  // Filter options
  const [modules, setModules]         = useState<string[]>([])
  const [actions, setActions]         = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])

  // Security alerts
  const [alerts, setAlerts]           = useState<SecurityAlert[]>([])
  const [alertsLoading, setAlertsLoading] = useState(false)
  const [showAlerts, setShowAlerts]   = useState(true)

  const PAGE_SIZE = 25

  // ── Fetch audit logs ────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async (pg = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pg),
        pageSize: String(PAGE_SIZE),
        sort,
        ...(search && { search }),
        ...(module && { module }),
        ...(action && { action }),
        ...(result && { result }),
        ...(department && { department }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      })
      const res = await fetch(`/api/audit?${params}`)
      if (!res.ok) throw new Error('Unauthorized')
      const json: PagedResult = await res.json()
      setData(json.data)
      setTotal(json.total)
      setTotalPages(json.totalPages)
      setPage(json.page)
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [search, module, action, result, department, dateFrom, dateTo, sort])

  // ── Fetch filter options ────────────────────────────────────────────────────
  const fetchOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/audit?options=true')
      if (!res.ok) return
      const json = await res.json()
      setModules(json.modules ?? [])
      setActions(json.actions ?? [])
      setDepartments(json.departments ?? [])
    } catch {}
  }, [])

  // ── Fetch security alerts ───────────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true)
    try {
      const res = await fetch('/api/audit?alerts=true')
      if (!res.ok) return
      const json: SecurityAlert[] = await res.json()
      setAlerts(json)
    } catch {
      setAlerts([])
    } finally {
      setAlertsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs(1)
    fetchOptions()
    fetchAlerts()
  }, [fetchLogs, fetchOptions, fetchAlerts])

  const clearFilters = () => {
    setSearch(''); setModule(''); setAction(''); setResult('')
    setDepartment(''); setDateFrom(''); setDateTo('')
  }

  const hasFilters = !!(search || module || action || result || department || dateFrom || dateTo)

  const handleArchive = async () => {
    if (!confirm('Archive all audit log entries older than the configured retention period? This cannot be undone from the UI.')) return
    setArchiving(true)
    try {
      const res = await fetch('/api/audit/archive', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setArchiveResult(`✓ Archived ${json.archived} entries successfully.`)
        fetchLogs(1)
      } else {
        setArchiveResult(`✗ Archive failed: ${json.error}`)
      }
    } catch (e: any) {
      setArchiveResult(`✗ Error: ${e.message}`)
    } finally {
      setArchiving(false)
      setTimeout(() => setArchiveResult(null), 6000)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1400px] mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Shield size={22} className="text-omnia-gold" />
            Audit Log
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete security and activity history — {total.toLocaleString()} events
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSort(s => s === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowUpDown size={14} />
            {sort === 'desc' ? 'Newest first' : 'Oldest first'}
          </button>
          <button
            onClick={() => fetchLogs(page)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleArchive}
            disabled={archiving}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Archive size={14} />
            {archiving ? 'Archiving...' : 'Archive Old'}
          </button>
        </div>
      </div>

      {archiveResult && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${archiveResult.startsWith('✓') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {archiveResult}
        </div>
      )}

      {/* ── Security Alerts Panel ──────────────────────────────────────────── */}
      {(alerts.length > 0 || alertsLoading) && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
            onClick={() => setShowAlerts(v => !v)}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <span className="font-semibold text-foreground text-sm">
                Security Alerts
                {alerts.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {alerts.length}
                  </span>
                )}
              </span>
              <span className="text-muted-foreground text-xs">Deterministic rule-based detection</span>
            </div>
            <ChevronDown size={16} className={`text-muted-foreground transition-transform ${showAlerts ? 'rotate-180' : ''}`} />
          </button>

          {showAlerts && (
            <div className="divide-y divide-border px-5 pb-4">
              {alertsLoading ? (
                <p className="py-4 text-sm text-muted-foreground">Analysing activity patterns…</p>
              ) : alerts.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">No suspicious patterns detected.</p>
              ) : (
                alerts.map((alert, i) => (
                  <div key={i} className={`py-4 flex items-start gap-3 ${alert.severity === 'critical' ? 'opacity-100' : ''}`}>
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${alert.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm">{alert.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${alert.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">{alert.rule_key}</code>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                      {alert.user_email && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Account: <span className="font-medium text-foreground">{alert.user_email}</span>
                          {alert.user_name && ` (${alert.user_name})`}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(alert.first_event)} → {formatDateTime(alert.last_event)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchLogs(1)}
              placeholder="Search description, user, entity…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-omnia-gold focus:ring-1 focus:ring-omnia-gold/30"
            />
          </div>
          {/* Date From */}
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-omnia-gold"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-omnia-gold"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Module */}
          <select
            value={module}
            onChange={e => setModule(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-omnia-gold min-w-[130px]"
          >
            <option value="">All Modules</option>
            {modules.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {/* Action */}
          <select
            value={action}
            onChange={e => setAction(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-omnia-gold min-w-[160px]"
          >
            <option value="">All Actions</option>
            {actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          {/* Department */}
          <select
            value={department}
            onChange={e => setDepartment(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-omnia-gold min-w-[140px]"
          >
            <option value="">All Departments</option>
            {departments.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Result */}
          <select
            value={result}
            onChange={e => setResult(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-omnia-gold min-w-[120px]"
          >
            <option value="">All Results</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="warning">Warning</option>
          </select>

          <button
            onClick={() => fetchLogs(1)}
            className="px-4 py-2 text-sm bg-omnia-gold text-white rounded-lg hover:bg-omnia-gold-dark transition-colors font-medium"
          >
            Apply
          </button>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3">
            <RefreshCw size={18} className="animate-spin text-muted-foreground" />
            <span className="text-muted-foreground text-sm">Loading audit log…</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <FileText size={36} className="text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No audit events found</p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-omnia-gold hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Module</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Result</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((entry) => (
                  <tr
                    key={entry.id}
                    className={`hover:bg-muted/30 transition-colors ${entry.result === 'failure' ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-foreground text-xs font-medium">{formatDateTime(entry.created_at)}</div>
                      <div className="text-muted-foreground text-xs">{timeAgo(entry.created_at)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-foreground text-xs font-medium truncate max-w-[140px]">
                        {entry.user_name || '—'}
                      </div>
                      <div className="text-muted-foreground text-xs truncate max-w-[140px]">
                        {entry.user_email || ''}
                      </div>
                      {entry.department && (
                        <div className="text-xs text-muted-foreground/70">{entry.department}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${moduleBadgeColor(entry.module)}`}>
                        {entry.module}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                        {entry.action}
                      </code>
                    </td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <p className="text-xs text-foreground truncate" title={entry.description ?? ''}>
                        {entry.description || '—'}
                      </p>
                      {entry.entity_type && (
                        <p className="text-xs text-muted-foreground">
                          {entry.entity_type}{entry.entity_id ? ` · ${entry.entity_id.substring(0, 8)}…` : ''}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${resultBadge(entry.result)}`}>
                        {entry.result}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelected(entry)}
                        className="p-1.5 text-muted-foreground hover:text-omnia-gold hover:bg-omnia-gold/10 rounded-lg transition-colors"
                        title="View detail"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()} events
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => fetchLogs(page - 1)}
              className="p-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
              return (
                <button
                  key={pg}
                  onClick={() => fetchLogs(pg)}
                  className={`w-8 h-8 text-sm rounded-lg border transition-colors ${
                    pg === page
                      ? 'bg-omnia-gold text-white border-omnia-gold font-semibold'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {pg}
                </button>
              )
            })}
            <button
              disabled={page === totalPages}
              onClick={() => fetchLogs(page + 1)}
              className="p-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Detail Panel ───────────────────────────────────────────────────── */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="w-full max-w-xl bg-card border-l border-border overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h2 className="font-semibold text-foreground">Event Detail</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 p-6 space-y-5 overflow-y-auto">
              {/* Result badge */}
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${resultBadge(selectedEntry.result)}`}>
                  {selectedEntry.result.toUpperCase()}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${moduleBadgeColor(selectedEntry.module)}`}>
                  {selectedEntry.module}
                </span>
              </div>

              {/* Action & Description */}
              <div>
                <code className="text-sm font-mono text-omnia-gold bg-omnia-gold/10 px-2 py-1 rounded">
                  {selectedEntry.action}
                </code>
                {selectedEntry.description && (
                  <p className="text-foreground text-sm mt-2 leading-relaxed">{selectedEntry.description}</p>
                )}
              </div>

              <hr className="border-border" />

              {/* User info */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User size={12} /> Actor
                </h3>
                <DetailRow label="Name"       value={selectedEntry.user_name} />
                <DetailRow label="Email"      value={selectedEntry.user_email} />
                <DetailRow label="Department" value={selectedEntry.department} />
                <DetailRow label="Role"       value={selectedEntry.role} />
                <DetailRow label="User ID"    value={selectedEntry.user_id} mono />
              </div>

              <hr className="border-border" />

              {/* Event metadata */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={12} /> Event Metadata
                </h3>
                <DetailRow label="Timestamp"  value={formatDateTime(selectedEntry.created_at)} />
                <DetailRow label="Page"       value={selectedEntry.page} />
                <DetailRow label="Entity"     value={selectedEntry.entity_type} />
                <DetailRow label="Entity ID"  value={selectedEntry.entity_id} mono />
                <DetailRow label="Event ID"   value={selectedEntry.id} mono />
              </div>

              <hr className="border-border" />

              {/* Device / Network */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Globe size={12} /> Network & Device
                </h3>
                <DetailRow label="IP Address" value={selectedEntry.ip_address} />
                <DetailRow label="User Agent" value={selectedEntry.user_agent} truncate />
              </div>

              {/* Before / After values */}
              {(selectedEntry.before_value || selectedEntry.after_value) && (
                <>
                  <hr className="border-border" />
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Change Detail
                    </h3>
                    {selectedEntry.before_value && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Before</p>
                        <pre className="text-xs bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap text-foreground">
                          {JSON.stringify(selectedEntry.before_value, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedEntry.after_value && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">After</p>
                        <pre className="text-xs bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap text-foreground">
                          {JSON.stringify(selectedEntry.after_value, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Detail Row helper ────────────────────────────────────────────────────────

function DetailRow({ label, value, mono, truncate }: {
  label: string
  value: string | null | undefined
  mono?: boolean
  truncate?: boolean
}) {
  if (!value) return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-muted-foreground text-xs">—</span>
    </div>
  )
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground text-xs flex-shrink-0">{label}</span>
      <span className={`text-xs text-foreground text-right ${mono ? 'font-mono' : ''} ${truncate ? 'truncate max-w-[260px]' : ''}`}
        title={value}>
        {value}
      </span>
    </div>
  )
}
