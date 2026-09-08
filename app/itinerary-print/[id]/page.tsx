'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { ItineraryPrintView } from '@/components/itineraries/ItineraryPrintView'
import type { ItineraryWithBooking } from '@/types/itinerary'

export default function ItineraryPrintPage() {
  const params = useParams()
  const id = params?.id as string

  const [itinerary, setItinerary] = useState<ItineraryWithBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [printed, setPrinted] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const { getItineraryById } = await import('@/lib/services/itineraries')
      const data = await getItineraryById(id)
      if (!data) {
        setError('Itinerary not found.')
        return
      }
      setItinerary(data)
    } catch (err) {
      setError('Failed to load itinerary.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  // Auto-print after data is ready (with a small delay to let images render)
  useEffect(() => {
    if (!loading && itinerary && !printed) {
      const timer = setTimeout(() => {
        setPrinted(true)
        window.print()
      }, 800) // 800ms gives Next.js Image time to load
      return () => clearTimeout(timer)
    }
  }, [loading, itinerary, printed])

  // ── Loading State ──
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', gap: '12px',
        fontFamily: 'Georgia, serif', color: '#0F1B2D',
      }}>
        <Loader2 style={{ width: 32, height: 32, animation: 'spin 1s linear infinite', color: '#C8A951' }} />
        <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Preparing your itinerary…</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ── Error State ──
  if (error || !itinerary) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', gap: '12px',
        fontFamily: 'Georgia, serif', color: '#0F1B2D',
      }}>
        <p style={{ fontSize: '16px', fontWeight: 600 }}>Unable to load itinerary</p>
        <p style={{ fontSize: '13px', color: '#6B7280' }}>{error || 'Itinerary not found.'}</p>
        <button
          onClick={() => window.close()}
          style={{ marginTop: 8, padding: '8px 20px', background: '#C8A951', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
        >
          Close
        </button>
      </div>
    )
  }

  // ── Print View ──
  return (
    <>
      {/* Screen-only toolbar — hidden in @media print via CSS below */}
      <div className="print-toolbar-screen-only" style={{
        background: '#0F1B2D', color: '#fff', padding: '10px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '13px', fontFamily: 'sans-serif',
      }}>
        <span style={{ color: '#C8A951', fontWeight: 600 }}>Omnia Destinations — Print Preview</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{
              background: '#C8A951', color: '#0F1B2D', border: 'none',
              padding: '6px 18px', borderRadius: 6, cursor: 'pointer',
              fontWeight: 700, fontSize: 13,
            }}
          >
            🖨 Print / Save as PDF
          </button>
          <button
            onClick={() => window.close()}
            style={{
              background: 'transparent', color: '#94A3B8', border: '1px solid #334155',
              padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* The actual print content */}
      <ItineraryPrintView itinerary={itinerary} />

      {/* Print-specific styles for this page */}
      <style>{`
        @media print {
          .print-toolbar-screen-only {
            display: none !important;
          }
          @page {
            margin: 0;
            size: A4;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          #itinerary-print-root {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
        }

        @media screen {
          body {
            background: #e5e7eb;
          }
          #itinerary-print-root {
            max-width: 210mm;
            margin: 0 auto;
            box-shadow: 0 4px 32px rgba(0,0,0,0.18);
          }
        }
      `}</style>
    </>
  )
}
