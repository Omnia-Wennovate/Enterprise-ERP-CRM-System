'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, FileText, Award } from 'lucide-react'
import Link from 'next/link'

export default function EmployeeDetailPage() {
  const params = useParams()
  const [employee, setEmployee] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data - replace with actual Supabase query
    setEmployee({
      id: params.id,
      name: 'John Smith',
      email: 'john.smith@omniatravel.com',
      phone: '+1-555-0101',
      employee_id: 'EMP-2024-001',
      position: 'Senior Sales Agent',
      department: 'Sales',
      branch: 'New York',
      date_joined: '2023-01-15',
      basic_salary: 5000,
      allowances: 1000,
      employment_status: 'active',
      manager_name: 'Jane Doe',
      avatar: 'https://i.pravatar.cc/150?img=1'
    })
    setLoading(false)
  }, [params.id])

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!employee) {
    return <div className="p-8 text-center">Employee not found</div>
  }

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/hr/employees" className="p-2 hover:bg-white rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{employee.name}</h1>
            <p className="text-slate-600">{employee.position}</p>
          </div>
          <div className="ml-auto">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {employee.employment_status}
            </span>
          </div>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm mb-2">Employee ID</p>
            <p className="text-2xl font-bold text-slate-900">{employee.employee_id}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm mb-2">Department</p>
            <p className="text-2xl font-bold text-slate-900">{employee.department}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm mb-2">Branch</p>
            <p className="text-2xl font-bold text-slate-900">{employee.branch}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm mb-2">Manager</p>
            <p className="text-xl font-bold text-slate-900">{employee.manager_name}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex border-b">
            {['overview', 'compensation', 'documents', 'performance'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium transition ${
                  activeTab === tab
                    ? 'border-b-2 border-teal-600 text-teal-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-teal-600 mt-1" />
                      <div>
                        <p className="text-slate-600 text-sm">Email</p>
                        <p className="text-slate-900 font-medium">{employee.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-teal-600 mt-1" />
                      <div>
                        <p className="text-slate-600 text-sm">Phone</p>
                        <p className="text-slate-900 font-medium">{employee.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Employment Details</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-teal-600 mt-1" />
                      <div>
                        <p className="text-slate-600 text-sm">Date Joined</p>
                        <p className="text-slate-900 font-medium">{new Date(employee.date_joined).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Briefcase className="w-5 h-5 text-teal-600 mt-1" />
                      <div>
                        <p className="text-slate-600 text-sm">Position</p>
                        <p className="text-slate-900 font-medium">{employee.position}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'compensation' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-600 text-sm mb-1">Basic Salary</p>
                    <p className="text-2xl font-bold text-slate-900">${employee.basic_salary}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-600 text-sm mb-1">Allowances</p>
                    <p className="text-2xl font-bold text-slate-900">${employee.allowances}</p>
                  </div>
                  <div className="bg-teal-50 rounded-lg p-4">
                    <p className="text-slate-600 text-sm mb-1">Total</p>
                    <p className="text-2xl font-bold text-teal-600">${employee.basic_salary + employee.allowances}</p>
                  </div>
                </div>
                <div className="pt-4">
                  <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                    View Payslips
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 flex items-start justify-between hover:bg-slate-50">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-teal-600 mt-1" />
                    <div>
                      <p className="font-medium text-slate-900">Employment Contract</p>
                      <p className="text-slate-600 text-sm">Uploaded 6 months ago</p>
                    </div>
                  </div>
                  <button className="text-teal-600 hover:underline">Download</button>
                </div>
                <div className="border rounded-lg p-4 flex items-start justify-between hover:bg-slate-50">
                  <div className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-teal-600 mt-1" />
                    <div>
                      <p className="font-medium text-slate-900">Certification</p>
                      <p className="text-slate-600 text-sm">Uploaded 3 months ago</p>
                    </div>
                  </div>
                  <button className="text-teal-600 hover:underline">Download</button>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Recent Performance Reviews</h3>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <p className="font-medium">June 2024</p>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Excellent</span>
                      </div>
                      <p className="text-slate-600 text-sm">KPI Score: 95% | Target: 85%</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <p className="font-medium">May 2024</p>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Good</span>
                      </div>
                      <p className="text-slate-600 text-sm">KPI Score: 88% | Target: 85%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
