'use client'

import { useState } from 'react'
import { DollarSign, Download } from 'lucide-react'

interface PayrollRecord {
  id: string
  employeeName: string
  basicSalary: number
  allowances: number
  bonuses: number
  deductions: number
  tax: number
  netSalary: number
  status: 'draft' | 'approved' | 'paid'
}

export default function PayrollPage() {
  const [period, setPeriod] = useState('2024-12')

  const payrollRecords: PayrollRecord[] = [
    {
      id: '1',
      employeeName: 'John Smith',
      basicSalary: 3000,
      allowances: 500,
      bonuses: 200,
      deductions: 150,
      tax: 520,
      netSalary: 3030,
      status: 'approved',
    },
    {
      id: '2',
      employeeName: 'Sarah Johnson',
      basicSalary: 3500,
      allowances: 600,
      bonuses: 300,
      deductions: 200,
      tax: 645,
      netSalary: 3555,
      status: 'draft',
    },
    {
      id: '3',
      employeeName: 'Mike Davis',
      basicSalary: 2800,
      allowances: 400,
      bonuses: 150,
      deductions: 100,
      tax: 480,
      netSalary: 2870,
      status: 'paid',
    },
  ]

  const totalPayroll = payrollRecords.reduce((sum, rec) => sum + rec.netSalary, 0)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-700'
      case 'approved':
        return 'bg-blue-100 text-blue-700'
      case 'paid':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Payroll</h1>
            <p className="text-slate-600 mt-1">Manage employee salaries and payments</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>

        {/* Period Selector and Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Select Period</label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              />
            </div>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Payroll</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">${totalPayroll.toLocaleString()}</p>
              </div>
              <div className="flex-1">
                <p className="text-slate-600 text-sm font-medium">Employees</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{payrollRecords.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Employee</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-900">Basic</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-900">Allowances</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-900">Bonuses</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-900">Deductions</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-900">Tax</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-900">Net Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payrollRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">{rec.employeeName}</td>
                    <td className="px-6 py-4 text-right text-slate-600">${rec.basicSalary}</td>
                    <td className="px-6 py-4 text-right text-slate-600">${rec.allowances}</td>
                    <td className="px-6 py-4 text-right text-slate-600">${rec.bonuses}</td>
                    <td className="px-6 py-4 text-right text-slate-600">${rec.deductions}</td>
                    <td className="px-6 py-4 text-right text-slate-600">${rec.tax}</td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-900">${rec.netSalary}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(rec.status)}`}>
                        {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
