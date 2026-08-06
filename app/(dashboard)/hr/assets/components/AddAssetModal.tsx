'use client'

import React, { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createAsset } from '@/lib/services/hr'

interface AddAssetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddAssetModal({ isOpen, onClose, onSuccess }: AddAssetModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    asset_name: '',
    category: 'Laptop',
    brand: '',
    model: '',
    serial_number: '',
    purchase_price: '',
    condition: 'good',
    department: 'IT',
  })

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createAsset({
        ...formData,
        asset_type: formData.category,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        status: 'available',
        is_assigned: false,
        quantity: 1,
        available_quantity: 1,
        assigned_quantity: 0
      })
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Failed to create asset:', error)
      alert('Failed to add asset. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <h2 className="text-xl font-bold text-foreground">Add New Asset</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          <form id="add-asset-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Asset Name *</label>
                <input required type="text" name="asset_name" value={formData.asset_name} onChange={handleChange} className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-background text-foreground" placeholder="e.g. Developer MacBook Pro" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Category *</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-background text-foreground">
                  <option value="Laptop">Laptop</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Phone">Mobile Phone</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Monitor">Monitor</option>
                  <option value="Network Device">Network Device</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Brand</label>
                <input type="text" name="brand" value={formData.brand} onChange={handleChange} className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-background text-foreground" placeholder="e.g. Apple" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Model</label>
                <input type="text" name="model" value={formData.model} onChange={handleChange} className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-background text-foreground" placeholder="e.g. M3 Max 16-inch" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Serial Number</label>
                <input type="text" name="serial_number" value={formData.serial_number} onChange={handleChange} className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-background text-foreground" placeholder="e.g. C02X123456" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Purchase Price ($)</label>
                <input type="number" step="0.01" name="purchase_price" value={formData.purchase_price} onChange={handleChange} className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-background text-foreground" placeholder="0.00" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Department</label>
                <select name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-background text-foreground">
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Condition</label>
                <select name="condition" value={formData.condition} onChange={handleChange} className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-background text-foreground">
                  <option value="excellent">Excellent (New)</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair (Shows wear)</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/10 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2 font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-sm">
            Cancel
          </button>
          <button type="submit" form="add-asset-form" disabled={loading} className="px-5 py-2 font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm flex items-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Save Asset
          </button>
        </div>
      </div>
    </div>
  )
}
