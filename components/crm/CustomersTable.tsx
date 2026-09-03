'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight, Mail, Phone, MapPin, Search, Pencil,
  Archive, MoreHorizontal, Cake, RefreshCw, X, Building2,
  Calendar, Star, DollarSign, Loader2,
} from 'lucide-react'
import type { Customer } from '@/types'
import { Button } from '@/components/ui/button'
import { getCustomersAction } from '@/app/actions/crm'
import { CustomerFormModal } from './CustomerFormModal'
import { DeleteCustomerDialog } from './DeleteCustomerDialog'

function calculateAge(dob: string): number {
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const TYPE_COLORS: Record<string, string> = {
  corporate: 'bg-blue-100 text-blue-700',
  tour_operator: 'bg-purple-100 text-purple-700',
  travel_agency: 'bg-green-100 text-green-700',
  leisure: 'bg-amber-100 text-amber-700',
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

interface CustomersTableProps {
  /** Increment to trigger a data refresh from the parent */
  refreshKey?: number
}

export function CustomersTable({ refreshKey = 0 }: CustomersTableProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  // Modals
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const fetchCustomers = useCallback(async (q?: string) => {
    setIsLoading(true)
    try {
      const result = await getCustomersAction({ search: q || undefined })
      setCustomers(result.data)
      setTotal(result.total)
    } catch (err) {
      console.error('Failed to load customers:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers(search)
  }, [refreshKey, fetchCustomers])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchCustomers])

  const handleEditOpen = (c: Customer) => {
    setEditCustomer(c)
    setIsEditOpen(true)
    setShowMoreMenu(false)
  }

  const handleDeleteOpen = (c: Customer) => {
    setDeleteCustomer(c)
    setIsDeleteOpen(true)
    setShowMoreMenu(false)
  }

  const handleEditSuccess = (updated: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c))
    if (selectedCustomer?.id === updated.id) setSelectedCustomer(updated)
    setIsEditOpen(false)
    setEditCustomer(null)
  }

  const handleDeleteSuccess = () => {
    if (deleteCustomer) {
      setCustomers(prev => prev.filter(c => c.id !== deleteCustomer.id))
      if (selectedCustomer?.id === deleteCustomer.id) setSelectedCustomer(null)
    }
    setIsDeleteOpen(false)
    setDeleteCustomer(null)
  }

  if (isLoading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading customers...</span>
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-0 h-full">
        {/* Main Table */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="px-6 py-3 border-b border-border flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, contact, or email..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-muted/40 border border-border rounded-lg outline-none focus:ring-2 focus:ring-omnia-gold/30 focus:border-omnia-gold/50 placeholder:text-muted-foreground/60"
              />
            </div>
            <span className="text-xs text-muted-foreground">{total} customer{total !== 1 ? 's' : ''}</span>
            <button
              onClick={() => fetchCustomers(search)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {customers.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Building2 className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">
                  {search ? 'No customers match your search' : 'No customers yet'}
                </p>
                <p className="text-xs mt-1">
                  {search ? 'Try a different search term' : 'Click "New Customer" to add your first customer'}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Annual Value</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      onClick={() => { setSelectedCustomer(customer); setShowMoreMenu(false) }}
                      className={`hover:bg-muted/30 cursor-pointer transition-colors ${selectedCustomer?.id === customer.id ? 'bg-omnia-gold/5 border-l-2 border-l-omnia-gold' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-sm text-foreground">{customer.company_name}</p>
                          <p className="text-xs text-muted-foreground">{customer.city}{customer.city && customer.country ? ', ' : ''}{customer.country}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLORS[customer.customer_type] || 'bg-muted text-foreground'}`}>
                          {customer.customer_type?.replace('_', ' ') || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-foreground">{customer.contact_name}</span>
                          <span className="text-xs text-muted-foreground">{customer.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-sm text-omnia-gold-dark">
                          {customer.annual_value >= 1000
                            ? `$${(customer.annual_value / 1000).toFixed(0)}K`
                            : `$${customer.annual_value}`}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${customer.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                          {customer.is_active ? 'Active' : 'Archived'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedCustomer && (
            <motion.div
              key="panel"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-80 bg-card border-l border-border flex flex-col h-full overflow-hidden"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-omnia-gold/5 to-transparent flex-shrink-0">
                <h3 className="font-bold text-sm text-foreground">Customer Details</h3>
                <button
                  onClick={() => { setSelectedCustomer(null); setShowMoreMenu(false) }}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-shrink-0">
                <Button
                  size="sm"
                  className="flex-1 bg-omnia-gold hover:bg-omnia-gold-dark text-primary-foreground text-xs h-8"
                  onClick={() => handleEditOpen(selectedCustomer)}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit Customer
                </Button>

                <div className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setShowMoreMenu(v => !v)}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>

                  <AnimatePresence>
                    {showMoreMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        className="absolute right-0 top-10 z-50 w-44 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
                      >
                        <button
                          onClick={() => handleDeleteOpen(selectedCustomer)}
                          className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Archive className="w-4 h-4" />
                          Archive Customer
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-5">

                  {/* Company */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Company</p>
                    <p className="font-bold text-foreground">{selectedCustomer.company_name}</p>
                    <span className={`inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[selectedCustomer.customer_type] || 'bg-muted text-foreground'}`}>
                      <Star className="w-2.5 h-2.5" />
                      {selectedCustomer.customer_type?.replace('_', ' ') || 'Unknown'}
                    </span>
                  </div>

                  {/* Personal Info */}
                  <div className="space-y-3 border-t border-border pt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Personal Information</p>

                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Contact Person</p>
                        <p className="text-sm font-medium text-foreground">{selectedCustomer.contact_name}</p>
                      </div>
                    </div>

                    {/* Date of Birth + Age */}
                    {selectedCustomer.date_of_birth ? (
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-omnia-gold/10 flex items-center justify-center flex-shrink-0">
                          <Cake className="w-3.5 h-3.5 text-omnia-gold" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Date of Birth</p>
                          <p className="text-sm font-medium text-foreground">{fmtDate(selectedCustomer.date_of_birth)}</p>
                          <p className="text-xs text-omnia-gold font-semibold">Age: {calculateAge(selectedCustomer.date_of_birth)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <Cake className="w-3.5 h-3.5 text-muted-foreground/50" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Age</p>
                          <p className="text-sm text-muted-foreground/60 italic">Not provided</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <a href={`mailto:${selectedCustomer.email}`} className="text-sm text-omnia-gold hover:underline truncate block">
                          {selectedCustomer.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium text-foreground">{selectedCustomer.phone || '—'}</p>
                      </div>
                    </div>

                    {selectedCustomer.city && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="text-sm font-medium text-foreground">
                            {selectedCustomer.city}{selectedCustomer.city && selectedCustomer.country ? ', ' : ''}{selectedCustomer.country}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Business Info */}
                  <div className="space-y-3 border-t border-border pt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Business</p>

                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Annual Value</p>
                        <p className="text-base font-bold text-omnia-gold-dark">
                          {selectedCustomer.annual_value >= 1000
                            ? `$${(selectedCustomer.annual_value / 1000).toFixed(0)}K`
                            : `$${selectedCustomer.annual_value}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${selectedCustomer.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                        {selectedCustomer.is_active ? 'Active' : 'Archived'}
                      </div>
                    </div>

                    {selectedCustomer.last_booking_date && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Last Booking</p>
                          <p className="text-sm font-medium text-foreground">{fmtDate(selectedCustomer.last_booking_date)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {selectedCustomer.notes && (
                    <div className="border-t border-border pt-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Notes</p>
                      <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-lg px-3 py-2 border border-border">
                        {selectedCustomer.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <CustomerFormModal
        isOpen={isEditOpen}
        customer={editCustomer}
        onClose={() => { setIsEditOpen(false); setEditCustomer(null) }}
        onSuccess={handleEditSuccess}
      />

      {/* Archive Dialog */}
      <DeleteCustomerDialog
        isOpen={isDeleteOpen}
        customer={deleteCustomer}
        onClose={() => { setIsDeleteOpen(false); setDeleteCustomer(null) }}
        onSuccess={handleDeleteSuccess}
      />
    </>
  )
}
