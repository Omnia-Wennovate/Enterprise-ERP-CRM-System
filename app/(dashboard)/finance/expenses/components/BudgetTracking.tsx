'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Loader2, AlertTriangle, Target } from 'lucide-react'
import type { ExpenseBudget } from '@/types/finance'
import { createExpenseBudgetAction, updateExpenseBudgetAction, deleteExpenseBudgetAction } from '@/app/actions/finance'

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const DEPARTMENTS = ['Finance','Operations','HR','Sales','Marketing','IT','Admin','Management']
const CATEGORIES = ['Travel','Flights','Hotels','Visa','Transportation','Fuel','Meals','Office Supplies','Marketing','Utilities','Internet','Phone','Training','Software','Equipment','Maintenance','Miscellaneous']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function UtilizationBar({ pct }: { pct: number }) {
  const clamped = Math.min(pct, 100)
  const color = pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-orange-500' : pct >= 75 ? 'bg-amber-500' : 'bg-teal-500'
  return (
    <div className="w-full bg-muted rounded-full h-2 mt-2">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`h-2 rounded-full ${color}`}
      />
    </div>
  )
}

interface BudgetTrackingProps {
  budgets: ExpenseBudget[]
  onRefresh: () => void
}

export function BudgetTracking({ budgets, onRefresh }: BudgetTrackingProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string|null>(null)
  const [form, setForm] = useState({ department: '', category: '', period_month: new Date().getMonth()+1, period_year: new Date().getFullYear(), budget_amount: '' })
  const [loading, setLoading] = useState(false)

  const openNew = () => { setEditingId(null); setForm({ department:'', category:'', period_month: new Date().getMonth()+1, period_year: new Date().getFullYear(), budget_amount:'' }); setModalOpen(true) }
  const openEdit = (b: ExpenseBudget) => {
    setEditingId(b.id)
    setForm({ department: b.department??'', category: b.category??'', period_month: b.period_month, period_year: b.period_year, budget_amount: b.budget_amount.toString() })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingId) await updateExpenseBudgetAction(editingId, parseFloat(form.budget_amount))
      else await createExpenseBudgetAction({ department: form.department||undefined, category: form.category||undefined, period_month: form.period_month, period_year: form.period_year, budget_amount: parseFloat(form.budget_amount) })
      setModalOpen(false)
      onRefresh()
    } catch (err) { alert(`Failed: ${err instanceof Error ? err.message : 'Error'}`) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return
    try { await deleteExpenseBudgetAction(id); onRefresh() }
    catch (err) { alert(`Failed: ${err instanceof Error ? err.message : 'Error'}`) }
  }

  const warnings = budgets.filter(b => (b.utilization_percent ?? 0) >= 75)

  return (
    <div className="space-y-4">
      {/* Warning banners */}
      <AnimatePresence>
        {warnings.map(b => {
          const pct = b.utilization_percent ?? 0
          const severity = pct >= 100 ? 'red' : pct >= 90 ? 'orange' : 'amber'
          const sev = { red: 'bg-red-50 border-red-300 text-red-700', orange: 'bg-orange-50 border-orange-300 text-orange-700', amber: 'bg-amber-50 border-amber-300 text-amber-700' }
          return (
            <motion.div key={b.id} initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className={`flex items-center gap-3 p-3 rounded-lg border ${sev[severity]} text-sm font-medium`}>
              <AlertTriangle size={16} className="flex-shrink-0"/>
              <span>{b.department ?? 'General'} / {b.category ?? 'All'} budget is at <strong>{pct.toFixed(0)}%</strong> ({fmt(b.spent??0)} of {fmt(b.budget_amount)})</span>
            </motion.div>
          )
        })}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{budgets.length} budget{budgets.length !== 1 ? 's' : ''} configured</p>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors" id="add-budget-btn">
          <Plus size={16}/> Add Budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
          <Target size={40} className="mx-auto mb-3 opacity-30"/>
          <p className="font-medium">No budgets configured</p>
          <p className="text-sm mt-1">Add budget targets to track spending vs goals</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map(b => {
            const pct = b.utilization_percent ?? 0
            const barColor = pct >= 100 ? 'text-red-600' : pct >= 90 ? 'text-orange-600' : pct >= 75 ? 'text-amber-600' : 'text-teal-600'
            return (
              <motion.div key={b.id} layout className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{b.department ?? 'All Departments'}</p>
                    <p className="text-xs text-muted-foreground">{b.category ?? 'All Categories'} · {MONTHS[b.period_month-1]} {b.period_year}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={()=>openEdit(b)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Pencil size={12}/></button>
                    <button onClick={()=>handleDelete(b.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={12}/></button>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-semibold text-foreground">{fmt(b.budget_amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Spent</span>
                    <span className={`font-semibold ${barColor}`}>{fmt(b.spent ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className={`font-semibold ${(b.remaining ?? 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(b.remaining ?? 0)}</span>
                  </div>
                </div>

                <UtilizationBar pct={pct} />
                <div className="flex justify-between items-center mt-1.5">
                  <span className={`text-xs font-bold ${barColor}`}>{pct.toFixed(1)}% used</span>
                  {pct >= 100 && <span className="text-xs text-red-600 font-medium">⚠ Over budget</span>}
                  {pct >= 90 && pct < 100 && <span className="text-xs text-orange-600 font-medium">⚠ Near limit</span>}
                  {pct >= 75 && pct < 90 && <span className="text-xs text-amber-600 font-medium">⚠ 75% reached</span>}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
              className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-foreground">{editingId ? 'Edit Budget' : 'Add Budget'}</h3>
                <button onClick={()=>setModalOpen(false)} className="text-muted-foreground hover:text-foreground"><Plus size={16} className="rotate-45"/></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Department</label>
                    <select value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-teal-500" disabled={!!editingId}>
                      <option value="">All Departments</option>
                      {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Category</label>
                    <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-teal-500" disabled={!!editingId}>
                      <option value="">All Categories</option>
                      {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Month</label>
                    <select value={form.period_month} onChange={e=>setForm(f=>({...f,period_month:parseInt(e.target.value)}))} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-teal-500" disabled={!!editingId}>
                      {MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Year</label>
                    <input type="number" value={form.period_year} onChange={e=>setForm(f=>({...f,period_year:parseInt(e.target.value)}))} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-teal-500" disabled={!!editingId}/>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Budget Amount ($) *</label>
                  <input required type="number" step="0.01" value={form.budget_amount} onChange={e=>setForm(f=>({...f,budget_amount:e.target.value}))} placeholder="0.00" className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-teal-500"/>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={()=>setModalOpen(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading && <Loader2 size={14} className="animate-spin"/>}
                    {loading ? 'Saving...' : editingId ? 'Update' : 'Add Budget'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
