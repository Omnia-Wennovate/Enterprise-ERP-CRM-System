'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type { SocialAccount } from '@/types/marketing'
import { PLATFORM_COLORS, PLATFORM_LABELS } from '@/types/marketing'
import { Loader2, Plus, RefreshCw, Wifi, WifiOff, ExternalLink, X } from 'lucide-react'
import { getSocialAccounts, createSocialAccount, updateSocialAccount, deleteSocialAccount, syncAccountStatus } from '@/lib/services/social-accounts'

export default function SocialAccountsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<SocialAccount | null>(null)
  const [form, setForm] = useState({ platform: 'facebook', account_name: '', profile_url: '', followers_count: 0 })

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try { setProfile(JSON.parse(authUser)) } catch { router.push('/login') }
  }, [router])

  useEffect(() => {
    if (profile) loadAccounts()
  }, [profile])

  const loadAccounts = async () => {
    try {
      setIsLoading(true)
      const data = await getSocialAccounts()
      setAccounts(data)
    } catch (err) {
      console.error('Failed to load accounts:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      if (editingAccount) {
        await updateSocialAccount(editingAccount.id, form as any)
      } else {
        await createSocialAccount(form as any)
      }
      setShowModal(false)
      setEditingAccount(null)
      setForm({ platform: 'facebook', account_name: '', profile_url: '', followers_count: 0 })
      await loadAccounts()
    } catch (err) {
      console.error('Failed to save account:', err)
    }
  }

  const handleEdit = (account: SocialAccount) => {
    setEditingAccount(account)
    setForm({
      platform: account.platform,
      account_name: account.account_name,
      profile_url: account.profile_url || '',
      followers_count: account.followers_count,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return
    try {
      await deleteSocialAccount(id)
      await loadAccounts()
    } catch (err) {
      console.error('Failed to delete account:', err)
    }
  }

  const handleSync = async (id: string) => {
    try {
      await syncAccountStatus(id)
      await loadAccounts()
    } catch (err) {
      console.error('Failed to sync account:', err)
    }
  }

  if (!profile) return null

  const platforms = ['facebook', 'instagram', 'tiktok', 'linkedin', 'youtube', 'twitter', 'telegram', 'whatsapp'] as const

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F7FA]">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F33]">Social Media Accounts</h1>
              <p className="text-sm text-[#4B6B7A] mt-1">Manage all company social media platforms</p>
            </div>
            <button
              onClick={() => { setEditingAccount(null); setForm({ platform: 'facebook', account_name: '', profile_url: '', followers_count: 0 }); setShowModal(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-[#0A8FA8] text-white text-sm font-medium rounded-lg hover:bg-[#088096] transition-colors"
            >
              <Plus size={16} /> Add Account
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-[#0A8FA8]" size={48} />
            </div>
          ) : accounts.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-12 text-center">
              <p className="text-[#4B6B7A] mb-4">No social accounts connected yet</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-[#0A8FA8] text-white text-sm font-medium rounded-lg hover:bg-[#088096]"
              >
                Connect Your First Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => {
                const color = PLATFORM_COLORS[account.platform as keyof typeof PLATFORM_COLORS] || '#6B7280'
                const label = PLATFORM_LABELS[account.platform as keyof typeof PLATFORM_LABELS] || account.platform
                return (
                  <div key={account.id} className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm hover:shadow-md transition-all overflow-hidden">
                    <div className="h-1.5" style={{ backgroundColor: color }} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-sm font-bold text-[#0B1F33]">{account.account_name}</p>
                          <p className="text-xs font-medium mt-0.5" style={{ color }}>{label}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          account.status === 'connected' ? 'bg-[#10B981]/10 text-[#10B981]' :
                          account.status === 'disconnected' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                          'bg-[#F59E0B]/10 text-[#F59E0B]'
                        }`}>
                          {account.status === 'connected' ? <Wifi size={10} className="inline mr-1" /> : <WifiOff size={10} className="inline mr-1" />}
                          {account.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-[#F0F7FA] rounded-lg p-3">
                          <p className="text-xs text-[#4B6B7A]">Followers</p>
                          <p className="text-lg font-bold text-[#0B1F33]">{account.followers_count.toLocaleString()}</p>
                        </div>
                        <div className="bg-[#F0F7FA] rounded-lg p-3">
                          <p className="text-xs text-[#4B6B7A]">API Status</p>
                          <p className={`text-sm font-medium mt-1 ${
                            account.api_status === 'active' ? 'text-[#10B981]' : 'text-[#EF4444]'
                          }`}>{account.api_status}</p>
                        </div>
                      </div>

                      {account.last_sync_at && (
                        <p className="text-xs text-[#4B6B7A] mb-3">
                          Last synced: {new Date(account.last_sync_at).toLocaleDateString()}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-3 border-t border-[#DBEAFE]">
                        <button onClick={() => handleSync(account.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#0A8FA8] bg-[#0A8FA8]/10 rounded-lg hover:bg-[#0A8FA8]/20 transition-colors">
                          <RefreshCw size={12} /> Sync
                        </button>
                        <button onClick={() => handleEdit(account)} className="px-3 py-1.5 text-xs font-medium text-[#4B6B7A] bg-[#F0F7FA] rounded-lg hover:bg-[#DBEAFE] transition-colors">
                          Edit
                        </button>
                        {account.profile_url && (
                          <a href={account.profile_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-xs font-medium text-[#4B6B7A] bg-[#F0F7FA] rounded-lg hover:bg-[#DBEAFE] transition-colors">
                            <ExternalLink size={12} />
                          </a>
                        )}
                        <button onClick={() => handleDelete(account.id)} className="ml-auto px-3 py-1.5 text-xs font-medium text-[#EF4444] bg-[#EF4444]/10 rounded-lg hover:bg-[#EF4444]/20 transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-[#DBEAFE]">
                  <h3 className="text-lg font-semibold text-[#0B1F33]">
                    {editingAccount ? 'Edit Account' : 'Add Social Account'}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-[#4B6B7A] hover:text-[#0B1F33]"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0B1F33] mb-1">Platform</label>
                    <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8] focus:ring-2 focus:ring-[#0A8FA8]/20">
                      {platforms.map(p => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0B1F33] mb-1">Account Name</label>
                    <input type="text" value={form.account_name} onChange={e => setForm({ ...form, account_name: e.target.value })} placeholder="@omniatravel" className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8] focus:ring-2 focus:ring-[#0A8FA8]/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0B1F33] mb-1">Profile URL</label>
                    <input type="url" value={form.profile_url} onChange={e => setForm({ ...form, profile_url: e.target.value })} placeholder="https://..." className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8] focus:ring-2 focus:ring-[#0A8FA8]/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0B1F33] mb-1">Followers Count</label>
                    <input type="number" value={form.followers_count} onChange={e => setForm({ ...form, followers_count: parseInt(e.target.value) || 0 })} className="w-full border border-[#DBEAFE] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0A8FA8] focus:ring-2 focus:ring-[#0A8FA8]/20" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t border-[#DBEAFE]">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-[#4B6B7A] hover:text-[#0B1F33]">Cancel</button>
                  <button onClick={handleSubmit} className="px-4 py-2 bg-[#0A8FA8] text-white text-sm font-medium rounded-lg hover:bg-[#088096]">
                    {editingAccount ? 'Update' : 'Add Account'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
