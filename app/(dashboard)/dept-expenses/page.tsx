'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Receipt, Filter, Search, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  fetchDeptExpensesAction,
  getDeptExpenseSummaryAction,
  getDeptSpendingInsightAction,
  fetchExpenseById,
} from '@/app/actions/finance'
import type { ExpenseWithRelations } from '@/types/finance'

import { DeptExpenseSummary } from './components/DeptExpenseSummary'
import { DeptExpenseList } from './components/DeptExpenseList'
import { DeptExpenseForm } from './components/DeptExpenseForm'
import { ExpenseDetailPanel } from '@/app/(dashboard)/finance/expenses/components/ExpenseDetailPanel'

const APPROVAL_FILTER_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

export default function DeptExpensesPage() {
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [viewExpense, setViewExpense] = useState<ExpenseWithRelations | null>(null)

  // Auth state
  const [userDept, setUserDept] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')

  // Data state
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([])
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [summary, setSummary] = useState({ total: 0, total_amount: 0, pending: 0, approved: 0, approved_amount: 0, rejected: 0 })
  const [insight, setInsight] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [approvalFilter, setApprovalFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 25

  const supabase = createClient()

  // Load auth info — demo mode uses localStorage 'auth_user' (set by LoginForm)
  useEffect(() => {
    const loadUser = async () => {
      // 1. Try the demo localStorage key first (fastest path for demo mode)
      try {
        const stored = localStorage.getItem('auth_user')
        if (stored) {
          const parsed = JSON.parse(stored)
          const dept = parsed.department || ''
          const name =
            parsed.full_name ||
            `${parsed.first_name || ''} ${parsed.last_name || ''}`.trim() ||
            'Employee'
          setUserDept(dept)
          setUserId(parsed.id || '')
          setUserName(name)
          setUserRole(parsed.role || '')
          // Note: fetchData will set loading=false after it completes
          return
        }
      } catch { /* ignore */ }

      // 2. Fallback: real Supabase Auth session (production path)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, department, role')
          .eq('id', user.id)
          .single()

        if (profile) {
          const dept = profile.department || ''
          const name =
            `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
            user.email ||
            'Employee'
          setUserDept(dept)
          setUserId(user.id)
          setUserName(name)
          setUserRole(profile.role || '')
        } else {
          setLoading(false)
        }
      } catch { setLoading(false) }
    }
    loadUser()
  }, [])

  const fetchData = useCallback(async () => {
    if (!userDept) return
    try {
      setLoading(true)
      const [expData, summaryData, insightData] = await Promise.all([
        fetchDeptExpensesAction({
          department: userDept,
          approval_status: approvalFilter || undefined,
          search: search || undefined,
          category: categoryFilter || undefined,
          limit: pageSize,
          offset: (page - 1) * pageSize,
        }),
        getDeptExpenseSummaryAction(userDept),
        getDeptSpendingInsightAction(userDept),
      ])
      setExpenses(expData.data)
      setTotalExpenses(expData.total)
      setSummary(summaryData)
      setInsight(insightData)
    } catch (err) {
      console.error('Failed to fetch dept expense data:', err)
    } finally {
      setLoading(false)
    }
  }, [userDept, approvalFilter, search, categoryFilter, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('dept_expenses_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => fetchData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchData])

  const handleView = async (expense: ExpenseWithRelations) => {
    setViewExpense(expense)
  }

  const handleRefreshExpense = async () => {
    fetchData()
    if (viewExpense) {
      try {
        const upd = await fetchExpenseById(viewExpense.id)
        if (upd) setViewExpense(upd)
      } catch { /* non-fatal */ }
    }
  }

  const handleFormSuccess = async (newExpenseId: string) => {
    // 1. Fetch the new expense immediately to display it with attachments/joins
    try {
      const newExp = await fetchExpenseById(newExpenseId)
      if (newExp) {
        setExpenses((prev) => [newExp, ...prev.filter(e => e.id !== newExpenseId)])
        setTotalExpenses((prev) => prev + 1)
      }
    } catch { /* non-fatal */ }
    
    // 2. Also run the background data fetch to update summaries
    fetchData()
  }

  const deptLabel = userDept
    ? userDept.charAt(0).toUpperCase() + userDept.slice(1).replace(/_/g, ' ')
    : ''

  // Finance/accountant users should use the full Finance expense module
  if (userRole === 'accountant' || userRole === 'super_admin') {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <Receipt size={48} className="mx-auto text-omnia-gold opacity-60" />
          <h2 className="text-xl font-bold text-foreground">Finance Expense Module</h2>
          <p className="text-muted-foreground text-sm">
            As a Finance team member, please use the full{' '}
            <a href="/finance/expenses" className="text-omnia-gold hover:underline font-medium">
              Finance Expense Dashboard
            </a>{' '}
            to manage all expenses.
          </p>
        </div>
      </div>
    )
  }

  // Block users without a department
  if (!userDept && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3 bg-red-50 border border-red-200 p-8 rounded-2xl max-w-md">
          <X className="mx-auto text-red-500" size={40} />
          <h2 className="text-lg font-bold text-red-700">No Department Assigned</h2>
          <p className="text-sm text-red-600">
            Your employee profile does not have a department assigned. 
            You must be assigned to a department before you can submit expenses. 
            Please contact HR or your system administrator.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt size={22} className="text-[#E2CC7E]" />
            <h1 className="text-2xl font-bold text-foreground">{deptLabel} Expenses</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Submit expenses to Finance for review · Same system, your entry point
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#E2CC7E] hover:bg-[#c9b55a] text-[#0d3553] rounded-xl font-bold shadow-sm transition-all hover:shadow"
          id="dept-add-expense-btn"
        >
          <Plus size={17} />
          Submit Expense
        </motion.button>
      </div>

      {/* Summary cards + insight */}
      {!loading && (
        <DeptExpenseSummary department={deptLabel} summary={summary} insight={insight} />
      )}
      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Expense list section */}
      <div className="bg-card border border-border rounded-2xl shadow-sm">
        {/* Toolbar */}
        <div className="p-5 border-b border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-omnia-gold/50 outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Filter size={13} className="text-muted-foreground" />
            {APPROVAL_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setApprovalFilter(opt.value); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  approvalFilter === opt.value
                    ? 'bg-omnia-gold text-[#0d3553]'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Expense list */}
        <div className="p-5">
          <DeptExpenseList
            expenses={expenses}
            total={totalExpenses}
            loading={loading}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onView={handleView}
          />
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {formOpen && (
          <DeptExpenseForm
            isOpen={formOpen}
            onClose={() => setFormOpen(false)}
            onSuccess={handleFormSuccess}
            department={userDept || deptLabel}
            employeeId={userId}
            employeeName={userName}
          />
        )}
      </AnimatePresence>

      {/* Detail panel — reuses existing Finance ExpenseDetailPanel */}
      <ExpenseDetailPanel
        expense={viewExpense}
        onClose={() => setViewExpense(null)}
        onRefresh={handleRefreshExpense}
      />
    </div>
  )
}
