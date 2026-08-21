'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, ChevronRight, Calendar, Users, MapPin, Search,
  Filter, RefreshCw, TrendingUp, DollarSign, Clock, CheckCircle2,
  Loader2,
} from 'lucide-react'
import { getQuotations } from '@/lib/services/quotations'
import type { QuotationWithItems } from '@/types/quotation'
import { QUOTATION_STATUS_COLORS, QUOTATION_STATUS_LABELS } from '@/types/quotation'
import { QuotationDetailPanel } from './QuotationDetailPanel'
import { EditQuotationModal } from './EditQuotationModal'

// ============================================================================
// STAT CARD
// ============================================================================
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon className="w-4 h-4 text-primary-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-bold text-foreground">{value}</p>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface QuotationsListProps {
  /** Called by parent to signal a refresh from outside (e.g. after New Quote) */
  refreshKey?: number
}

export function QuotationsList({ refreshKey }: QuotationsListProps) {
  const [quotations, setQuotations]         = useState<QuotationWithItems[]>([])
  const [filtered, setFiltered]             = useState<QuotationWithItems[]>([])
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationWithItems | null>(null)
  const [editingQuotation, setEditingQuotation]   = useState<QuotationWithItems | null>(null)
  const [isLoading, setIsLoading]           = useState(true)
  const [isRefreshing, setIsRefreshing]     = useState(false)
  const [search, setSearch]                 = useState('')
  const [statusFilter, setStatusFilter]     = useState<string>('all')

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true)
    else setIsRefreshing(true)
    try {
      const data = await getQuotations()
      setQuotations(data)
    } catch (err) {
      console.error('Failed to load quotations:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Reload when parent increments refreshKey (e.g. after New Quote saved)
  useEffect(() => {
    if (refreshKey && refreshKey > 0) load(true)
  }, [refreshKey, load])

  // Filter logic
  useEffect(() => {
    let list = [...quotations]
    if (statusFilter !== 'all') list = list.filter((q) => q.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (qt) =>
          qt.customer_name.toLowerCase().includes(q) ||
          qt.quote_number.toLowerCase().includes(q) ||
          qt.destination.toLowerCase().includes(q) ||
          qt.quote_title.toLowerCase().includes(q)
      )
    }
    setFiltered(list)
  }, [quotations, search, statusFilter])

  // Keep selected quotation in sync after refresh
  useEffect(() => {
    if (selectedQuotation) {
      const updated = quotations.find((q) => q.id === selectedQuotation.id)
      if (updated) setSelectedQuotation(updated)
      else setSelectedQuotation(null)
    }
  }, [quotations])

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount)

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  // Stats
  const totalValue  = quotations.reduce((s, q) => s + q.grand_total, 0)
  const accepted    = quotations.filter((q) => q.status === 'accepted').length
  const pending     = quotations.filter((q) => ['sent', 'viewed', 'negotiation'].includes(q.status)).length
  const drafts      = quotations.filter((q) => q.status === 'draft').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-omnia-gold mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading quotations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-0 h-full">
      {/* ── LEFT: LIST ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Stats */}
        <div className="px-6 pt-5 pb-4 grid grid-cols-4 gap-3 flex-shrink-0">
          <StatCard label="Total Value"   value={formatCurrency(totalValue, 'USD')} icon={DollarSign}    color="bg-omnia-gold/100" />
          <StatCard label="Accepted"      value={accepted}                          icon={CheckCircle2}   color="bg-green-500" />
          <StatCard label="In Progress"   value={pending}                           icon={TrendingUp}     color="bg-omnia-gold/50" />
          <StatCard label="Drafts"        value={drafts}                            icon={Clock}          color="bg-gray-400" />
        </div>

        {/* Search & Filter */}
        <div className="px-6 pb-4 flex items-center gap-3 flex-shrink-0">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, quote number, destination..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-xl outline-none focus:border-omnia-gold/60 focus:ring-2 focus:ring-teal-400/20 placeholder:text-gray-300"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-xl outline-none focus:border-omnia-gold/60 appearance-none cursor-pointer">
              <option value="all">All Status</option>
              {Object.entries(QUOTATION_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => load(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-omnia-gold hover:border-omnia-gold/40 transition-colors">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">No quotations found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Click "New Quote" to create your first quotation'}
                </p>
              </motion.div>
            ) : (
              filtered.map((quote, idx) => {
                const statusCfg = QUOTATION_STATUS_COLORS[quote.status]
                const isSelected = selectedQuotation?.id === quote.id
                const travelers = quote.adults + quote.children + quote.infants

                return (
                  <motion.div
                    key={quote.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => setSelectedQuotation(isSelected ? null : quote)}
                    className={`bg-card border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'border-omnia-gold/60 shadow-md bg-omnia-gold/10/30' : 'border-border hover:border-omnia-gold/20'
                    }`}>
                    {/* Top Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-3.5 h-3.5 text-omnia-gold flex-shrink-0" />
                          <span className="text-xs font-bold font-mono text-omnia-gold">{quote.quote_number}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                            {QUOTATION_STATUS_LABELS[quote.status]}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-foreground truncate">{quote.quote_title}</h3>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{quote.customer_name}{quote.company ? ` · ${quote.company}` : ''}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground flex-shrink-0 ml-2 transition-transform ${isSelected ? 'rotate-90 text-omnia-gold' : ''}`} />
                    </div>

                    {/* Info Row */}
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{quote.destination}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span>{formatDate(quote.departure_date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span>{travelers} traveler{travelers !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-omnia-gold-dark">
                          {formatCurrency(quote.grand_total, quote.currency)}
                        </span>
                        <span className="text-xs text-muted-foreground">{quote.currency} · {quote.items.length} item{quote.items.length !== 1 ? 's' : ''}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Valid to {formatDate(quote.valid_until)}</span>
                    </div>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── RIGHT: DETAIL PANEL ── */}
      <AnimatePresence>
        {selectedQuotation && (
          <QuotationDetailPanel
            key={selectedQuotation.id}
            quotation={selectedQuotation}
            onClose={() => setSelectedQuotation(null)}
            onEdit={(q) => setEditingQuotation(q)}
            onRefresh={() => load(true)}
          />
        )}
      </AnimatePresence>

      {/* ── EDIT MODAL ── */}
      {editingQuotation && (
        <EditQuotationModal
          quotation={editingQuotation}
          isOpen={!!editingQuotation}
          onClose={() => setEditingQuotation(null)}
          onSuccess={() => {
            setEditingQuotation(null)
            load(true)
          }}
        />
      )}
    </div>
  )
}
