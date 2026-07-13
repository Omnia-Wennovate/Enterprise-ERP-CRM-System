'use client'

import { useState, useEffect } from 'react'
import { Plus, Laptop, Smartphone, Package } from 'lucide-react'

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data
    setAssets([
      {
        id: '1',
        type: 'Laptop',
        name: 'Dell XPS 13',
        serial: 'DXP-2024-001',
        assignedTo: 'John Smith',
        condition: 'excellent',
        issuedDate: '2024-01-15'
      },
      {
        id: '2',
        type: 'Phone',
        name: 'iPhone 14 Pro',
        serial: 'IPH-2024-002',
        assignedTo: 'Sarah Johnson',
        condition: 'good',
        issuedDate: '2024-03-20'
      },
      {
        id: '3',
        type: 'Laptop',
        name: 'MacBook Pro',
        serial: 'MBP-2024-003',
        assignedTo: 'Michael Chen',
        condition: 'good',
        issuedDate: '2024-02-10'
      },
      {
        id: '4',
        type: 'Phone',
        name: 'Samsung Galaxy S24',
        serial: 'SGS-2024-004',
        assignedTo: 'Unassigned',
        condition: 'excellent',
        issuedDate: null
      }
    ])
    setLoading(false)
  }, [])

  const getIcon = (type: string) => {
    switch (type) {
      case 'Laptop':
        return <Laptop className="w-5 h-5 text-teal-600" />
      case 'Phone':
        return <Smartphone className="w-5 h-5 text-teal-600" />
      default:
        return <Package className="w-5 h-5 text-teal-600" />
    }
  }

  const conditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return 'bg-green-100 text-green-800'
      case 'good':
        return 'bg-blue-100 text-blue-800'
      case 'fair':
        return 'bg-yellow-100 text-yellow-800'
      case 'poor':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Assets & Equipment</h1>
            <p className="text-slate-600 mt-1">Track company assets and equipment</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
            <Plus className="w-5 h-5" />
            Add Asset
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm">Total Assets</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{assets.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm">Assigned</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{assets.filter(a => a.assignedTo !== 'Unassigned').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm">Available</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{assets.filter(a => a.assignedTo === 'Unassigned').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm">In Good Condition</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{assets.filter(a => a.condition === 'good' || a.condition === 'excellent').length}</p>
          </div>
        </div>

        {/* Assets Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-600">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Device</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Serial #</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Condition</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Issued Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 flex items-center gap-2">
                        {getIcon(asset.type)}
                        <span className="font-medium">{asset.type}</span>
                      </td>
                      <td className="px-6 py-4">{asset.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{asset.serial}</td>
                      <td className="px-6 py-4">{asset.assignedTo}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${conditionColor(asset.condition)}`}>
                          {asset.condition}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{asset.issuedDate ? new Date(asset.issuedDate).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4">
                        <button className="text-teal-600 hover:underline text-sm font-medium">Manage</button>
                      </td>
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
