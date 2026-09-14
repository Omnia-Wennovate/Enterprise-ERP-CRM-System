'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Settings, Building2, Users, Plane, DollarSign, UserCog,
  MessageSquare, Shield, Cpu, Save, RotateCcw, Loader2,
  CheckCircle, AlertCircle, ChevronRight, Info
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SettingRow {
  id: string
  category: string
  key: string
  value: unknown
  label: string | null
  description: string | null
}

type Tab = 'general' | 'crm' | 'bookings' | 'finance' | 'hr' | 'communication' | 'security' | 'system'

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'general',       label: 'General',       icon: Building2 },
  { key: 'crm',           label: 'CRM',           icon: Users },
  { key: 'bookings',      label: 'Bookings',      icon: Plane },
  { key: 'finance',       label: 'Finance',       icon: DollarSign },
  { key: 'hr',            label: 'HR',            icon: UserCog },
  { key: 'communication', label: 'Communication', icon: MessageSquare },
  { key: 'security',      label: 'Security',      icon: Shield },
  { key: 'system',        label: 'System',        icon: Cpu },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseValue(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v.replace(/^"|"$/g, '')
  if (typeof v === 'boolean') return String(v)
  if (typeof v === 'number') return String(v)
  try { return JSON.stringify(v) } catch { return '' }
}

