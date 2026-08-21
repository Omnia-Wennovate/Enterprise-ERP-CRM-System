'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Loader2, AlertTriangle, Tag } from 'lucide-react'
import type { ExpenseCategoryConfig } from '@/types/finance'
import { createExpenseCategoryAction, updateExpenseCategoryAction, deleteExpenseCategoryAction } from '@/app/actions/finance'

const fmt = (n?: number | null) => n != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n) : '—'

interface CategoryManagementProps {
  categories: ExpenseCategoryConfig[]
  onRefresh: () => void
}

interface CatForm {
  name: string
  monthly_limit: string
  per_transaction_limit: string
  daily_per_person_limit: string
}

const EMPTY: CatForm = { name: '', monthly_limit: '', per_transaction_limit: '', daily_per_person_limit: '' }

export function CategoryManagement({ categories, onRefresh }: CategoryManagementProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ExpenseCategoryConfig | null>(null)
  const [form, setForm] = useState<CatForm>(EMPTY)
  const [loading, setLoading] = useState(false)

  const openNew = () => { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (c: ExpenseCategoryConfig) => {
    setEditing(c)
    setForm({
      name: c.name,
      monthly_limit: c.monthly_limit?.toString() ?? '',
      per_transaction_limit: c.per_transaction_limit?.toString() ?? '',
      daily_per_person_limit: c.daily_per_person_limit?.toString() ?? '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const ml = parseFloat(form.monthly_limit) || undefined
      const ptl = parseFloat(form.per_transaction_limit) || undefined
      const dppl = parseFloat(form.daily_per_person_limit) || undefined
      if (editing) {
        await updateExpenseCategoryAction(editing.id, { name: form.name, monthly_limit: ml, per_transaction_limit: ptl, daily_per_person_limit: dppl })
      } else {
        await createExpenseCategoryAction(form.name, ml, ptl, dppl)
      }
      setModalOpen(false)
      onRefresh()
    } catch (err) { alert(`Failed: ${err instanceof Error ? err.message : 'Error'}`) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this category?')) return
    try { await deleteExpenseCategoryAction(id); onRefresh() }
    catch (err) { alert(`Failed: ${err instanceof Error ? err.message : 'Error'}`) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{categories.filter(c=>c.is_active).length} active categories</p>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-omnia-gold hover:bg-omnia-gold-dark text-white rounded-lg text-sm font-semibold transition-colors" id="add-category-btn">
          <Plus size={16}/> Add Category
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              {['Category','Monthly Limit','Per Transaction','Daily/Person','Status','Actions'].map(h=>(
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map(cat => (
              <tr key={cat.id} className={`hover:bg-muted/20 transition-colors ${!cat.is_active ? 'opacity-50' : ''}`}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-omnia-gold/15 flex items-center justify-center text-omnia-gold-dark"><Tag size={12}/></div>
                    <span className="font-medium text-foreground">{cat.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{fmt(cat.monthly_limit)}</td>
                <td className="px-5 py-3 text-muted-foreground">{fmt(cat.per_transaction_limit)}</td>
                <td className="px-5 py-3 text-muted-foreground">{fmt(cat.daily_per_person_limit)}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={()=>openEdit(cat)} className="p-1.5 rounded hover:bg-omnia-gold/5 text-omnia-gold transition-colors"><Pencil size={13}/></button>
                    {cat.is_active && <button onClick={()=>handleDelete(cat.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={13}/></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <Tag size={32} className="mx-auto mb-2 opacity-30"/>
            <p>No categories found</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
              className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-foreground">{editing ? 'Edit Category' : 'Add Category'}</h3>
                <button onClick={()=>setModalOpen(false)} className="text-muted-foreground hover:text-foreground"><Plus size={16} className="rotate-45"/></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Category Name *</label>
                  <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-omnia-gold-500 outline-none" placeholder="e.g. Meals"/>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5"/>
                  <p className="text-xs text-amber-700">Limits enforce spending policy. Expenses over the limit are flagged for the approver, not blocked.</p>
                </div>
                {[['monthly_limit','Monthly Limit ($)'],['per_transaction_limit','Per Transaction Limit ($)'],['daily_per_person_limit','Daily Per Person Limit ($)']].map(([k,l])=>(
                  <div key={k}>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{l}</label>
                    <input type="number" step="0.01" value={form[k as keyof CatForm]??''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-omnia-gold-500 outline-none" placeholder="No limit"/>
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={()=>setModalOpen(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-omnia-gold hover:bg-omnia-gold-dark text-white rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading && <Loader2 size={14} className="animate-spin"/>}
                    {loading ? 'Saving...' : editing ? 'Update' : 'Add'}
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
