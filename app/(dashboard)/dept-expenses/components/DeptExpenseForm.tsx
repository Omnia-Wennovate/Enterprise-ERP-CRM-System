'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Upload, AlertTriangle, CheckCircle, Loader2, Info,
  DollarSign, Sparkles, Package, TrendingUp
} from 'lucide-react'
import type { ExpenseCategoryConfig } from '@/types/finance'
import {
  submitDeptExpenseAction,
  uploadExpenseAttachmentAction,
  findDuplicateAttachmentAction,
  checkPolicyComplianceAction,
  suggestExpenseCategoryAction,
  fetchExpenseCategories,
  getDeptBudgetIndicatorAction,
} from '@/app/actions/finance'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'ETB', 'TRY', 'EGP']

interface FileItem {
  id: string
  file: File
  preview?: string
  uploading?: boolean
}

interface DeptExpenseFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newExpenseId: string) => void
  department: string
  employeeId?: string
  employeeName?: string
}

export function DeptExpenseForm({ isOpen, onClose, onSuccess, department, employeeId, employeeName }: DeptExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<ExpenseCategoryConfig[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [duplicateWarning, setDuplicateWarning] = useState<{ expense_number: string | null; expense_date: string } | null>(null)
  const [policyWarning, setPolicyWarning] = useState<string | null>(null)
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null)
  const [budgetIndicator, setBudgetIndicator] = useState<{ budget: number; spent: number; percent: number; has_budget: boolean } | null>(null)
  const [budgetLoading, setBudgetLoading] = useState(false)
  const [isBundled, setIsBundled] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: '',
    currency: 'USD',
    notes: '',
    trip_reference: '',
  })

  useEffect(() => {
    if (!isOpen) return
    setFiles([])
    setDuplicateWarning(null)
    setPolicyWarning(null)
    setSuggestedCategory(null)
    setBudgetIndicator(null)
    setIsBundled(false)
    setForm({
      expense_date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      amount: '',
      currency: 'USD',
      notes: '',
      trip_reference: '',
    })
    fetchExpenseCategories().then(setCategories).catch(console.error)
  }, [isOpen])

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }))

  const checkPolicy = useCallback(async (amount: string, category: string) => {
    if (!amount || !category) { setPolicyWarning(null); return }
    const n = parseFloat(amount)
    if (isNaN(n)) return
    try {
      const result = await checkPolicyComplianceAction(n, category)
      setPolicyWarning(result.exceeded ? result.message : null)
    } catch { /* non-fatal */ }
  }, [])

  const fetchBudgetIndicator = useCallback(async (dept: string, category: string) => {
    if (!dept || !category) return
    setBudgetLoading(true)
    try {
      const result = await getDeptBudgetIndicatorAction(dept, category)
      setBudgetIndicator(result)
    } catch { /* non-fatal */ }
    finally { setBudgetLoading(false) }
  }, [])

  const handleCategoryChange = (category: string) => {
    set('category', category)
    checkPolicy(form.amount, category)
    fetchBudgetIndicator(department, category)
  }

  const handleAmountChange = (amount: string) => {
    set('amount', amount)
    checkPolicy(amount, form.category)
  }

  const handleDescriptionBlur = useCallback(async () => {
    if (!form.description || form.category) return
    try {
      const suggested = await suggestExpenseCategoryAction(form.description)
      if (suggested) setSuggestedCategory(suggested)
    } catch { /* non-fatal */ }
  }, [form.description, form.category])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (!selected.length) return

    // Validate file type and size
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    const valid = selected.filter((f) => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_SIZE)
    const invalid = selected.filter((f) => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_SIZE)
    if (invalid.length > 0) {
      alert(`${invalid.length} file(s) skipped: only images/PDF up to 10MB are allowed.`)
    }

    const newFiles: FileItem[] = valid.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }))
    setFiles((prev) => [...prev, ...newFiles])

    // Duplicate detection
    const firstFile = valid[0]
    if (firstFile) {
      try {
        const dup = await findDuplicateAttachmentAction(firstFile.name, firstFile.size)
        if (dup) setDuplicateWarning(dup)
      } catch { /* non-fatal */ }
    }

    e.target.value = ''
  }

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id))

  const handleSubmit = async () => {
    if (!form.description || !form.amount || !form.category || !form.expense_date) {
      alert('Please fill in Date, Category, Description, and Amount.')
      return
    }
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.')
      return
    }

    setLoading(true)
    try {
      const expense = await submitDeptExpenseAction({
        expense_date: form.expense_date,
        category: form.category,
        description: form.description,
        amount,
        currency: form.currency,
        notes: form.notes || undefined,
        department,
        employee_id: employeeId || undefined,
        status: 'unpaid',
        approval_status: 'pending',
        policy_exceeded: !!policyWarning,
        submission_source: 'department',
        trip_reference: isBundled && form.trip_reference ? form.trip_reference : undefined,
      } as any)

      // Upload files
      const uploadPromises = files.map((f, i) => {
        return new Promise<void>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = async (ev) => {
            try {
              const base64 = (ev.target?.result as string).split(',')[1]
              await uploadExpenseAttachmentAction(expense.id, {
                name: f.file.name,
                type: f.file.type,
                size: f.file.size,
                base64,
              }, i)
              resolve()
            } catch (e) {
              console.warn('Upload failed for', f.file.name, e)
              resolve() // Resolve anyway so one failure doesn't block completion
            }
          }
          reader.onerror = () => resolve()
          reader.readAsDataURL(f.file)
        })
      })

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises)
      }

      onSuccess(expense.id)
      onClose()
    } catch (err) {
      alert(`Failed to submit expense: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const budgetColor = budgetIndicator?.percent
    ? budgetIndicator.percent >= 100 ? 'bg-red-500'
      : budgetIndicator.percent >= 90 ? 'bg-amber-500'
      : budgetIndicator.percent >= 75 ? 'bg-amber-400'
      : 'bg-emerald-500'
    : 'bg-omnia-gold'

  const willExceedBudget = budgetIndicator?.has_budget &&
    budgetIndicator.budget > 0 &&
    (budgetIndicator.spent + (parseFloat(form.amount) || 0)) > budgetIndicator.budget

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2 }}
        className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-[#0d3553] to-[#0d4568] rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-white">Submit Expense</h2>
            <p className="text-white/60 text-xs mt-0.5">
              {employeeName && <span>{employeeName} · </span>}
              <span className="text-[#E2CC7E]">{department}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Row 1: Date + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Expense Date *
              </label>
              <input
                type="date"
                value={form.expense_date}
                onChange={(e) => set('expense_date', e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-omnia-gold/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-omnia-gold/50 outline-none"
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              {suggestedCategory && !form.category && (
                <button
                  onClick={() => { handleCategoryChange(suggestedCategory); setSuggestedCategory(null) }}
                  className="text-xs text-omnia-gold mt-1 flex items-center gap-1 hover:underline"
                >
                  <Sparkles size={10} /> Use suggested: {suggestedCategory}
                </button>
              )}
            </div>
          </div>

          {/* Budget indicator */}
          {budgetLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={12} className="animate-spin" /> Checking budget...
            </div>
          )}
          {budgetIndicator?.has_budget && !budgetLoading && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground flex items-center gap-1">
                  <TrendingUp size={11} /> {department} — {form.category || 'Dept'} budget this month
                </span>
                <span className={`font-bold ${budgetIndicator.percent >= 100 ? 'text-red-600' : budgetIndicator.percent >= 90 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {budgetIndicator.percent.toFixed(0)}% used
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${budgetColor}`}
                  style={{ width: `${Math.min(budgetIndicator.percent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(budgetIndicator.spent)} spent of{' '}
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(budgetIndicator.budget)} budget
              </p>
              {willExceedBudget && (
                <p className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <AlertTriangle size={11} /> This submission would exceed the department budget
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
              What was this expense used for? *
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="e.g. Client lunch at The Grand, taxi to airport..."
              className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-omnia-gold/50 outline-none"
            />
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Amount *
              </label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-omnia-gold/50 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-omnia-gold/50 outline-none"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Policy warning */}
          {policyWarning && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
              <p>{policyWarning}</p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
              Additional Notes <span className="text-muted-foreground/60 normal-case">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder="Any additional context for Finance..."
              className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-omnia-gold/50 outline-none resize-none"
            />
          </div>

          {/* Trip bundle */}
          <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="bundle-toggle"
                checked={isBundled}
                onChange={(e) => setIsBundled(e.target.checked)}
                className="w-4 h-4 accent-omnia-gold rounded"
              />
              <label htmlFor="bundle-toggle" className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-1.5">
                <Package size={14} className="text-omnia-gold" />
                Part of a trip or project bundle?
              </label>
            </div>
            <AnimatePresence>
              {isBundled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <input
                    type="text"
                    value={form.trip_reference}
                    onChange={(e) => set('trip_reference', e.target.value)}
                    placeholder="e.g. Dubai Sales Trip — Oct 2026"
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-omnia-gold/50 outline-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <Info size={10} /> Finance will see all expenses with this label grouped together
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Document upload */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
              Supporting Document <span className="text-muted-foreground/60 normal-case">(receipt, invoice, etc.)</span>
            </label>

            {/* Duplicate warning */}
            {duplicateWarning && (
              <div className="flex items-start gap-2 p-3 mb-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-700 text-sm">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs">Possible Duplicate Receipt</p>
                  <p className="text-xs mt-0.5">Similar to expense <strong>{duplicateWarning.expense_number ?? 'unknown'}</strong> from {new Date(duplicateWarning.expense_date).toLocaleDateString()}. Please verify this is not a duplicate.</p>
                </div>
                <button onClick={() => setDuplicateWarning(null)} className="ml-auto"><X size={12} /></button>
              </div>
            )}

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-omnia-gold/50 hover:bg-omnia-gold/5 transition-all"
            >
              <Upload size={28} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">Click to upload receipt/invoice</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF, WebP — up to 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.heic,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                    {f.preview
                      ? <img src={f.preview} alt="" className="w-10 h-10 rounded object-cover border border-border flex-shrink-0" />
                      : <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">📄</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{f.file.name}</p>
                      <p className="text-xs text-muted-foreground">{(f.file.size / 1024).toFixed(0)} KB · {f.file.type}</p>
                    </div>
                    <button onClick={() => removeFile(f.id)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review summary */}
          <div className="bg-muted/20 rounded-xl p-4 border border-border space-y-2 text-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
              <Info size={12} /> Submission Summary
            </p>
            {[
              ['Department', department],
              ['Category', form.category || '—'],
              ['Amount', form.amount ? `${form.amount} ${form.currency}` : '—'],
              ['Date', form.expense_date],
              ['Documents', `${files.length} file(s)`],
              ...(isBundled && form.trip_reference ? [['Trip Bundle', form.trip_reference]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border/50 py-1 last:border-0">
                <span className="text-xs text-muted-foreground">{k}</span>
                <span className="text-xs font-semibold text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/10 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.description || !form.amount || !form.category}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#E2CC7E] hover:bg-[#c9b55a] text-[#0d3553] rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
            id="dept-submit-expense-btn"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Submitting...' : 'Submit to Finance'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
