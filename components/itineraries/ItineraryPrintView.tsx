'use client'

import { useEffect, useState } from 'react'
import {
  Plane, Building2, Car, TrainFront, Ship, UtensilsCrossed, Camera,
  Stamp, FileText, Users, Heart, Church, PartyPopper, ShoppingBag,
  Coffee, Sparkles, Clock, MapPin, Phone, Mail, Globe,
} from 'lucide-react'
import { ACTIVITY_TYPES } from '@/types/itinerary'
import type { ItineraryWithBooking, ItineraryItem } from '@/types/itinerary'
import { getActivityImagesForItems, type ActivityImage } from '@/lib/services/activity-images'

// ── Icon map ───────────────────────────────────────────────────────────────────
const ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Plane, Building2, Car, TrainFront, Ship, UtensilsCrossed, Camera,
  Stamp, FileText, Users, Heart, Church, PartyPopper, ShoppingBag,
  Coffee, Sparkles,
}

// ── Brand tokens ───────────────────────────────────────────────────────────────
const NAVY      = '#0F1B2D'
const GOLD      = '#C8A951'
const GOLD_DARK = '#A88B3A'
const WARM_WHITE = '#FAFAF7'
const BORDER    = '#E5E2DA'

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Confirmed', color: '#166534', bg: '#f0fdf4' },
  pending:   { label: 'Pending',   color: '#92400e', bg: '#fffbeb' },
  cancelled: { label: 'Cancelled', color: '#991b1b', bg: '#fef2f2' },
  completed: { label: 'Completed', color: '#A88B3A', bg: '#fefce8' },
}