function encodeValue(raw: string, current: unknown): unknown {
  // Preserve the type of the original value
  if (typeof current === 'boolean') {
    return raw === 'true'
  }
  if (typeof current === 'number') {
    const n = Number(raw)
    return isNaN(n) ? current : n
  }
  // Default: store as JSON string (with quotes stripped for plain strings)
  return raw
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab]     = useState<Tab>('general')
  const [settings, setSettings]       = useState<SettingRow[]>([])
  const [localValues, setLocalValues] = useState<Record<string, string>>({})
  const [originalValues, setOriginal] = useState<Record<string, string>>({})
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [status, setStatus]           = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const hasUnsavedChanges = JSON.stringify(localValues) !== JSON.stringify(originalValues)

  // ── Load settings ──────────────────────────────────────────────────────────
  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to load settings')
      const rows: SettingRow[] = await res.json()
      setSettings(rows)
      const vals: Record<string, string> = {}
      for (const r of rows) {
        vals[`${r.category}.${r.key}`] = parseValue(r.value)
      }
      setLocalValues(vals)
      setOriginal(vals)
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message || 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    setStatus(null)
    try {
      const tabSettings = settings.filter(s => s.category === activeTab)
      const changed = tabSettings
        .filter(s => {
          const k = `${s.category}.${s.key}`
          return localValues[k] !== originalValues[k]
        })
        .map(s => {
          const k = `${s.category}.${s.key}`
          return {
            category: s.category,
            key: s.key,
            value: encodeValue(localValues[k], s.value),
          }
        })

      if (changed.length === 0) {
        setStatus({ type: 'success', message: 'No changes to save.' })
        setSaving(false)
        return
      }

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: changed }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Save failed')
      }

      // Update original to reflect saved state
      const newOriginal = { ...originalValues, ...localValues }
      setOriginal(newOriginal)
      setStatus({ type: 'success', message: `${changed.length} setting${changed.length > 1 ? 's' : ''} saved successfully.` })
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message || 'Save failed' })
    } finally {
      setSaving(false)
      setTimeout(() => setStatus(null), 5000)
    }
  }

  const handleReset = () => {
    setLocalValues({ ...originalValues })
    setStatus(null)
  }

  const updateValue = (key: string, val: string) => {
    setLocalValues(prev => ({ ...prev, [key]: val }))
  }

  // ── Tab-specific settings ─────────────────────────────────────────────────
  const tabSettings = settings.filter(s => s.category === activeTab)

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Settings size={22} className="text-omnia-gold" />
          System Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure system-wide behaviour. Changes are logged in the Audit Log.
        </p>
      </div>

      <div className="flex gap-6">

        {/* ── Sidebar tabs ──────────────────────────────────────────────────── */}
        <nav className="hidden lg:block w-52 flex-shrink-0">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left transition-colors border-b border-border last:border-b-0 ${
                    isActive
                      ? 'bg-omnia-gold/10 text-omnia-gold font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon size={15} className="flex-shrink-0" />
                  <span className="flex-1">{tab.label}</span>
                  {isActive && <ChevronRight size={13} />}
                </button>
              )
            })}
          </div>
        </nav>

        {/* ── Mobile tab bar ──────────────────────────────────────────────── */}
        <div className="lg:hidden w-full">
          <div className="flex overflow-x-auto gap-2 pb-2">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? 'bg-omnia-gold text-white'
                      : 'bg-card border border-border text-muted-foreground'
                  }`}
                >
                  <Icon size={13} /> {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Settings panel ────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Status banner */}
          {status && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
              status.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400'
                : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400'
            }`}>
              {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {status.message}
            </div>
          )}

          {/* Unsaved changes banner */}
          {hasUnsavedChanges && !status && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400">
              <Info size={16} /> You have unsaved changes.
            </div>
          )}

          {/* Settings card */}
          <div className="bg-card border border-border rounded-xl">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">
                {TABS.find(t => t.key === activeTab)?.label} Settings
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48 gap-3">
                <Loader2 size={18} className="animate-spin text-muted-foreground" />
                <span className="text-muted-foreground text-sm">Loading settings…</span>
              </div>
            ) : tabSettings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2">
                <Settings size={32} className="text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">No configurable settings in this category yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {tabSettings.map((setting) => {
                  const k = `${setting.category}.${setting.key}`
                  const rawValue = typeof setting.value === 'boolean'
                    ? String(setting.value)
                    : parseValue(setting.value)

                  const currentLocalVal = localValues[k] ?? parseValue(setting.value)
                  const isBoolean = typeof setting.value === 'boolean' || rawValue === 'true' || rawValue === 'false'
                  const isNumber = typeof setting.value === 'number'
                  const isChanged = currentLocalVal !== originalValues[k]

                  return (
                    <div key={k} className={`px-6 py-5 ${isChanged ? 'bg-omnia-gold/5' : ''}`}>
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <label htmlFor={k} className="font-medium text-foreground text-sm">
                              {setting.label || setting.key}
                            </label>
                            {isChanged && (
                              <span className="text-xs bg-omnia-gold/20 text-omnia-gold-dark px-1.5 py-0.5 rounded font-medium">
                                Modified
                              </span>
                            )}
                          </div>
                          {setting.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
                          )}
                          <code className="text-xs text-muted-foreground/60 font-mono mt-0.5 block">
                            {setting.category}.{setting.key}
                          </code>
                        </div>
                        <div className="flex-shrink-0 w-64">
                          {isBoolean ? (
                            <button
                              id={k}
                              onClick={() => updateValue(k, currentLocalVal === 'true' ? 'false' : 'true')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                currentLocalVal === 'true'
                                  ? 'bg-omnia-gold'
                                  : 'bg-border'
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                currentLocalVal === 'true' ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                          ) : isNumber ? (
                            <input
                              id={k}
                              type="number"
                              value={currentLocalVal}
                              onChange={e => updateValue(k, e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-omnia-gold focus:ring-1 focus:ring-omnia-gold/30"
                            />
                          ) : (
                            <input
                              id={k}
                              type="text"
                              value={currentLocalVal}
                              onChange={e => updateValue(k, e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-omnia-gold focus:ring-1 focus:ring-omnia-gold/30"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={handleReset}
              disabled={!hasUnsavedChanges || saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw size={14} /> Discard Changes
            </button>
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || saving}
              className="flex items-center gap-1.5 px-5 py-2 text-sm bg-omnia-gold hover:bg-omnia-gold-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <><Loader2 size={14} className="animate-spin" /> Saving…</>
              ) : (
                <><Save size={14} /> Save Changes</>
              )}
            </button>
          </div>

          {/* Security category note */}
          {activeTab === 'security' && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-sm text-amber-700 dark:text-amber-400">
              <Shield size={16} className="flex-shrink-0 mt-0.5" />
              <p>Security setting changes are logged in the Audit Log and a notification is sent to the Super Admin immediately.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
