'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, AlertTriangle, CheckCircle, Loader2, Plus, Trash2, GripVertical, Info, DollarSign, Sparkles } from 'lucide-react'
import type { Vendor, ExpenseCategoryConfig } from '@/types/finance'
import {
  createExpenseAction,
  generateExpenseNumberAction,
  uploadExpenseAttachmentAction,
  findDuplicateAttachmentAction,
  extractReceiptDataAction,
  checkPolicyComplianceAction,
  suggestExpenseCategoryAction,
  fetchVendors,
  fetchExpenseCategories,
} from '@/app/actions/finance'

const CURRENCIES = ['USD','EUR','GBP','AED','SAR','ETB','TRY','EGP']
const PAYMENT_METHODS = ['cash','bank_transfer','card','mobile_money','check','online']
const DEPARTMENTS = ['Finance','Operations','HR','Sales','Marketing','IT','Admin','Management']

const EXCHANGE_RATES: Record<string,number> = {USD:1,EUR:0.92,GBP:0.79,AED:3.67,SAR:3.75,ETB:57.5,TRY:32,EGP:30.9}

interface FileItem {
  id: string
  file: File
  preview?: string
  pageOrder: number
  uploading?: boolean
  uploaded?: boolean
  uploadedId?: string
  uploadedUrl?: string
}