// ── Date helpers ───────────────────────────────────────────────────────────────
function fmtLong(d?: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}
function fmtShort(d?: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

// ── Activity images ────────────────────────────────────────────────────────────
function PrintImages({ images }: { images: ActivityImage[] }) {
  if (!images.length) return null
  const cols = images.length === 1 ? '1fr' : images.length === 2 ? '1fr 1fr' : '1fr 1fr 1fr'
  return (
    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: cols, gap: 8 }}>
      {images.map(img => (
        <div key={img.id} style={{
          borderRadius: 8, overflow: 'hidden',
          aspectRatio: images.length === 1 ? '16/7' : '4/3',
          background: '#f0ede6',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.public_url} alt={img.file_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ))}
    </div>
  )
}

// ── Single activity card ───────────────────────────────────────────────────────
function ActivityCard({ item, images }: { item: ItineraryItem; images: ActivityImage[] }) {
  const typeCfg  = ACTIVITY_TYPES.find(t => t.value === item.type) ?? ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1]
  const IconComp = ICONS[typeCfg.icon] ?? Sparkles
  const status   = STATUS[item.status] ?? STATUS.pending
  const meta     = item.metadata as Record<string, unknown> | null

  return (
    <div style={{
      background: '#fff', border: `1px solid ${BORDER}`,
      borderRadius: 10, padding: '16px 20px', marginBottom: 12,
      breakInside: 'avoid', pageBreakInside: 'avoid',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: `${typeCfg.color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconComp className="w-4 h-4" style={{ color: typeCfg.color }} />
        </div>

        {/* Title + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.3 }}>
              {item.title}
            </h4>
            <span style={{
              fontSize: 10, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap',
              color: status.color, background: status.bg,
              border: `1px solid ${status.color}30`, borderRadius: 20, padding: '2px 8px',
            }}>
              {status.label}
            </span>
          </div>

          {/* Time & location */}
          <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
            {(item.start_time || item.time) && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B7280' }}>
                <Clock className="w-3 h-3" />
                {item.start_time || item.time}{item.end_time ? ` – ${item.end_time}` : ''}
              </span>
            )}
            {item.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B7280' }}>
                <MapPin className="w-3 h-3" />{item.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p style={{ fontSize: 11, color: '#374151', marginTop: 10, lineHeight: 1.6, paddingLeft: 48, margin: '10px 0 0 48px' }}>
          {item.description}
        </p>
      )}

      {/* Type-specific metadata */}
      {meta && (
        <div style={{ paddingLeft: 48, marginTop: 10, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {item.type === 'transfer' && <>
            {(meta.pickup_location as string) && <MetaField label="Pickup" value={meta.pickup_location as string} />}
            {(meta.dropoff_location as string) && <MetaField label="Drop-off" value={meta.dropoff_location as string} />}
          </>}
          {item.type === 'hotel' && <>
            {(meta.check_in_time as string) && <MetaField label="Check-in" value={meta.check_in_time as string} />}
            {(meta.check_out_time as string) && <MetaField label="Check-out" value={meta.check_out_time as string} />}
            {(meta.room_type as string) && <MetaField label="Room" value={meta.room_type as string} />}
            {(meta.confirmation_number as string) && <MetaField label="Conf. #" value={meta.confirmation_number as string} mono />}
          </>}
          {item.type === 'flight' && <>
            {(meta.airline as string) && <MetaField label="Airline" value={`${meta.airline as string} ${meta.flight_number as string ?? ''}`} />}
            {(meta.departure_code as string) && (meta.arrival_code as string) && (
              <MetaField label="Route" value={`${meta.departure_code} → ${meta.arrival_code}`} />
            )}
            {(meta.cabin_class as string) && <MetaField label="Class" value={meta.cabin_class as string} />}
            {(meta.pnr as string) && <MetaField label="PNR" value={meta.pnr as string} mono />}
          </>}
        </div>
      )}

      {/* Booking ref */}
      {(item.booking_reference || item.voucher_number) && (
        <div style={{ paddingLeft: 48, marginTop: 6 }}>
          {item.booking_reference && (
            <span style={{ fontSize: 10, color: '#9CA3AF', marginRight: 12 }}>
              Ref: <span style={{ fontFamily: 'monospace', color: '#6B7280' }}>{item.booking_reference}</span>
            </span>
          )}
          {item.voucher_number && (
            <span style={{ fontSize: 10, color: '#9CA3AF' }}>
              Voucher: <span style={{ fontFamily: 'monospace', color: '#6B7280' }}>{item.voucher_number}</span>
            </span>
          )}
        </div>
      )}

      {/* Contact */}
      {(item.contact_phone || item.contact_email) && (
        <div style={{ paddingLeft: 48, marginTop: 6, display: 'flex', gap: 16 }}>
          {item.contact_phone && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#6B7280' }}>
              <Phone className="w-3 h-3" />{item.contact_phone}
            </span>
          )}
          {item.contact_email && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#6B7280' }}>
              <Mail className="w-3 h-3" />{item.contact_email}
            </span>
          )}
        </div>
      )}

      {/* Notes */}
      {item.notes && (
        <p style={{
          fontSize: 10, color: '#6B7280', fontStyle: 'italic', lineHeight: 1.5,
          background: '#FAFAF7', borderRadius: 6, padding: '6px 10px',
          margin: '8px 0 0 48px',
        }}>
          {item.notes}
        </p>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div style={{ paddingLeft: 48, marginTop: 12 }}>
          <PrintImages images={images} />
        </div>
      )}
    </div>
  )
}

function MetaField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 9, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>
        {label}
      </p>
      <p style={{ fontSize: 11, color: '#374151', margin: 0, fontFamily: mono ? 'monospace' : 'inherit', fontWeight: mono ? 700 : 400 }}>
        {value}
      </p>
    </div>
  )
}

// ── Main print view ────────────────────────────────────────────────────────────
export function ItineraryPrintView({ itinerary }: { itinerary: ItineraryWithBooking }) {
  const [imageMap, setImageMap] = useState<Record<string, ActivityImage[]>>({})

  const booking  = itinerary.booking
  const days     = itinerary.days ?? []
  const destination = [itinerary.destination_city, itinerary.destination_country].filter(Boolean).join(', ')
    || booking?.destination || ''

  const startDate = booking?.trip_start_date
  const endDate   = booking?.trip_end_date
  const nights    = startDate && endDate
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
    : null

  // Load images for all items
  useEffect(() => {
    const allIds = days.flatMap(d => (d.items ?? []).map(i => i.id))
    if (!allIds.length) return
    getActivityImagesForItems(allIds).then(setImageMap).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div id="itinerary-print-root" style={{
      fontFamily: "'Georgia', 'Times New Roman', serif",
      background: WARM_WHITE,
      color: NAVY,
      minHeight: '100vh',
    }}>
      {/* ═══════════════════════════════════════════════
          HEADER / COVER
      ═══════════════════════════════════════════════ */}
      <div style={{
        background: NAVY,
        padding: '40px 48px 36px',
        breakAfter: 'avoid',
        pageBreakAfter: 'avoid',
      }}>
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/omnia-logo-light.png" alt="Omnia Destinations"
          style={{ height: 48, objectFit: 'contain', objectPosition: 'left', display: 'block', marginBottom: 24 }} />

        {/* Gold rule */}
        <div style={{ height: 2, background: `linear-gradient(90deg, ${GOLD}, transparent)`, marginBottom: 24 }} />

        {/* Trip title */}
        <h1 style={{ fontSize: 30, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          {itinerary.title}
        </h1>
        {destination && (
          <p style={{ fontSize: 15, color: GOLD, margin: '6px 0 0', fontStyle: 'italic' }}>{destination}</p>
        )}

        {/* Meta chips */}
        <div style={{ display: 'flex', gap: 32, marginTop: 24, flexWrap: 'wrap' }}>
          {nights != null && (
            <HeaderMeta label="Duration" value={`${nights} Night${nights !== 1 ? 's' : ''} / ${nights + 1} Day${nights + 1 !== 1 ? 's' : ''}`} />
          )}
          {booking?.num_travelers && (
            <HeaderMeta label="Travelers" value={`${booking.num_travelers} ${booking.num_travelers === 1 ? 'Person' : 'Persons'}`} />
          )}
          {startDate && endDate && (
            <HeaderMeta label="Dates" value={`${fmtShort(startDate)} – ${fmtShort(endDate)}`} />
          )}
          {booking?.customer_name && (
            <HeaderMeta label="Guest" value={booking.customer_name} />
          )}
          {booking?.booking_reference && (
            <HeaderMeta label="Reference" value={booking.booking_reference} mono gold />
          )}
        </div>

        <div style={{ height: 1, background: `${GOLD}40`, marginTop: 28 }} />
      </div>

      {/* ═══════════════════════════════════════════════
          DAY SECTIONS
      ═══════════════════════════════════════════════ */}
      <div style={{ padding: '32px 48px' }}>
        {days.length === 0 && (
          <p style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>No days added to this itinerary yet.</p>
        )}

        {days.map((day, idx) => {
          const items = day.items ?? []
          return (
            <div key={day.id} style={{ marginBottom: 36, breakBefore: idx > 0 ? 'avoid' : 'auto' }}>
              {/* Day header */}
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 16,
                paddingBottom: 10, borderBottom: `2px solid ${GOLD}`,
                breakAfter: 'avoid', pageBreakAfter: 'avoid',
              }}>
                <div style={{
                  background: NAVY, color: GOLD, padding: '4px 12px', borderRadius: 4,
                  fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0,
                }}>
                  DAY {day.day_number}
                </div>
                <div>
                  {day.title && day.title !== `Day ${day.day_number}` && (
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.2 }}>
                      {day.title}
                    </h2>
                  )}
                  {day.date && (
                    <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{fmtLong(day.date)}</p>
                  )}
                  {day.city && (
                    <p style={{ fontSize: 11, color: GOLD_DARK, margin: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <MapPin className="w-3 h-3" style={{ display: 'inline' }} />
                      {day.city}{day.country ? `, ${day.country}` : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Day description */}
              {day.description && (
                <p style={{ fontSize: 12, color: '#374151', marginBottom: 14, fontStyle: 'italic', lineHeight: 1.6 }}>
                  {day.description}
                </p>
              )}

              {/* Activities */}
              {items.length === 0
                ? <p style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>No activities scheduled.</p>
                : items.map(item => (
                    <ActivityCard key={item.id} item={item} images={imageMap[item.id] ?? []} />
                  ))
              }
            </div>
          )
        })}

        {/* Emergency contacts */}
        {(itinerary.emergency_police || itinerary.emergency_ambulance || itinerary.emergency_embassy) && (
          <div style={{
            marginTop: 32, border: `1px solid ${GOLD}40`, borderRadius: 10,
            padding: '18px 24px', background: `${NAVY}06`,
            breakInside: 'avoid', pageBreakInside: 'avoid',
          }}>
            <h3 style={{ fontSize: 11, fontWeight: 800, color: NAVY, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Globe className="w-3.5 h-3.5" style={{ color: GOLD }} />
              Emergency Contacts
            </h3>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {itinerary.emergency_police && <MetaField label="Police" value={itinerary.emergency_police} />}
              {itinerary.emergency_ambulance && <MetaField label="Ambulance" value={itinerary.emergency_ambulance} />}
              {itinerary.emergency_embassy && <MetaField label="Embassy" value={itinerary.emergency_embassy} />}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════ */}
      <div id="print-footer" style={{
        background: NAVY, padding: '18px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/omnia-logo-light.png" alt="Omnia" style={{ height: 28, objectFit: 'contain' }} />
          <div style={{ width: 1, height: 28, background: `${GOLD}40` }} />
          <p style={{ fontSize: 10, color: '#64748B', margin: 0, fontStyle: 'italic' }}>
            Luxury Travel Experiences
          </p>
        </div>
        <p style={{ fontSize: 10, color: '#475569', margin: 0 }}>Curated Just for You</p>
      </div>
    </div>
  )
}

function HeaderMeta({ label, value, mono, gold }: { label: string; value: string; mono?: boolean; gold?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 2px' }}>
        {label}
      </p>
      <p style={{ fontSize: 14, fontWeight: 700, color: gold ? GOLD : '#fff', margin: 0, fontFamily: mono ? 'monospace' : 'inherit' }}>
        {value}
      </p>
    </div>
  )
}
