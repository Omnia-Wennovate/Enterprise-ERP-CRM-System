'use client'

import { useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import Link from 'next/link'

interface Employee {
  id: string
  name: string
  email: string
  position: string
  department: string
  status: 'active' | 'inactive' | 'on_leave'
  joinDate: string
}

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  // Mock data
  const employees: Employee[] = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john@travelomnia.com',
      position: 'Sales Agent',
      department: 'Sales',
      status: 'active',
      joinDate: '2023-01-15',
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@travelomnia.com',
      position: 'Operations Manager',
      department: 'Operations',
      status: 'active',
      joinDate: '2022-06-20',
    },
    {
      id: '3',
      name: 'Mike Davis',
      email: 'mike@travelomnia.com',
      position: 'Accountant',
      department: 'Finance',
      status: 'on_leave',
      joinDate: '2023-03-10',
    },
  ]

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = !filterStatus || emp.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'inactive':
        return 'bg-red-100 text-red-700'
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Employees</h1>
            <p className="text-slate-600 mt-1">Manage all employees and their information</p>
          </div>
          <Link href="/hr/employees/new" className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
            <Plus className="w-5 h-5" />
            Add Employee
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filterStatus || ''}
              onChange={(e) => setFilterStatus(e.target.value || null)}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Join Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">{emp.name}</td>
                    <td className="px-6 py-4 text-slate-600">{emp.email}</td>
                    <td className="px-6 py-4 text-slate-600">{emp.position}</td>
                    <td className="px-6 py-4 text-slate-600">{emp.department}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(emp.status)}`}>
                        {emp.status === 'on_leave' ? 'On Leave' : emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{new Date(emp.joinDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <Link href={`/hr/employees/${emp.id}`} className="text-teal-600 hover:text-teal-700 font-medium">
                        View
                      </Link>
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