interface Split {
  id: string
  department: string
  project: string
  split_amount: string
  split_percent: string
}

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddExpenseModal({ isOpen, onClose, onSuccess }: AddExpenseModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [categories, setCategories] = useState<ExpenseCategoryConfig[]>([])
  const [expenseNumber, setExpenseNumber] = useState('')
  const [files, setFiles] = useState<FileItem[]>([])
  const [splits, setSplits] = useState<Split[]>([])
  const [ocrData, setOcrData] = useState<{vendor?:string;amount?:number;date?:string;tax?:number;currency?:string;confidence:number}|null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<{expense_number:string|null;expense_date:string}|null>(null)
  const [policyWarning, setPolicyWarning] = useState<string|null>(null)
  const [suggestedCategory, setSuggestedCategory] = useState<string|null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    vendor_id: '',
    department: '',
    project: '',
    category: '',
    booking_id: '',
    description: '',
    amount: '',
    tax: '',
    discount: '',
    currency: 'USD',
    exchange_rate: '1',
    original_currency: '',
    original_amount: '',
    payment_method: '',
    payment_reference: '',
    status: 'unpaid',
    approval_status: 'pending',
    notes: '',
  })

  useEffect(() => {
    if (!isOpen) return
    setStep(1)
    setFiles([])
    setSplits([])
    setOcrData(null)
    setDuplicateWarning(null)
    setPolicyWarning(null)
    setSuggestedCategory(null)
    setForm({
      expense_date: new Date().toISOString().split('T')[0],
      vendor_id: '', department: '', project: '', category: '', booking_id: '',
      description: '', amount: '', tax: '', discount: '', currency: 'USD',
      exchange_rate: '1', original_currency: '', original_amount: '',
      payment_method: '', payment_reference: '', status: 'unpaid',
      approval_status: 'pending', notes: '',
    })

    Promise.all([
      generateExpenseNumberAction().then(setExpenseNumber),
      fetchVendors().then(setVendors),
      fetchExpenseCategories().then(setCategories),
    ]).catch(console.error)
  }, [isOpen])

  const set = (key: string, value: string) => setForm(prev => ({...prev, [key]: value}))

  // Auto-convert currency
  const handleCurrencyChange = (currency: string) => {
    const rate = EXCHANGE_RATES[currency] ?? 1
    set('currency', currency)
    set('exchange_rate', String(rate))
    if (form.amount && currency !== 'USD') {
      const orig = parseFloat(form.amount)
      if (!isNaN(orig)) {
        set('original_currency', currency)
        set('original_amount', form.amount)
        const converted = orig / rate
        set('amount', converted.toFixed(2))
      }
    }
  }

  // Policy check on amount/category change
  const checkPolicy = useCallback(async (amount: string, category: string) => {
    if (!amount || !category) { setPolicyWarning(null); return }
    const n = parseFloat(amount)
    if (isNaN(n)) return
    try {
      const result = await checkPolicyComplianceAction(n, category)
      setPolicyWarning(result.exceeded ? result.message : null)
    } catch { /* non-fatal */ }
  }, [])

  // Category suggestion from description
  const handleDescriptionBlur = useCallback(async () => {
    if (!form.description || form.category) return
    try {
      const suggested = await suggestExpenseCategoryAction(form.description)
      if (suggested) setSuggestedCategory(suggested)
    } catch { /* non-fatal */ }
  }, [form.description, form.category])

  // File upload with OCR
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (!selected.length) return

    const newFiles: FileItem[] = selected.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      pageOrder: files.length + i,
    }))
    setFiles(prev => [...prev, ...newFiles])

    // Duplicate detection on first file
    const firstFile = selected[0]
    if (firstFile) {
      try {
        const dup = await findDuplicateAttachmentAction(firstFile.name, firstFile.size)
        if (dup) setDuplicateWarning(dup)
      } catch { /* non-fatal */ }
    }

    // OCR on first image
    const imageFile = selected.find(f => f.type.startsWith('image/') || f.type === 'application/pdf')
    if (imageFile && !ocrData) {
      setOcrLoading(true)
      try {
        const reader = new FileReader()
        reader.onload = async (ev) => {
          const base64 = (ev.target?.result as string).split(',')[1]
          const result = await extractReceiptDataAction(base64, imageFile.type)
          if (result.confidence >= 0.5) {
            setOcrData(result)
            // Pre-fill form fields but keep them editable
            if (result.amount && !form.amount) set('amount', String(result.amount))
            if (result.date && !form.expense_date) set('expense_date', result.date)
            if (result.tax && !form.tax) set('tax', String(result.tax))
            if (result.currency && result.currency !== 'USD') handleCurrencyChange(result.currency)
          }
          setOcrLoading(false)
        }
        reader.readAsDataURL(imageFile)
      } catch { setOcrLoading(false) }
    }

    e.target.value = ''
  }

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id))

  const addSplit = () => setSplits(prev => [...prev, { id: Date.now().toString(), department: '', project: '', split_amount: '', split_percent: '' }])
  const removeSplit = (id: string) => setSplits(prev => prev.filter(s => s.id !== id))
  const updateSplit = (id: string, key: keyof Split, value: string) =>
    setSplits(prev => prev.map(s => s.id === id ? {...s, [key]: value} : s))

  const totalSplit = splits.reduce((s, sp) => s + (parseFloat(sp.split_amount) || 0), 0)
  const mainAmount = parseFloat(form.amount) || 0
  const splitDiff = Math.abs(totalSplit - mainAmount)

  const handleSubmit = async () => {
    if (!form.description || !form.amount || !form.category) {
      alert('Please fill in Description, Amount, and Category.')
      return
    }
    setLoading(true)
    try {
      const expense = await createExpenseAction({
        expense_date: form.expense_date,
        vendor_id: form.vendor_id || undefined,
        department: form.department || undefined,
        project: form.project || undefined,
        category: form.category,
        booking_id: form.booking_id || undefined,
        description: form.description,
        amount: parseFloat(form.amount),
        tax: parseFloat(form.tax) || 0,
        discount: parseFloat(form.discount) || 0,
        currency: form.currency,
        exchange_rate: parseFloat(form.exchange_rate) || 1,
        original_currency: form.original_currency || undefined,
        original_amount: parseFloat(form.original_amount) || undefined,
        payment_method: form.payment_method as 'cash' | 'bank_transfer' | 'card' | 'mobile_money' | 'check' | 'online' || undefined,
        payment_reference: form.payment_reference || undefined,
        status: form.status as 'unpaid' | 'paid' | 'reimbursed' | 'cancelled' | 'archived',
        approval_status: form.approval_status as 'pending' | 'approved' | 'rejected' | 'returned' | 'not_required',
        notes: form.notes || undefined,
        policy_exceeded: !!policyWarning,
        splits: splits.filter(s => s.split_amount).map(s => ({
          department: s.department || undefined,
          project: s.project || undefined,
          split_amount: parseFloat(s.split_amount),
          split_percent: parseFloat(s.split_percent) || undefined,
        })),
      })

      // Upload files
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const reader = new FileReader()
        await new Promise<void>((resolve) => {
          reader.onload = async (ev) => {
            try {
              const base64 = (ev.target?.result as string).split(',')[1]
              await uploadExpenseAttachmentAction(expense.id, {
                name: f.file.name,
                type: f.file.type,
                size: f.file.size,
                base64,
              }, f.pageOrder)
            } catch (e) { console.warn('Upload failed for', f.file.name, e) }
            resolve()
          }
          reader.readAsDataURL(f.file)
        })
      }

      onSuccess()
      onClose()
    } catch (err) {
      alert(`Failed to save expense: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const steps = ['Basic Info','Vendor & Dept','Payment','Attachments','Review']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card w-full max-w-3xl rounded-2xl shadow-2xl border border-border flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-teal-600 to-teal-700 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-white">Add Expense</h2>
            <p className="text-teal-100 text-sm">{expenseNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"><X size={18}/></button>
        </div>

        {/* Step indicator */}
        <div className="flex border-b border-border px-6 pt-4 gap-1 bg-muted/20">
          {steps.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i + 1)}
              className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
                step === i + 1 ? 'border-teal-600 text-teal-600' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ── Step 1: Basic Info ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Expense Date *</label>
                  <input type="date" value={form.expense_date} onChange={e=>set('expense_date',e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-teal-500 outline-none" required/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Category *</label>
                  <select value={form.category} onChange={e=>{set('category',e.target.value);checkPolicy(form.amount,e.target.value)}}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-teal-500 outline-none" required>
                    <option value="">Select category</option>
                    {categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  {suggestedCategory && !form.category && (
                    <button onClick={()=>{set('category',suggestedCategory);setSuggestedCategory(null)}}
                      className="text-xs text-teal-600 mt-1 flex items-center gap-1 hover:underline">
                      <Sparkles size={11}/> Use suggested: {suggestedCategory}
                    </button>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Description *</label>
                  <input type="text" value={form.description}
                    onChange={e=>set('description',e.target.value)}
                    onBlur={handleDescriptionBlur}
                    placeholder="What was this expense for?"
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-teal-500 outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Amount *</label>
                  <input type="number" step="0.01" value={form.amount}
                    onChange={e=>{set('amount',e.target.value);checkPolicy(e.target.value,form.category)}}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-teal-500 outline-none"/>
                  {form.original_currency && form.original_amount && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <DollarSign size={11}/> Originally {form.original_amount} {form.original_currency} → converted to {form.currency}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Currency</label>
                  <select value={form.currency} onChange={e=>handleCurrencyChange(e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                    {CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Tax</label>
                  <input type="number" step="0.01" value={form.tax} onChange={e=>set('tax',e.target.value)} placeholder="0.00"
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-teal-500 outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Discount</label>
                  <input type="number" step="0.01" value={form.discount} onChange={e=>set('discount',e.target.value)} placeholder="0.00"
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-teal-500 outline-none"/>
                </div>
              </div>

              {/* Policy warning */}
              {policyWarning && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5"/>
                  <p>{policyWarning}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Notes</label>
                <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={2} placeholder="Any additional notes..."
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none"/>
              </div>
            </div>
          )}

          {/* ── Step 2: Vendor & Department ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Vendor</label>
                  <select value={form.vendor_id} onChange={e=>set('vendor_id',e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                    <option value="">No vendor selected</option>
                    {vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Department</label>
                  <select value={form.department} onChange={e=>set('department',e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                    <option value="">No department</option>
                    {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Project</label>
                  <input type="text" value={form.project} onChange={e=>set('project',e.target.value)} placeholder="Project name or code"
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-teal-500 outline-none"/>
                </div>
              </div>

              {/* Expense Splitting */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Split Across Cost Centers</label>
                  <button onClick={addSplit} className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700">
                    <Plus size={12}/> Add Split
                  </button>
                </div>
                {splits.length > 0 && (
                  <div className="space-y-2">
                    {splits.map(split => (
                      <div key={split.id} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                        <GripVertical size={14} className="text-muted-foreground flex-shrink-0"/>
                        <input placeholder="Department" value={split.department}
                          onChange={e=>updateSplit(split.id,'department',e.target.value)}
                          className="flex-1 px-2 py-1.5 border border-border rounded bg-background text-xs text-foreground outline-none focus:ring-2 focus:ring-teal-500"/>
                        <input placeholder="Project" value={split.project}
                          onChange={e=>updateSplit(split.id,'project',e.target.value)}
                          className="flex-1 px-2 py-1.5 border border-border rounded bg-background text-xs text-foreground outline-none focus:ring-2 focus:ring-teal-500"/>
                        <input type="number" placeholder="Amount" value={split.split_amount}
                          onChange={e=>updateSplit(split.id,'split_amount',e.target.value)}
                          className="w-24 px-2 py-1.5 border border-border rounded bg-background text-xs text-foreground outline-none focus:ring-2 focus:ring-teal-500"/>
                        <input type="number" placeholder="%" value={split.split_percent}
                          onChange={e=>updateSplit(split.id,'split_percent',e.target.value)}
                          className="w-16 px-2 py-1.5 border border-border rounded bg-background text-xs text-foreground outline-none focus:ring-2 focus:ring-teal-500"/>
                        <button onClick={()=>removeSplit(split.id)} className="text-red-500 hover:text-red-700 flex-shrink-0"><Trash2 size={13}/></button>
                      </div>
                    ))}
                    {splits.length > 0 && mainAmount > 0 && splitDiff > 0.01 && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle size={11}/> Split total ({totalSplit.toFixed(2)}) ≠ expense amount ({mainAmount.toFixed(2)})
                      </p>
                    )}
                    {splitDiff <= 0.01 && splits.length > 0 && (
                      <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={11}/> Splits balanced</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Payment ── */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Payment Method</label>
                <select value={form.payment_method} onChange={e=>set('payment_method',e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                  <option value="">Select method</option>
                  {PAYMENT_METHODS.map(m=><option key={m} value={m}>{m.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Payment Reference</label>
                <input type="text" value={form.payment_reference} onChange={e=>set('payment_reference',e.target.value)} placeholder="Ref / Receipt number"
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-teal-500 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Status</label>
                <select value={form.status} onChange={e=>set('status',e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                  {['unpaid','paid','reimbursed','cancelled'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Approval Status</label>
                <select value={form.approval_status} onChange={e=>set('approval_status',e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                  {['pending','approved','rejected','not_required'].map(s=><option key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Exchange Rate</label>
                <input type="number" step="0.0001" value={form.exchange_rate} onChange={e=>set('exchange_rate',e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-teal-500 outline-none"/>
                <p className="text-xs text-muted-foreground mt-1">1 USD = {form.exchange_rate} {form.currency}</p>
              </div>
            </div>
          )}

          {/* ── Step 4: Attachments ── */}
          {step === 4 && (
            <div className="space-y-4">
              {/* OCR banner */}
              {ocrLoading && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                  <Loader2 size={14} className="animate-spin"/> Extracting data from receipt...
                </div>
              )}
              {ocrData && ocrData.confidence >= 0.5 && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="flex items-center gap-2 text-teal-700 font-medium text-sm mb-2">
                    <Sparkles size={14}/> Detected from receipt — please confirm
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {ocrData.amount && <span className="bg-white px-2 py-1 rounded border">Amount: {ocrData.amount}</span>}
                    {ocrData.date && <span className="bg-white px-2 py-1 rounded border">Date: {ocrData.date}</span>}
                    {ocrData.tax && <span className="bg-white px-2 py-1 rounded border">Tax: {ocrData.tax}</span>}
                    {ocrData.currency && <span className="bg-white px-2 py-1 rounded border">Currency: {ocrData.currency}</span>}
                  </div>
                  <p className="text-xs text-teal-600 mt-2">Fields have been pre-filled in Step 1. Review and edit them before submitting.</p>
                </div>
              )}

              {/* Duplicate warning */}
              {duplicateWarning && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-700 text-sm">
                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5"/>
                  <div>
                    <p className="font-semibold">Possible Duplicate Receipt</p>
                    <p className="text-xs mt-1">This receipt looks similar to Expense <strong>{duplicateWarning.expense_number ?? 'unknown'}</strong> submitted on {new Date(duplicateWarning.expense_date).toLocaleDateString()}. Verify this is not a duplicate before proceeding.</p>
                  </div>
                  <button onClick={()=>setDuplicateWarning(null)} className="ml-auto flex-shrink-0 text-amber-500 hover:text-amber-700"><X size={14}/></button>
                </div>
              )}

              {/* Upload area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all"
              >
                <Upload size={32} className="mx-auto text-muted-foreground mb-2"/>
                <p className="font-medium text-foreground text-sm">Click to upload documents</p>
                <p className="text-xs text-muted-foreground mt-1">Receipt, Invoice, PDF, Images — multiple files supported</p>
                <input ref={fileInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.heic,.webp" onChange={handleFileSelect} className="hidden"/>
              </div>

              {/* File list with reorder */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Attached Files ({files.length})</p>
                  {files.map((f, idx) => (
                    <div key={f.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                      <GripVertical size={14} className="text-muted-foreground"/>
                      <span className="text-xs text-muted-foreground w-5">{idx+1}.</span>
                      {f.preview && <img src={f.preview} alt="" className="w-10 h-10 rounded object-cover border border-border"/>}
                      {!f.preview && <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-lg">📄</div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{f.file.name}</p>
                        <p className="text-xs text-muted-foreground">{(f.file.size / 1024).toFixed(0)} KB · {f.file.type}</p>
                      </div>
                      <button onClick={()=>removeFile(f.id)} className="text-red-500 hover:text-red-700 flex-shrink-0"><X size={14}/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 5: Review ── */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-xl p-5 space-y-2">
                <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2"><Info size={14}/> Review Before Submitting</h3>
                {[
                  ['Expense Number', expenseNumber],
                  ['Date', form.expense_date],
                  ['Category', form.category],
                  ['Description', form.description],
                  ['Amount', `${form.amount} ${form.currency}`],
                  ['Tax', form.tax || '0'],
                  ['Department', form.department || '-'],
                  ['Payment Method', form.payment_method || '-'],
                  ['Status', form.status],
                  ['Approval Status', form.approval_status],
                  ['Attachments', `${files.length} file(s)`],
                  ['Splits', splits.length > 0 ? `${splits.length} cost center(s)` : 'None'],
                ].map(([k,v])=>(
                  <div key={k} className="flex justify-between border-b border-border/50 py-1.5 last:border-0">
                    <span className="text-xs text-muted-foreground font-medium">{k}</span>
                    <span className="text-xs font-semibold text-foreground">{v}</span>
                  </div>
                ))}
              </div>
              {policyWarning && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                  <AlertTriangle size={16} className="flex-shrink-0"/>
                  <p><strong>Policy Note:</strong> {policyWarning}. This will be flagged for the approver.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/20 rounded-b-2xl">
          <button
            onClick={() => setStep(s => Math.max(1, s-1))}
            disabled={step === 1}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            {step < 5 ? (
              <button
                onClick={() => setStep(s => Math.min(5, s+1))}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                id="submit-expense-btn"
              >
                {loading && <Loader2 size={14} className="animate-spin"/>}
                {loading ? 'Saving...' : 'Submit Expense'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
