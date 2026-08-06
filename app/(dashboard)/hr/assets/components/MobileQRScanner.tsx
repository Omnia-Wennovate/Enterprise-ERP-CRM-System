'use client'

import React, { useState } from 'react'
import { QrCode, ArrowRight, ArrowLeft, Camera, CheckCircle2 } from 'lucide-react'

interface QRScannerProps {
  assets: any[]
  profiles: any[]
  onAssign: (assetId: string, employeeId: string) => Promise<void>
  onReturn: (assignmentId: string) => Promise<void>
}

export function MobileQRScanner({ assets, profiles, onAssign, onReturn }: QRScannerProps) {
  const [mode, setMode] = useState<'scan' | 'checkout' | 'checkin'>('scan')
  const [scannedAsset, setScannedAsset] = useState<any | null>(null)
  const [simulatedCode, setSimulatedCode] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const handleSimulateScan = () => {
    // Look up asset by code or serial
    const asset = assets.find(a => 
      a.asset_code?.toLowerCase() === simulatedCode.toLowerCase() || 
      a.serial_number?.toLowerCase() === simulatedCode.toLowerCase()
    )
    
    if (asset) {
      setScannedAsset(asset)
      if (asset.status === 'available') setMode('checkout')
      else setMode('checkin')
    } else {
      alert('Asset not found in system.')
    }
  }

  const handleQuickAssign = async () => {
    if (!scannedAsset || !selectedEmployee) return
    setLoading(true)
    try {
      await onAssign(scannedAsset.id, selectedEmployee)
      setSuccessMsg(`Successfully checked out to employee.`)
      setTimeout(() => reset(), 2000)
    } catch (e) {
      alert('Failed to check out asset.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickReturn = async () => {
    if (!scannedAsset) return
    setLoading(true)
    try {
      const activeAssignment = scannedAsset.asset_assignments?.find((a: any) => !a.return_date)
      if (activeAssignment) {
        await onReturn(activeAssignment.id)
        setSuccessMsg(`Successfully checked in.`)
        setTimeout(() => reset(), 2000)
      } else {
        alert('No active assignment found for this asset.')
      }
    } catch (e) {
      alert('Failed to return asset.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setMode('scan')
    setScannedAsset(null)
    setSimulatedCode('')
    setSelectedEmployee('')
    setSuccessMsg('')
  }

  if (successMsg) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
        <h2 className="text-xl font-bold text-emerald-900 mb-2">Done!</h2>
        <p className="text-emerald-700">{successMsg}</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-card rounded-2xl shadow-xl overflow-hidden border border-border">
      {/* Header */}
      <div className="bg-slate-900 p-6 text-white text-center relative">
        {mode !== 'scan' && (
          <button onClick={reset} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-800 rounded-full">
            <ArrowLeft size={20} />
          </button>
        )}
        <h2 className="text-xl font-bold">Fast-Track Kiosk</h2>
        <p className="text-slate-400 text-sm mt-1">
          {mode === 'scan' ? 'Scan equipment QR code to manage' : 'Complete action'}
        </p>
      </div>

      <div className="p-6">
        {mode === 'scan' && (
          <div className="flex flex-col items-center space-y-6">
            <div className="w-48 h-48 border-4 border-dashed border-teal-500/50 rounded-xl flex flex-col items-center justify-center bg-teal-50 text-teal-700 relative overflow-hidden">
              <QrCode size={64} className="mb-2 opacity-50" />
              <span className="font-semibold text-sm">Awaiting Scan...</span>
              
              {/* Scanning laser animation simulation */}
              <div className="absolute left-0 right-0 h-0.5 bg-teal-500/50 shadow-[0_0_8px_2px_rgba(20,184,166,0.5)] animate-[scan_2s_ease-in-out_infinite]" />
            </div>

            <div className="w-full relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center"><span className="bg-card px-2 text-xs text-muted-foreground">OR MANUAL ENTRY</span></div>
            </div>

            <div className="flex w-full gap-2">
              <input
                type="text"
                placeholder="Asset Code (e.g. AST-...)"
                value={simulatedCode}
                onChange={e => setSimulatedCode(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <button 
                onClick={handleSimulateScan}
                disabled={!simulatedCode}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg disabled:opacity-50"
              >
                Find
              </button>
            </div>
          </div>
        )}

        {mode === 'checkout' && scannedAsset && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="p-4 bg-teal-50 rounded-xl flex items-start gap-4">
              <div className="p-3 bg-teal-100 text-teal-700 rounded-lg">
                <Package size={24} />
              </div>
              <div>
                <h3 className="font-bold text-teal-900">{scannedAsset.asset_name}</h3>
                <p className="text-sm text-teal-700">{scannedAsset.asset_code}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-teal-200 text-teal-800 text-xs font-semibold rounded-full uppercase tracking-wider">
                  Available
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">Assign To:</label>
              <select 
                className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-teal-500"
                value={selectedEmployee}
                onChange={e => setSelectedEmployee(e.target.value)}
              >
                <option value="">Select Employee...</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.department || 'N/A'})</option>
                ))}
              </select>
            </div>

            <button 
              disabled={!selectedEmployee || loading}
              onClick={handleQuickAssign}
              className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-teal-500/20"
            >
              {loading ? 'Processing...' : 'Confirm Checkout'}
              {!loading && <ArrowRight size={20} />}
            </button>
          </div>
        )}

        {mode === 'checkin' && scannedAsset && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="p-4 bg-blue-50 rounded-xl flex items-start gap-4">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
                <Package size={24} />
              </div>
              <div>
                <h3 className="font-bold text-blue-900">{scannedAsset.asset_name}</h3>
                <p className="text-sm text-blue-700">{scannedAsset.asset_code}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-200 text-blue-800 text-xs font-semibold rounded-full uppercase tracking-wider">
                  Assigned
                </span>
              </div>
            </div>

            {scannedAsset.asset_assignments?.find((a: any) => !a.return_date) && (
              <div className="p-4 border border-blue-100 rounded-xl">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Current Holder</p>
                <p className="font-semibold text-slate-900">
                  {scannedAsset.asset_assignments.find((a: any) => !a.return_date).employee?.first_name}{' '}
                  {scannedAsset.asset_assignments.find((a: any) => !a.return_date).employee?.last_name}
                </p>
              </div>
            )}

            <button 
              disabled={loading}
              onClick={handleQuickReturn}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-slate-900/20"
            >
              {loading ? 'Processing...' : 'Confirm Check-in'}
              {!loading && <CheckCircle2 size={20} />}
            </button>
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
      `}} />
    </div>
  )
}
