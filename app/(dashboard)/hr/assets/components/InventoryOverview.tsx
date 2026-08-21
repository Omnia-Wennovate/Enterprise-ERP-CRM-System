'use client'

import React from 'react'
import { Plus, Search, Filter, Laptop, Smartphone, Package, Server, Video, Printer, Wrench } from 'lucide-react'

interface InventoryProps {
  assets: any[]
  activeFilter: { key: string, value: any } | null
  onClearFilter: () => void
  onAddAsset: () => void
}

export function InventoryOverview({ assets, activeFilter, onClearFilter, onAddAsset }: InventoryProps) {
  const [searchTerm, setSearchTerm] = React.useState('')

  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'laptop': case 'desktop': return <Laptop className="w-5 h-5 text-omnia-gold" />
      case 'phone': case 'tablet': return <Smartphone className="w-5 h-5 text-omnia-gold" />
      case 'server': case 'network device': case 'router': return <Server className="w-5 h-5 text-omnia-gold" />
      case 'camera': case 'projector': return <Video className="w-5 h-5 text-omnia-gold" />
      case 'printer': case 'scanner': return <Printer className="w-5 h-5 text-omnia-gold" />
      default: return <Package className="w-5 h-5 text-omnia-gold" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'bg-emerald-100 text-emerald-800'
      case 'assigned': return 'bg-blue-100 text-blue-800'
      case 'maintenance': return 'bg-amber-100 text-amber-800'
      case 'damaged': case 'lost': return 'bg-red-100 text-red-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  let filteredAssets = assets
  if (activeFilter && activeFilter.value) {
    if (activeFilter.key === 'status') filteredAssets = filteredAssets.filter(a => a.status === activeFilter.value)
    if (activeFilter.key === 'category') filteredAssets = filteredAssets.filter(a => a.category === activeFilter.value)
    if (activeFilter.key === 'department') filteredAssets = filteredAssets.filter(a => a.department === activeFilter.value)
  }

  if (searchTerm) {
    const s = searchTerm.toLowerCase()
    filteredAssets = filteredAssets.filter(a => 
      a.asset_name?.toLowerCase().includes(s) || 
      a.asset_code?.toLowerCase().includes(s) ||
      a.serial_number?.toLowerCase().includes(s)
    )
  }

  // Calculate top-level inventory warehouse summary
  const warehouseSummary = React.useMemo(() => {
    const summary = new Map<string, { total: number, available: number, assigned: number, maintenance: number, damaged: number }>()
    assets.forEach(a => {
      const cat = a.category || 'Other'
      if (!summary.has(cat)) {
        summary.set(cat, { total: 0, available: 0, assigned: 0, maintenance: 0, damaged: 0 })
      }
      const s = summary.get(cat)!
      s.total++
      if (a.status === 'available') s.available++
      else if (a.status === 'assigned') s.assigned++
      else if (a.status === 'maintenance') s.maintenance++
      else if (a.status === 'damaged') s.damaged++
    })
    return Array.from(summary.entries())
  }, [assets])

  return (
    <div className="space-y-6">
      {/* Warehouse Summary */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6 overflow-x-auto">
        <h3 className="font-semibold text-foreground mb-4">Warehouse Overview</h3>
        <div className="flex gap-4 pb-2">
          {warehouseSummary.map(([category, counts]) => (
            <div key={category} className="flex-shrink-0 min-w-[200px] border border-border rounded-lg p-3 bg-muted/30">
              <div className="font-medium text-foreground flex justify-between">
                <span>{category}</span>
                <span className="text-omnia-gold font-bold">{counts.total}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2 grid grid-cols-2 gap-1">
                <div>Available: <span className="text-emerald-600 font-medium">{counts.available}</span></div>
                <div>Assigned: <span className="text-omnia-gold font-medium">{counts.assigned}</span></div>
                <div>Maint: <span className="text-amber-600 font-medium">{counts.maintenance}</span></div>
                <div>Damaged: <span className="text-red-600 font-medium">{counts.damaged}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search by code, name, serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-omnia-gold-500 outline-none"
            />
          </div>
          {activeFilter && activeFilter.value && (
            <button 
              onClick={onClearFilter}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 border border-red-200"
            >
              Clear Filter: {activeFilter.value}
            </button>
          )}
        </div>
        
        <button 
          onClick={onAddAsset}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-omnia-gold text-white rounded-lg hover:bg-omnia-gold-dark"
        >
          <Plus size={18} />
          Add New Asset
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-600">Asset</th>
                <th className="px-6 py-3 font-semibold text-slate-600">Code / Serial</th>
                <th className="px-6 py-3 font-semibold text-slate-600">Status</th>
                <th className="px-6 py-3 font-semibold text-slate-600">Department</th>
                <th className="px-6 py-3 font-semibold text-slate-600">Assigned To</th>
                <th className="px-6 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No assets found.
                  </td>
                </tr>
              ) : filteredAssets.map((asset) => {
                // Find current assignment if assigned
                const assignment = asset.asset_assignments?.find((a: any) => !a.return_date)
                const assigneeName = assignment?.employee 
                  ? `${assignment.employee.first_name} ${assignment.employee.last_name}` 
                  : '—'

                return (
                  <tr key={asset.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-omnia-gold/10 rounded-lg">
                          {getIcon(asset.category)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{asset.asset_name}</p>
                          <p className="text-xs text-muted-foreground">{asset.brand} {asset.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs font-medium">{asset.asset_code}</p>
                      <p className="text-xs text-muted-foreground">{asset.serial_number || 'No serial'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{asset.department || '—'}</td>
                    <td className="px-6 py-4">{assigneeName}</td>
                    <td className="px-6 py-4">
                      <button className="text-omnia-gold hover:text-foreground font-medium text-sm mr-3">
                        View
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
