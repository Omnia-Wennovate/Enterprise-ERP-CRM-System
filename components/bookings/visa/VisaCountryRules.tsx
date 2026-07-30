'use client'

import { useState, useEffect } from 'react'
import { Globe, Plus, Edit, Trash2, Loader2, AlertTriangle, CheckCircle, X } from 'lucide-react'
import type { CountryVisaRule } from '@/types/visa'
import { DOCUMENT_TYPE_LABELS } from '@/types/visa'

interface VisaCountryRulesProps {
  onRuleSelected?: (rule: CountryVisaRule) => void
}

export function VisaCountryRules({ onRuleSelected }: VisaCountryRulesProps) {
  const [rules, setRules] = useState<CountryVisaRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<CountryVisaRule | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    nationality: '', destination_country: '', visa_required: true,
    processing_time_days: '', embassy_name: '', required_documents: [] as string[],
    visa_fee: '', biometric_required: false, interview_required: false,
    insurance_required: false, min_passport_validity_months: '6',
    allowed_stay_days: '', visa_validity_months: '', entry_count: 'single',
  })

  useEffect(() => { loadRules() }, [])

  const loadRules = async () => {
    setLoading(true)
    try {
      const { getCountryVisaRules } = await import('@/lib/services/visa')
      const data = await getCountryVisaRules()
      setRules(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const resetForm = () => {
    setForm({
      nationality: '', destination_country: '', visa_required: true,
      processing_time_days: '', embassy_name: '', required_documents: [],
      visa_fee: '', biometric_required: false, interview_required: false,
      insurance_required: false, min_passport_validity_months: '6',
      allowed_stay_days: '', visa_validity_months: '', entry_count: 'single',
    })
  }

  const handleEdit = (rule: CountryVisaRule) => {
    setEditingRule(rule)
    setForm({
      nationality: rule.nationality,
      destination_country: rule.destination_country,
      visa_required: rule.visa_required,
      processing_time_days: rule.processing_time_days?.toString() || '',
      embassy_name: rule.embassy_name || '',
      required_documents: rule.required_documents || [],
      visa_fee: rule.visa_fee?.toString() || '',
      biometric_required: rule.biometric_required,
      interview_required: rule.interview_required,
      insurance_required: rule.insurance_required,
      min_passport_validity_months: rule.min_passport_validity_months.toString(),
      allowed_stay_days: rule.allowed_stay_days?.toString() || '',
      visa_validity_months: rule.visa_validity_months?.toString() || '',
      entry_count: rule.entry_count,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { upsertCountryRule } = await import('@/lib/services/visa')
      await upsertCountryRule({
        ...(editingRule ? { id: editingRule.id } : {}),
        nationality: form.nationality,
        destination_country: form.destination_country,
        visa_required: form.visa_required,
        processing_time_days: form.processing_time_days ? parseInt(form.processing_time_days) : null,
        embassy_name: form.embassy_name || null,
        required_documents: form.required_documents,
        visa_fee: form.visa_fee ? parseFloat(form.visa_fee) : null,
        biometric_required: form.biometric_required,
        interview_required: form.interview_required,
        insurance_required: form.insurance_required,
        min_passport_validity_months: parseInt(form.min_passport_validity_months) || 6,
        allowed_stay_days: form.allowed_stay_days ? parseInt(form.allowed_stay_days) : null,
        visa_validity_months: form.visa_validity_months ? parseInt(form.visa_validity_months) : null,
        entry_count: form.entry_count,
      })
      setShowForm(false)
      setEditingRule(null)
      resetForm()
      await loadRules()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const docOptions = Object.entries(DOCUMENT_TYPE_LABELS)
  const toggleDoc = (key: string) => {
    setForm(p => ({
      ...p,
      required_documents: p.required_documents.includes(key)
        ? p.required_documents.filter(d => d !== key)
        : [...p.required_documents, key],
    }))
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Globe className="w-4 h-4 text-teal-600" /> Country Visa Rules</h4>
        <button onClick={() => { resetForm(); setEditingRule(null); setShowForm(true) }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700">
          <Plus className="w-3.5 h-3.5" /> Add Rule
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-bold text-slate-700">{editingRule ? 'Edit Rule' : 'New Rule'}</h5>
            <button onClick={() => { setShowForm(false); setEditingRule(null) }}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nationality *</label>
              <input type="text" className="w-full border-slate-300 rounded-lg text-sm" placeholder="e.g. Ethiopian" value={form.nationality} onChange={e => setForm(p => ({ ...p, nationality: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Destination *</label>
              <input type="text" className="w-full border-slate-300 rounded-lg text-sm" placeholder="e.g. United States" value={form.destination_country} onChange={e => setForm(p => ({ ...p, destination_country: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Processing Days</label>
              <input type="number" className="w-full border-slate-300 rounded-lg text-sm" value={form.processing_time_days} onChange={e => setForm(p => ({ ...p, processing_time_days: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Visa Fee ($)</label>
              <input type="number" step="0.01" className="w-full border-slate-300 rounded-lg text-sm" value={form.visa_fee} onChange={e => setForm(p => ({ ...p, visa_fee: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Embassy Name</label>
              <input type="text" className="w-full border-slate-300 rounded-lg text-sm" value={form.embassy_name} onChange={e => setForm(p => ({ ...p, embassy_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Min Passport Validity (months)</label>
              <input type="number" className="w-full border-slate-300 rounded-lg text-sm" value={form.min_passport_validity_months} onChange={e => setForm(p => ({ ...p, min_passport_validity_months: e.target.value }))} />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'visa_required', label: 'Visa Required' },
              { key: 'biometric_required', label: 'Biometric' },
              { key: 'interview_required', label: 'Interview' },
              { key: 'insurance_required', label: 'Insurance' },
            ].map(cb => (
              <label key={cb.key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-teal-600" checked={form[cb.key as keyof typeof form] as boolean} onChange={e => setForm(p => ({ ...p, [cb.key]: e.target.checked }))} />
                {cb.label}
              </label>
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Required Documents</label>
            <div className="flex flex-wrap gap-2">
              {docOptions.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDoc(key)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    form.required_documents.includes(key)
                      ? 'bg-teal-100 text-teal-700 border-teal-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {form.required_documents.includes(key) && <CheckCircle className="w-3 h-3 inline mr-1" />}
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => { setShowForm(false); setEditingRule(null) }} className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.nationality || !form.destination_country} className="px-4 py-1.5 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1">
              {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="text-center py-8">
          <Globe className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No country rules configured yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors group cursor-pointer" onClick={() => onRuleSelected?.(rule)}>
              <div>
                <p className="text-sm font-semibold text-slate-900">{rule.nationality} → {rule.destination_country}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  {rule.visa_required ? <span className="text-amber-600 font-medium">Visa Required</span> : <span className="text-emerald-600 font-medium">Visa Free</span>}
                  {rule.processing_time_days && <span>{rule.processing_time_days} days processing</span>}
                  {rule.visa_fee && <span>${rule.visa_fee}</span>}
                  {rule.required_documents?.length > 0 && <span>{rule.required_documents.length} docs required</span>}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleEdit(rule) }} className="p-1.5 text-slate-400 hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-all">
                <Edit className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
