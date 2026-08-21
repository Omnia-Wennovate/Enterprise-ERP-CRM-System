'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Loader2, Building, Phone, Mail, MapPin, Hash, DollarSign } from 'lucide-react'
import type { Vendor, CreateVendorFormData } from '@/types/finance'
import { createVendorAction, updateVendorAction, deleteVendorAction } from '@/app/actions/finance'

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'

const EMPTY_FORM: CreateVendorFormData = { name: '', contact_person: '', phone: '', email: '', tax_number: '', address: '' }

interface VendorManagementProps {
  vendors: Vendor[]
  onRefresh: () => void
}

export function VendorManagement({ vendors, onRefresh }: VendorManagementProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [form, setForm] = useState<CreateVendorFormData>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (v: Vendor) => {
    setEditing(v)
    setForm({ name: v.name, contact_person: v.contact_person ?? '', phone: v.phone ?? '', email: v.email ?? '', tax_number: v.tax_number ?? '', address: v.address ?? '' })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editing) await updateVendorAction(editing.id, form)
      else await createVendorAction(form)
      setModalOpen(false)
      onRefresh()
    } catch (err) { alert(`Failed: ${err instanceof Error ? err.message : 'Error'}`) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vendor?')) return
    try { await deleteVendorAction(id); onRefresh() }
    catch (err) { alert(`Failed: ${err instanceof Error ? err.message : 'Error'}`) }
  }

  const filtered = vendors.filter(v => v.name.toLowerCase().includes(search.toLowerCase()) || v.email?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vendors..." className="px-4 py-2 border border-border rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-omnia-gold-500 w-72"/>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-omnia-gold hover:bg-omnia-gold-dark text-white rounded-lg text-sm font-semibold transition-colors" id="add-vendor-btn">
          <Plus size={16}/> Add Vendor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(v => (
          <motion.div key={v.id} layout initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-omnia-gold/15 flex items-center justify-center text-omnia-gold-dark font-bold text-sm flex-shrink-0">
                  {v.name.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{v.name}</p>
                  {v.contact_person && <p className="text-xs text-muted-foreground">{v.contact_person}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={()=>openEdit(v)} className="p-1.5 rounded hover:bg-omnia-gold/5 text-omnia-gold transition-colors"><Pencil size={13}/></button>
                <button onClick={()=>handleDelete(v.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={13}/></button>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              {v.phone && <p className="flex items-center gap-1.5 text-muted-foreground"><Phone size={11}/>{v.phone}</p>}
              {v.email && <p className="flex items-center gap-1.5 text-muted-foreground"><Mail size={11}/>{v.email}</p>}
              {v.address && <p className="flex items-center gap-1.5 text-muted-foreground"><MapPin size={11}/>{v.address}</p>}
              {v.tax_number && <p className="flex items-center gap-1.5 text-muted-foreground"><Hash size={11}/>Tax: {v.tax_number}</p>}
            </div>

            <div className="border-t border-border mt-3 pt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Expenses</p>
                <p className="text-sm font-bold text-foreground">{v.total_expenses ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <p className="text-sm font-bold text-omnia-gold">{fmt(v.total_paid ?? 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Txn</p>
                <p className="text-xs font-medium text-foreground">{fmtDate(v.last_transaction)}</p>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Building size={32} className="mx-auto mb-2 opacity-30"/>
            <p>No vendors found. Add your first vendor.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
              className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-foreground">{editing ? 'Edit Vendor' : 'Add New Vendor'}</h3>
                <button onClick={()=>setModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1"><Plus size={16} className="rotate-45"/></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Vendor Name *</label>
                  <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-omnia-gold-500 outline-none" placeholder="Company or vendor name"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[['contact_person','Contact Person'],['phone','Phone'],['email','Email'],['tax_number','Tax Number']].map(([k,l])=>(
                    <div key={k}>
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{l}</label>
                      <input value={form[k as keyof CreateVendorFormData]??''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-omnia-gold-500 outline-none"/>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Address</label>
                  <input value={form.address??''} onChange={e=>setForm(f=>({...f,address:e.target.value}))}
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-omnia-gold-500 outline-none" placeholder="Full address"/>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={()=>setModalOpen(false)} className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-omnia-gold hover:bg-omnia-gold-dark text-white rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading && <Loader2 size={14} className="animate-spin"/>}
                    {loading ? 'Saving...' : editing ? 'Update' : 'Add Vendor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
