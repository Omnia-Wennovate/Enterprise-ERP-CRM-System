'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { storage } from '@/lib/storage'

export default function NewBookingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])

  // Form data
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    destination: '',
    package_name: '',
    departure_date: '',
    return_date: '',
    total_cost: '',
    currency: 'USD',
    total_revenue: '',
    travelers: [{ full_name: '', passport_number: '', is_primary: true }],
  })

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // Try to fetch from Supabase first
        const supabase = await createClient()
        const { data, error } = await supabase.from('customers').select('id, company_name').order('created_at', { ascending: false }).limit(50)
        
        if (data && data.length > 0) {
          setCustomers(data)
          return
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local storage', err)
      }

      // Fallback to local storage (which syncs with the CRM page)
      const localCustomers = storage.getCustomers()
      setCustomers(localCustomers)
    }
    
    fetchCustomers()
  }, [])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleTravelerChange = (index: number, field: string, value: string) => {
    const newTravelers = [...formData.travelers]
    newTravelers[index] = {
      ...newTravelers[index],
      [field]: value,
    }
    setFormData(prev => ({
      ...prev,
      travelers: newTravelers,
    }))
  }

  const addTraveler = () => {
    setFormData(prev => ({
      ...prev,
      travelers: [
        ...prev.travelers,
        { full_name: '', passport_number: '', is_primary: false },
      ],
    }))
  }

  const removeTraveler = (index: number) => {
    setFormData(prev => ({
      ...prev,
      travelers: prev.travelers.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const { createBooking } = await import('@/lib/services/bookings')

      // Create booking
      const booking = await createBooking({
        booking_reference: `OMN-${Date.now()}`,
        customer_id: formData.customer_id,
        customer_name: formData.customer_name,
        destination: formData.destination,
        package_name: formData.package_name,
        trip_start_date: formData.departure_date,
        trip_end_date: formData.return_date,
        status: 'draft',
        total_cost: parseFloat(formData.total_cost) || 0,
        currency: formData.currency,
        total_revenue: parseFloat(formData.total_revenue) || 0,
      })

      // Add travelers
      const { addTraveler } = await import('@/lib/services/bookings')
      for (const traveler of formData.travelers) {
        if (traveler.full_name) {
          const names = traveler.full_name.split(' ')
          await addTraveler({
            booking_id: booking.id,
            first_name: names[0] || '',
            last_name: names.slice(1).join(' ') || '',
            passport_number: traveler.passport_number || null,
            email: null,
            phone: null,
            date_of_birth: null,
            passport_expiry: null,
            nationality: null,
            room_type: null,
            meal_plan: null,
            special_requirements: null,
          })
        }
      }

      // Redirect to booking detail
      router.push(`/bookings?id=${booking.id}`)
    } catch (err) {
      console.error('[v0] Failed to create booking:', err)
      alert('Failed to create booking. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <Link href="/bookings" className="flex items-center gap-2 text-omnia-gold hover:text-omnia-gold-dark mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create New Booking</h1>
          <p className="text-muted-foreground">Step {step} of 3</p>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-omnia-gold' : 'bg-slate-200'
                }`}
            />
          ))}
        </div>

        {/* Form */}
        <div className="bg-card rounded-lg shadow p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-foreground">Booking Details</h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select Customer *</label>
                  {customers.length === 0 ? (
                    <div className="text-sm text-red-500 py-2">
                      No customers available. Please create a customer first.{' '}
                      <Link href="/crm/customers" className="text-omnia-gold hover:underline">
                        Go to CRM
                      </Link>
                    </div>
                  ) : (
                    <select
                      value={formData.customer_id}
                      onChange={(e) => {
                        const selected = customers.find(c => c.id === e.target.value)
                        setFormData(prev => ({
                          ...prev,
                          customer_id: e.target.value,
                          customer_name: selected ? selected.company_name : '',
                        }))
                      }}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
                      required
                    >
                      <option value="">Choose a customer...</option>
                      {customers.map((customer: any) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.company_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Destination *</label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => handleInputChange('destination', e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
                    placeholder="e.g., Maldives"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Package Name</label>
                <input
                  type="text"
                  value={formData.package_name}
                  onChange={(e) => handleInputChange('package_name', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
                  placeholder="e.g., Premium Beach Getaway"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Departure Date *</label>
                  <input
                    type="date"
                    value={formData.departure_date}
                    onChange={(e) => handleInputChange('departure_date', e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Return Date *</label>
                  <input
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => handleInputChange('return_date', e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Total Cost *</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-1/3 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
                    >
                      <option value="USD">USD</option>
                      <option value="ETB">ETB</option>
                    </select>
                    <input
                      type="number"
                      value={formData.total_cost}
                      onChange={(e) => handleInputChange('total_cost', e.target.value)}
                      className="w-2/3 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Total Revenue *</label>
                  <input
                    type="number"
                    value={formData.total_revenue}
                    onChange={(e) => handleInputChange('total_revenue', e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-foreground">Travelers</h2>

              <div className="space-y-4">
                {formData.travelers.map((traveler, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground">Traveler {index + 1}</h3>
                      {formData.travelers.length > 1 && (
                        <button
                          onClick={() => removeTraveler(index)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                        <input
                          type="text"
                          value={traveler.full_name}
                          onChange={(e) => handleTravelerChange(index, 'full_name', e.target.value)}
                          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Passport Number</label>
                        <input
                          type="text"
                          value={traveler.passport_number}
                          onChange={(e) => handleTravelerChange(index, 'passport_number', e.target.value)}
                          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
                          placeholder="Enter passport number"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addTraveler}
                className="flex items-center gap-2 px-4 py-2 border border-omnia-gold text-omnia-gold rounded-lg hover:bg-omnia-gold/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Another Traveler
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-foreground">Review & Confirm</h2>

              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium text-foreground">{formData.customer_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Destination</p>
                    <p className="font-medium text-foreground">{formData.destination}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Package</p>
                    <p className="font-medium text-foreground">{formData.package_name || 'N/A'}</p>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Travelers ({formData.travelers.filter(t => t.full_name).length})</p>
                  <div className="mt-2 space-y-1">
                    {formData.travelers.filter(t => t.full_name).map((t, i) => (
                      <p key={i} className="font-medium text-foreground">{t.full_name}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-border">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-2 border border-border text-slate-700 rounded-lg hover:bg-muted/50 font-medium"
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={() => {
                  if (step === 1 && (!formData.customer_name || !formData.destination || !formData.departure_date || !formData.return_date)) {
                    alert('Please fill in all required fields')
                    return
                  }
                  if (step === 2 && !formData.travelers.some(t => t.full_name)) {
                    alert('Please add at least one traveler')
                    return
                  }
                  setStep(step + 1)
                }}
                className="ml-auto px-6 py-2 bg-omnia-gold text-primary-foreground rounded-lg hover:bg-omnia-gold-dark font-medium"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="ml-auto px-6 py-2 bg-omnia-gold text-primary-foreground rounded-lg hover:bg-omnia-gold-dark font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Booking
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
