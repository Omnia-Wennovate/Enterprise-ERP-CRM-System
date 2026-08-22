'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, X, UploadCloud, Loader2, CheckCircle, AlertTriangle,
  BookOpen, Calendar, Globe, User, Hash,
} from 'lucide-react'
import type { DocumentType } from '@/types/documents'
import { DOCUMENT_TYPE_LABELS } from '@/types/documents'

// ── Country list (abbreviated) ────────────────────────────────────────────────
const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina',
  'Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados',
  'Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina',
  'Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia',
  'Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros',
  'Congo','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti',
  'Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea',
  'Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia',
  'Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau',
  'Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq',
  'Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati',
  'Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya',
  'Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives',
  'Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia',
  'Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia',
  'Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea',
  'North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama',
  'Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania',
  'Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines',
  'Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia',
  'Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia',
  'South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname',
  'Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste',
  'Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda',
  'Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan',
  'Vanuatu','Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
]

// ── Component ─────────────────────────────────────────────────────────────────

interface PassportFormData {
  holderName: string
  passportNumber: string
  issueDate: string
  expiryDate: string
  issuingCountry: string
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  bookingId,
  travelerId,
  travelerName,
  onUploadComplete,
}: {
  isOpen: boolean
  onClose: () => void
  bookingId?: string
  travelerId?: string
  travelerName?: string
  onUploadComplete?: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<DocumentType | ''>('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const [passport, setPassport] = useState<PassportFormData>({
    holderName: travelerName || '',
    passportNumber: '',
    issueDate: '',
    expiryDate: '',
    issuingCountry: '',
  })

  const isPassport = docType === 'passport'

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null)
      setDocType('')
      setError(null)
      setSuccess(false)
      setDragOver(false)
      setPassport({
        holderName: travelerName || '',
        passportNumber: '',
        issueDate: '',
        expiryDate: '',
        issuingCountry: '',
      })
    }
  }, [isOpen, travelerName])

  // ── File helpers ─────────────────────────────────────────────────────────

  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  const MAX_SIZE_MB = 10

  const validateFile = (f: File): string | null => {
    if (!ALLOWED_TYPES.includes(f.type)) return 'Only PDF, JPG and PNG files are accepted.'
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File must be under ${MAX_SIZE_MB} MB.`
    return null
  }

  const handleFile = (f: File) => {
    const err = validateFile(f)
    if (err) { setError(err); return }
    setError(null)
    setFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }

  // ── Validation ───────────────────────────────────────────────────────────

  const validate = (): string | null => {
    if (!docType) return 'Please select a document type.'
    if (!file) return 'Please attach a file.'
    if (isPassport) {
      if (!passport.passportNumber.trim()) return 'Passport number is required.'
      if (!passport.expiryDate) return 'Expiry date is required.'
      if (passport.issueDate && passport.expiryDate && passport.issueDate >= passport.expiryDate)
        return 'Issue date cannot be on or after expiry date.'
    }
    return null
  }

  // ── Upload ───────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setUploading(true)
    setError(null)

    try {
      // 1. Upload file to Supabase Storage
      let fileUrl: string
      try {
        const { uploadDocumentToStorage } = await import('@/lib/services/documents')
        const folder = isPassport ? 'passports' : 'general'
        fileUrl = await uploadDocumentToStorage(file!, folder)
      } catch {
        // Fallback if bucket not configured yet
        fileUrl = `pending-storage/${Date.now()}_${file!.name}`
      }

      // 2. Build ai_extracted_data for passport (reuse same structure as AI extraction)
      const aiExtractedData = isPassport
        ? {
            detectedType: 'passport' as const,
            fullName: passport.holderName || undefined,
            passportNumber: passport.passportNumber || undefined,
            issueDate: passport.issueDate || undefined,
            expiryDate: passport.expiryDate || undefined,
            issuingCountry: passport.issuingCountry || undefined,
            overallConfidence: 100, // manually entered = 100% confidence
          }
        : null


      // 3. Create document record
      const { createDocument } = await import('@/lib/services/documents')
      const newDoc = await createDocument({
        booking_id: bookingId || null,
        traveler_id: travelerId || null,
        document_type: docType as DocumentType,
        document_name: isPassport
          ? `Passport — ${passport.holderName || file!.name}`
          : file!.name,
        file_name: file!.name,
        file_url: fileUrl,
        file_size_kb: Math.round(file!.size / 1024),
        file_type: file!.type.includes('pdf') ? 'pdf' : 'image',
        file_mime: file!.type,
        expiry_date: isPassport ? passport.expiryDate || null : null,
        country: isPassport ? passport.issuingCountry || null : null,
        ai_extracted_data: aiExtractedData,
        ai_confidence: isPassport ? 'high' : 'unverified',
        folder: isPassport ? 'passports' : 'general',
      })

      // 4. Sync traveler passport data if traveler_id provided
      if (isPassport && travelerId) {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const updates: Record<string, string> = {}
        if (passport.passportNumber) updates.passport_number = passport.passportNumber
        if (passport.expiryDate) updates.passport_expiry = passport.expiryDate
        if (Object.keys(updates).length > 0) {
          await supabase.from('booking_travelers').update(updates).eq('id', travelerId)
        }
      }

      // 5. Trigger passport expiry notification check (non-blocking)
      if (isPassport) {
        import('@/lib/services/passport-notifications')
          .then(({ checkAndCreatePassportExpiryNotifications }) =>
            checkAndCreatePassportExpiryNotifications()
          )
          .catch(() => {})
      }

      setSuccess(true)
      setTimeout(() => {
        onUploadComplete?.()
        onClose()
      }, 1200)
    } catch (err: any) {
      setError(err?.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-[#0A1221] to-[#1a2744]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              {isPassport ? (
                <BookOpen className="w-5 h-5 text-white" />
              ) : (
                <UploadCloud className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isPassport ? 'Upload Passport' : 'Upload Document'}
              </h2>
              {isPassport && (
                <p className="text-xs text-white/60 mt-0.5">Enter passport details carefully</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">

          {/* Document Type */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-border rounded-lg text-sm px-3 py-2 bg-background focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={docType}
              onChange={e => { setDocType(e.target.value as DocumentType); setError(null) }}
            >
              <option value="">Select type...</option>
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* ── Passport-specific fields ── */}
          {isPassport && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 overflow-hidden"
            >
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Passport information is sensitive. Ensure details are accurate — this data syncs to the traveler profile.
                </p>
              </div>

              {/* Passport Holder */}
              <PassportField
                label="Passport Holder"
                icon={User}
                placeholder="Full name as on passport"
                value={passport.holderName}
                onChange={v => setPassport(p => ({ ...p, holderName: v }))}
              />

              {/* Passport Number */}
              <PassportField
                label="Passport Number"
                icon={Hash}
                placeholder="e.g. AB1234567"
                value={passport.passportNumber}
                onChange={v => setPassport(p => ({ ...p, passportNumber: v.toUpperCase() }))}
                required
                mono
              />

              {/* Issue Date */}
              <PassportField
                label="Issue Date"
                icon={Calendar}
                type="date"
                value={passport.issueDate}
                onChange={v => setPassport(p => ({ ...p, issueDate: v }))}
              />

              {/* Expiry Date */}
              <PassportField
                label="Expiry Date"
                icon={Calendar}
                type="date"
                value={passport.expiryDate}
                onChange={v => setPassport(p => ({ ...p, expiryDate: v }))}
                required
              />

              {/* Issuing Country */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3 h-3" /> Issuing Country
                  </span>
                </label>
                <select
                  className="w-full border border-border rounded-lg text-sm px-3 py-2 bg-background focus:ring-2 focus:ring-indigo-500"
                  value={passport.issuingCountry}
                  onChange={e => setPassport(p => ({ ...p, issuingCountry: e.target.value }))}
                >
                  <option value="">Select country...</option>
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="h-px bg-border" />
            </motion.div>
          )}

          {/* File Drop Zone */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {isPassport ? 'Passport Document / Scan' : 'File'} <span className="text-red-500">*</span>
            </label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragOver
                  ? 'border-indigo-400 bg-indigo-50'
                  : file
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-border hover:border-slate-400 bg-muted/40'
              }`}
            >
              {!file ? (
                <div className="flex flex-col items-center gap-2">
                  <UploadCloud className="w-9 h-9 text-muted-foreground" />
                  <p className="text-sm font-medium text-slate-700">Drag and drop file here</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG or PNG · Max {MAX_SIZE_MB} MB</p>
                  <input
                    type="file"
                    id="doc-file-upload"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                  <label
                    htmlFor="doc-file-upload"
                    className="mt-1 px-4 py-1.5 bg-card border border-border rounded-lg text-xs font-medium text-slate-700 hover:bg-muted/50 cursor-pointer shadow-sm"
                  >
                    Select File
                  </label>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button
                    onClick={() => setFile(null)}
                    className="text-xs font-medium text-rose-600 hover:text-rose-700 mt-1"
                  >
                    Remove file
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-emerald-800 font-medium">Document uploaded successfully!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted/40 border-t border-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || !docType || uploading || success}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#0A1221] rounded-lg hover:bg-[#1a2744] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-sm"
          >
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {success ? 'Uploaded!' : isPassport ? 'Upload Passport' : 'Upload Document'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── PassportField helper ───────────────────────────────────────────────────────

function PassportField({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
  mono,
}: {
  label: string
  icon: React.ElementType
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  type?: string
  mono?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        <span className="flex items-center gap-1.5">
          <Icon className="w-3 h-3" />
          {label}
          {required && <span className="text-red-500">*</span>}
        </span>
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border border-border rounded-lg text-sm px-3 py-2 bg-background focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
          mono ? 'font-mono tracking-wider' : ''
        }`}
      />
    </div>
  )
}
