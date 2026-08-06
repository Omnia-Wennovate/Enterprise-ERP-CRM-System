'use client'

import React, { useState, useEffect } from 'react'
import { QrCode, LayoutDashboard, List, Loader2, RefreshCw } from 'lucide-react'
import { ExecutiveDashboard } from './components/ExecutiveDashboard'
import { InventoryOverview } from './components/InventoryOverview'
import { MobileQRScanner } from './components/MobileQRScanner'
import { AddAssetModal } from './components/AddAssetModal'
import { getAssets, assignAsset, returnAsset } from '@/lib/services/hr'
import { getEmployees } from '@/lib/services/hr'

export default function AssetsPage() {
  const [viewMode, setViewMode] = useState<'dashboard' | 'inventory' | 'qr'>('dashboard')
  const [assets, setAssets] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<{ key: string, value: any } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [assetsData, profilesData] = await Promise.all([
        getAssets(),
        getEmployees()
      ])
      setAssets(assetsData || [])
      setProfiles(profilesData || [])
    } catch (err) {
      console.error('Failed to load assets', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleFilterClick = (newFilter: { key: string, value: any }) => {
    if (newFilter.key === 'all') {
      setFilter(null)
      setViewMode('inventory')
    } else {
      setFilter(newFilter)
      setViewMode('inventory')
    }
  }

  // Flatten assignments from all assets for the dashboard metrics
  const allAssignments = React.useMemo(() => {
    return assets.flatMap(a => a.asset_assignments || [])
  }, [assets])

  const handleAssignAsset = async (assetId: string, employeeId: string) => {
    await assignAsset({
      asset_id: assetId,
      employee_id: employeeId,
      issued_date: new Date().toISOString().split('T')[0],
      condition_on_issue: 'good', // default for quick assign
    })
    await loadData() // Refresh
  }

  const handleReturnAsset = async (assignmentId: string) => {
    await returnAsset(assignmentId, {
      return_date: new Date().toISOString().split('T')[0],
      condition_on_return: 'good'
    })
    await loadData() // Refresh
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Header & Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Asset Management</h1>
            <p className="text-muted-foreground mt-1">Enterprise HR Equipment & Hardware</p>
          </div>
          
          <div className="flex bg-muted/50 p-1 rounded-xl border border-border">
            <button 
              onClick={() => { setViewMode('dashboard'); setFilter(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'dashboard' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <LayoutDashboard size={18} />
              <span className="hidden sm:inline">Executive Dashboard</span>
            </button>
            <button 
              onClick={() => setViewMode('inventory')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'inventory' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <List size={18} />
              <span className="hidden sm:inline">Inventory</span>
            </button>
            <button 
              onClick={() => setViewMode('qr')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'qr' ? 'bg-slate-900 shadow-sm text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <QrCode size={18} />
              <span className="hidden sm:inline">QR Kiosk</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-teal-600" />
            <p>Loading enterprise asset data...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            {viewMode === 'dashboard' && (
              <ExecutiveDashboard 
                assets={assets} 
                assignments={allAssignments} 
                onFilterClick={handleFilterClick} 
              />
            )}
            
            {viewMode === 'inventory' && (
              <InventoryOverview 
                assets={assets} 
                activeFilter={filter}
                onClearFilter={() => setFilter(null)}
                onAddAsset={() => setShowAddModal(true)}
              />
            )}
            
            {viewMode === 'qr' && (
              <MobileQRScanner 
                assets={assets}
                profiles={profiles}
                onAssign={handleAssignAsset}
                onReturn={handleReturnAsset}
              />
            )}
          </div>
        )}
        
        <AddAssetModal 
          isOpen={showAddModal} 
          onClose={() => setShowAddModal(false)} 
          onSuccess={loadData} 
        />
      </div>
    </div>
  )
}
