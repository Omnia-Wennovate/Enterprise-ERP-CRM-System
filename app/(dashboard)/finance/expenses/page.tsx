'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  fetchExpensesWithRelations,
  fetchExpenseKPIs,
  fetchExpenseChartData,
  fetchVendors,
  fetchExpenseCategories,
  fetchExpenseBudgets,
  deleteExpenseAction,
  duplicateExpenseAction,
  archiveExpenseAction,
  markExpensePaidAction,
} from '@/app/actions/finance'
import type { ExpenseWithRelations, ExpenseKPIs, ExpenseChartData, Vendor, ExpenseCategoryConfig, ExpenseBudget } from '@/types/finance'

// Components
import { ExpenseDashboard } from './components/ExpenseDashboard'
import { ExpenseList } from './components/ExpenseList'
import { SearchFilterBar, ExpenseFilters, defaultFilters } from './components/SearchFilterBar'
import { AddExpenseModal } from './components/AddExpenseModal'
import { ExpenseDetailPanel } from './components/ExpenseDetailPanel'
import { VendorManagement } from './components/VendorManagement'
import { CategoryManagement } from './components/CategoryManagement'
import { BudgetTracking } from './components/BudgetTracking'
import { ExpenseReports } from './components/ExpenseReports'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'categories', label: 'Categories' },
  { id: 'budgets', label: 'Budgets' },
  { id: 'reports', label: 'Reports' },
]

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  // Data state
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([])
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [kpis, setKpis] = useState<ExpenseKPIs | null>(null)
  const [chartData, setChartData] = useState<ExpenseChartData | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [categories, setCategories] = useState<ExpenseCategoryConfig[]>([])
  const [budgets, setBudgets] = useState<ExpenseBudget[]>([])

  // UI state
  const [filters, setFilters] = useState<ExpenseFilters>(defaultFilters)
  const [page, setPage] = useState(1)
  const pageSize = 50
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [viewExpense, setViewExpense] = useState<ExpenseWithRelations | null>(null)

  const supabase = createClient()

  // Fetch core data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [expData, kpiData, charts, v, c, b] = await Promise.all([
        fetchExpensesWithRelations({
          ...filters,
          amount_min: filters.amount_min ? parseFloat(filters.amount_min) : undefined,
          amount_max: filters.amount_max ? parseFloat(filters.amount_max) : undefined,
          limit: pageSize,
          offset: (page - 1) * pageSize,
        }),
        fetchExpenseKPIs(),
        fetchExpenseChartData(),
        fetchVendors(),
        fetchExpenseCategories(),
        fetchExpenseBudgets(),
      ])
      setExpenses(expData.data)
      setTotalExpenses(expData.total)
      setKpis(kpiData)
      setChartData(charts)
      setVendors(v)
      setCategories(c)
      setBudgets(b)
    } catch (err) {
      console.error('Failed to fetch expense data:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase.channel('expenses_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_approvals' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_attachments' }, () => fetchData())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchData])

  // Handlers
  const handleFilterChange = (newFilters: ExpenseFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleDashboardFilter = (filterMap: Record<string, string>) => {
    setFilters({ ...defaultFilters, ...filterMap })
    setActiveTab('expenses')
    setPage(1)
  }

  const handleDelete = async (id: string) => {
    try { await deleteExpenseAction(id); fetchData() }
    catch (e) { alert(`Failed to delete: ${e instanceof Error ? e.message : 'Error'}`) }
  }
  const handleDuplicate = async (id: string) => {
    try { await duplicateExpenseAction(id); fetchData(); setActiveTab('expenses') }
    catch (e) { alert(`Failed to duplicate: ${e instanceof Error ? e.message : 'Error'}`) }
  }
  const handleArchive = async (id: string) => {
    try { await archiveExpenseAction(id); fetchData() }
    catch (e) { alert(`Failed to archive: ${e instanceof Error ? e.message : 'Error'}`) }
  }
  const handleMarkPaid = async (id: string) => {
    try { await markExpensePaidAction(id); fetchData() }
    catch (e) { alert(`Failed to mark paid: ${e instanceof Error ? e.message : 'Error'}`) }
  }

  return (
    <div className="flex-1 space-y-6 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expense Management</h1>
          <p className="text-muted-foreground mt-1">Manage corporate expenses, approvals, and budget compliance</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-omnia-gold hover:bg-omnia-gold-dark text-white rounded-xl font-semibold shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
          id="global-add-expense-btn"
        >
          <Plus size={18} /> New Expense
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card rounded-t-xl px-2 pt-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-omnia-gold text-omnia-gold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-t-lg'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="min-h-[500px]">
        {loading && !kpis ? (
          <div className="flex items-center justify-center h-[400px] text-omnia-gold">
            <Loader2 size={32} className="animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && kpis && chartData && (
                <ExpenseDashboard kpis={kpis} chartData={chartData} onFilterChange={handleDashboardFilter} />
              )}

              {activeTab === 'expenses' && (
                <div className="space-y-4">
                  <SearchFilterBar filters={filters} onFiltersChange={handleFilterChange} onClear={() => handleFilterChange(defaultFilters)} />
                  <ExpenseList
                    expenses={expenses}
                    total={totalExpenses}
                    page={page}
                    pageSize={pageSize}
                    loading={loading}
                    onPageChange={setPage}
                    onView={setViewExpense}
                    onEdit={(e) => { /* TODO edit modal */ }}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onArchive={handleArchive}
                    onMarkPaid={handleMarkPaid}
                    onExportPDF={(e) => { /* handled inside ExpenseList for now via print */ }}
                  />
                </div>
              )}

              {activeTab === 'vendors' && (
                <VendorManagement vendors={vendors} onRefresh={() => fetchData()} />
              )}

              {activeTab === 'categories' && (
                <CategoryManagement categories={categories} onRefresh={() => fetchData()} />
              )}

              {activeTab === 'budgets' && (
                <BudgetTracking budgets={budgets} onRefresh={() => fetchData()} />
              )}

              {activeTab === 'reports' && (
                <ExpenseReports />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Modals */}
      <AddExpenseModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => fetchData()}
      />
      <ExpenseDetailPanel
        expense={viewExpense}
        onClose={() => setViewExpense(null)}
        onRefresh={() => {
          fetchData()
          // Update the specific view expense if it exists to refresh its data
          if (viewExpense) {
            fetchExpenseByIdWrapper(viewExpense.id)
          }
        }}
      />
    </div>
  )

  async function fetchExpenseByIdWrapper(id: string) {
    const { fetchExpenseById } = await import('@/app/actions/finance')
    const upd = await fetchExpenseById(id)
    if (upd) setViewExpense(upd)
  }
}
