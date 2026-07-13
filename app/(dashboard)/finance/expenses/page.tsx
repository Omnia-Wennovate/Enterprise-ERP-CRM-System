'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { fetchExpenses, fetchExpensesByCategory } from '@/app/actions/finance'
import type { Expense } from '@/types/finance'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<{ category: string; total: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    try {
      setLoading(true)
      const [expensesData, categoriesData] = await Promise.all([
        fetchExpenses(),
        fetchExpensesByCategory(),
      ])
      setExpenses(expensesData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Failed to load expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Expenses</h1>
            <p className="text-slate-600 mt-1">Track all business expenses</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
            <Plus className="w-5 h-5" />
            Add Expense
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Total Expenses</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">${totalExpenses.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Total Records</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{expenses.length}</p>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-slate-900 mb-4">By Category</h3>
            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat.category} className="flex justify-between">
                  <span className="text-slate-600">{cat.category}</span>
                  <span className="font-semibold">${cat.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-600">Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center text-slate-600">No expenses recorded</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">{new Date(exp.expense_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{exp.category}</td>
                      <td className="px-6 py-4">{exp.description}</td>
                      <td className="px-6 py-4 font-semibold">${exp.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
