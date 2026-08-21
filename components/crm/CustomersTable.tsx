'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Mail, Phone, MapPin } from 'lucide-react'
import type { Customer } from '@/types'
import { storage } from '@/lib/storage'
import { Button } from '@/components/ui/button'

export function CustomersTable() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setCustomers(storage.getCustomers())
    setIsLoading(false)
  }, [])

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'corporate':
        return 'bg-blue-100 text-blue-700'
      case 'tour_operator':
        return 'bg-purple-100 text-purple-700'
      case 'travel_agency':
        return 'bg-green-100 text-green-700'
      case 'leisure':
        return 'bg-amber-100 text-amber-700'
      default:
        return 'bg-muted text-foreground'
    }
  }

  if (isLoading) return <div className="p-4">Loading customers...</div>

  return (
    <div className="flex gap-6 h-full">
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Annual Value</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map((customer) => (
              <tr
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className="hover:bg-muted cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{customer.company_name}</p>
                    <p className="text-xs text-muted-foreground">{customer.city}, {customer.country}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCustomerTypeColor(customer.customer_type)}`}>
                    {customer.customer_type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-foreground">{customer.contact_name}</span>
                    <span className="text-xs text-muted-foreground">{customer.email}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-sm text-omnia-gold-dark">${(customer.annual_value / 1000).toFixed(0)}K</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${customer.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-foreground'}`}>
                    {customer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {selectedCustomer && (
        <div className="w-80 bg-card border-l border-border p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Customer Details</h3>
            <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)}>
              ×
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Company Name</p>
              <p className="font-semibold text-foreground">{selectedCustomer.company_name}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Contact Person</p>
              <p className="text-foreground">{selectedCustomer.contact_name}</p>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <a href={`mailto:${selectedCustomer.email}`} className="text-sm text-omnia-gold hover:underline">
                {selectedCustomer.email}
              </a>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-foreground">{selectedCustomer.phone}</p>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-foreground">
                {selectedCustomer.city}, {selectedCustomer.country}
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Customer Type</p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCustomerTypeColor(selectedCustomer.customer_type)}`}>
                {selectedCustomer.customer_type.replace('_', ' ')}
              </span>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Annual Value</p>
              <p className="font-semibold text-omnia-gold-dark text-lg">
                ${(selectedCustomer.annual_value / 1000).toFixed(0)}K
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${selectedCustomer.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-foreground'}`}>
                {selectedCustomer.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {selectedCustomer.last_booking_date && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Last Booking</p>
                <p className="text-foreground">{new Date(selectedCustomer.last_booking_date).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
