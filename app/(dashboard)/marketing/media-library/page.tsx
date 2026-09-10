'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/lib/context/profile-context'
import type { MediaLibraryItem } from '@/types/marketing'
import { Loader2, Plus, X, Image as ImageIcon, Video, FileText, Grid, List, Search, Trash2 } from 'lucide-react'
import { getMediaLibrary, createMediaItem, deleteMediaItem, getMediaCountsByType } from '@/lib/services/media-library'
import { getCampaigns } from '@/lib/services/campaigns'

export default function MediaLibraryPage() {
  const router = useRouter()
  const profile = useProfile()
  const [media, setMedia] = useState<MediaLibraryItem[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState({ file_name: '', file_url: '', file_type: 'image', file_size_kb: 0, campaign_id: '', category: '', platform: '' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try { setIsLoading(true); const [m, c, tc] = await Promise.all([getMediaLibrary(), getCampaigns(), getMediaCountsByType()]); setMedia(m); setCampaigns(c); setTypeCounts(tc) } catch (err) { console.error(err) } finally { setIsLoading(false) }
  }

  const handleCreate = async () => {
    try {
      await createMediaItem({ ...form as any, campaign_id: form.campaign_id || undefined, uploaded_by: profile?.id })
      setShowModal(false)
      setForm({ file_name: '', file_url: '', file_type: 'image', file_size_kb: 0, campaign_id: '', category: '', platform: '' })
      await loadData()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media item?')) return
    try { await deleteMediaItem(id); await loadData() } catch (err) { console.error(err) }
  }

  const typeIcons: Record<string, any> = { image: ImageIcon, video: Video, document: FileText, logo: ImageIcon, template: FileText }
  const typeColors: Record<string, string> = { image: '#3B82F6', video: '#EF4444', document: '#F59E0B', logo: '#8B5CF6', template: '#10B981' }
  const fileTypes = ['image', 'video', 'logo', 'document', 'template'] as const

  let filtered = media
  if (filterType !== 'all') filtered = filtered.filter(m => m.file_type === filterType)
  if (searchQuery) filtered = filtered.filter(m => m.file_name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage all marketing media assets</p>
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90">
              <Plus size={16} /> Upload Media
            </button>
          </div>

          {/* Type Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {fileTypes.map(t => {
              const Icon = typeIcons[t] || FileText
              const color = typeColors[t] || '#6B7280'
              return (
                <button key={t} onClick={() => setFilterType(filterType === t ? 'all' : t)} className={`p-4 rounded-xl border text-left transition-all ${filterType === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary'}`}>
                  <Icon size={16} style={filterType === t ? { color: 'white' } : { color }} className="mb-2" />
                  <p className={`text-xs font-medium ${filterType === t ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{t.charAt(0).toUpperCase() + t.slice(1)}s</p>
                  <p className="text-lg font-bold mt-1">{typeCounts[t] || 0}</p>
                </button>
              )
            })}
          </div>

          {/* Search + View Toggle */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search media..." className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-card focus:outline-none focus:border-primary" />
            </div>
            <div className="flex bg-card rounded-lg border border-border overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}><Grid size={16} /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}><List size={16} /></button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={48} /></div>
          ) : filtered.length === 0 ? (
            <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center"><p className="text-muted-foreground">No media files found</p></div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map(item => {
                const color = typeColors[item.file_type] || '#6B7280'
                const Icon = typeIcons[item.file_type] || FileText
                return (
                  <div key={item.id} className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden group">
                    <div className="h-32 flex items-center justify-center" style={{ backgroundColor: `${color}10` }}>
                      <Icon size={40} style={{ color }} className="opacity-50" />
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-medium text-foreground truncate">{item.file_name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${color}15`, color }}>{item.file_type}</span>
                        {item.file_size_kb && <span className="text-[10px] text-muted-foreground">{(item.file_size_kb / 1024).toFixed(1)} MB</span>}
                      </div>
                      <button onClick={() => handleDelete(item.id)} className="mt-2 text-[10px] text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"><Trash2 size={10} />Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-border bg-muted">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">File</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Size</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map(item => {
                    const color = typeColors[item.file_type] || '#6B7280'
                    return (
                      <tr key={item.id} className="border-b border-border hover:bg-muted">
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{item.file_name}</td>
                        <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: `${color}15`, color }}>{item.file_type}</span></td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.file_size_kb ? `${(item.file_size_kb / 1024).toFixed(1)} MB` : '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.category || '—'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3"><button onClick={() => handleDelete(item.id)} className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded hover:bg-destructive/20">Delete</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {showModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-card rounded-xl shadow-xl w-full max-w-lg">
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Upload Media</h3>
                  <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div><label className="block text-sm font-medium text-foreground mb-1">File Name</label><input type="text" value={form.file_name} onChange={e => setForm({ ...form, file_name: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
                  <div><label className="block text-sm font-medium text-foreground mb-1">File URL</label><input type="url" value={form.file_url} onChange={e => setForm({ ...form, file_url: e.target.value })} placeholder="https://..." className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-foreground mb-1">Type</label><select value={form.file_type} onChange={e => setForm({ ...form, file_type: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">{fileTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-foreground mb-1">Size (KB)</label><input type="number" value={form.file_size_kb} onChange={e => setForm({ ...form, file_size_kb: parseInt(e.target.value) || 0 })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-foreground mb-1">Campaign</label><select value={form.campaign_id} onChange={e => setForm({ ...form, campaign_id: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"><option value="">None</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-foreground mb-1">Category</label><input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Social Media, Branding" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t border-border">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
                  <button onClick={handleCreate} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90">Upload</button>
                </div>
              </div>
            </div>
          )}
    </div>
  )
}
