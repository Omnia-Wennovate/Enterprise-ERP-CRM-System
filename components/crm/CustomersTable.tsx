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
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (isLoading) return <div className="p-4">Loading customers...</div>

  return (
    <div className="flex gap-6 h-full">
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Annual Value</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map((customer) => (
              <tr
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{customer.company_name}</p>
                    <p className="text-xs text-gray-600">{customer.city}, {customer.country}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCustomerTypeColor(customer.customer_type)}`}>
                    {customer.customer_type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-700">{customer.contact_name}</span>
                    <span className="text-xs text-gray-600">{customer.email}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-sm text-teal-700">${(customer.annual_value / 1000).toFixed(0)}K</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${customer.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {customer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {selectedCustomer && (
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Customer Details</h3>
            <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)}>
              ×
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Company Name</p>
              <p className="font-semibold text-gray-900">{selectedCustomer.company_name}</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Contact Person</p>
              <p className="text-gray-900">{selectedCustomer.contact_name}</p>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <a href={`mailto:${selectedCustomer.email}`} className="text-sm text-teal-600 hover:underline">
                {selectedCustomer.email}
              </a>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-700">{selectedCustomer.phone}</p>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-700">
                {selectedCustomer.city}, {selectedCustomer.country}
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-600 mb-2">Customer Type</p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCustomerTypeColor(selectedCustomer.customer_type)}`}>
                {selectedCustomer.customer_type.replace('_', ' ')}
              </span>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Annual Value</p>
              <p className="font-semibold text-teal-700 text-lg">
                ${(selectedCustomer.annual_value / 1000).toFixed(0)}K
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Status</p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${selectedCustomer.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {selectedCustomer.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {selectedCustomer.last_booking_date && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Last Booking</p>
                <p className="text-gray-700">{new Date(selectedCustomer.last_booking_date).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
