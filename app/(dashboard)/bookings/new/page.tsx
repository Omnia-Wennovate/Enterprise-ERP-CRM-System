'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewBookingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    customer_name: '',
    destination: '',
    package_name: '',
    departure_date: '',
    return_date: '',
    total_cost: '',
    total_revenue: '',
    travelers: [{ full_name: '', passport_number: '', is_primary: true }],
  })

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
        customer_id: 'demo-customer',
        customer_name: formData.customer_name,
        destination: formData.destination,
        package_name: formData.package_name,
        trip_start_date: formData.departure_date,
        trip_end_date: formData.return_date,
        status: 'draft',
        total_cost: parseFloat(formData.total_cost) || 0,
        total_revenue: parseFloat(formData.total_revenue) || 0,
        created_by: 'demo-user',
      })

      // Add travelers
      const { createTraveler } = await import('@/lib/services/bookings')
      for (const traveler of formData.travelers) {
        if (traveler.full_name) {
          await createTraveler(booking.id, {
            full_name: traveler.full_name,
            passport_number: traveler.passport_number,
            is_primary: traveler.is_primary,
          })
        }
      }

      // Redirect to booking detail
      router.push(`/bookings/${booking.id}`)
    } catch (err) {
      console.error('[v0] Failed to create booking:', err)
      alert('Failed to create booking. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <Link href="/bookings" className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Booking</h1>
          <p className="text-slate-600">Step {step} of 3</p>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full ${
                s <= step ? 'bg-teal-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900">Booking Details</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Customer Name *</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => handleInputChange('customer_name', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Destination *</label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => handleInputChange('destination', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Return Date *</label>
                  <input
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => handleInputChange('return_date', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Total Cost *</label>
                  <input
                    type="number"
                    value={formData.total_cost}
                    onChange={(e) => handleInputChange('total_cost', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Total Revenue *</label>
                  <input
                    type="number"
                    value={formData.total_revenue}
                    onChange={(e) => handleInputChange('total_revenue', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900">Travelers</h2>
              
              <div className="space-y-4">
                {formData.travelers.map((traveler, index) => (
                  <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-slate-900">Traveler {index + 1}</h3>
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
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Passport Number</label>
                        <input
                          type="text"
                          value={traveler.passport_number}
                          onChange={(e) => handleTravelerChange(index, 'passport_number', e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Enter passport number"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addTraveler}
                className="flex items-center gap-2 px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Another Traveler
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900">Review & Confirm</h2>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">Customer</p>
                  <p className="font-medium text-slate-900">{formData.customer_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Destination</p>
                    <p className="font-medium text-slate-900">{formData.destination}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">Package</p>
                    <p className="font-medium text-slate-900">{formData.package_name || 'N/A'}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">Travelers ({formData.travelers.filter(t => t.full_name).length})</p>
                  <div className="mt-2 space-y-1">
                    {formData.travelers.filter(t => t.full_name).map((t, i) => (
                      <p key={i} className="font-medium text-slate-900">{t.full_name}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-slate-200">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
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
                className="ml-auto px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="ml-auto px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 flex items-center gap-2"
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
