'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Plane, Settings, LogOut, Lock, X, Menu } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { getNavForRole } from '@/lib/navigation'
import type { Profile } from '@/types'

interface MobileSidebarProps {
  profile: Profile
}

function getIconComponent(iconName: string) {
  const icons: Record<string, any> = {
    LayoutDashboard: LucideIcons.LayoutDashboard,
    Users: LucideIcons.Users,
    KanbanSquare: LucideIcons.KanbanSquare,
    FileText: LucideIcons.FileText,
    Activity: LucideIcons.Activity,
    CheckSquare: LucideIcons.CheckSquare,
    TrendingUp: LucideIcons.TrendingUp,
    DollarSign: LucideIcons.DollarSign,
    BarChart2: LucideIcons.BarChart2,
    UserCheck: LucideIcons.UserCheck,
    Plane: LucideIcons.Plane,
    Map: LucideIcons.Map,
    BookOpen: LucideIcons.BookOpen,
    FolderOpen: LucideIcons.FolderOpen,
    Building: LucideIcons.Building,
    CreditCard: LucideIcons.CreditCard,
    TrendingDown: LucideIcons.TrendingDown,
    Building2: LucideIcons.Building2,
    Award: LucideIcons.Award,
    Target: LucideIcons.Target,
    Trophy: LucideIcons.Trophy,
    Calendar: LucideIcons.Calendar,
    Shield: LucideIcons.Shield,
    UserPlus: LucideIcons.UserPlus,
    Receipt: LucideIcons.Receipt,
    Zap: LucideIcons.Zap,
    User: LucideIcons.User,
    Settings: LucideIcons.Settings,
    MessageSquare: LucideIcons.MessageSquare,
    Megaphone: LucideIcons.Megaphone,
    Share2: LucideIcons.Share2,
    PenTool: LucideIcons.PenTool,
    CalendarDays: LucideIcons.CalendarDays,
    MessageCircle: LucideIcons.MessageCircle,
    Monitor: LucideIcons.Monitor,
    Star: LucideIcons.Star,
    Image: LucideIcons.Image,
    Video: LucideIcons.Video,
    ClipboardList: LucideIcons.ClipboardList,
    Clock: LucideIcons.Clock,
    CheckCircle: LucideIcons.CheckCircle,
    Briefcase: LucideIcons.Briefcase,
    Package: LucideIcons.Package,
  }
  return icons[iconName] || LucideIcons.Circle
}

export function MobileSidebar({ profile }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const nav = getNavForRole(profile.role)

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname?.startsWith(href)
  }

  const handleSignOut = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setIsOpen(false)
    router.push('/login')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 text-[#4B6B7A] hover:text-[#0B1F33] transition-colors"
      >
        <Menu size={24} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-screen w-56 bg-[#0B2A3D] border-r border-[#0D3A52] z-50 overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-[#0D3A52] bg-[#0A2D42] flex items-center justify-between gap-2 px-4 flex-shrink-0">
              <div className="flex items-center gap-2 flex-1">
                <div className="bg-[#0A8FA8] p-1.5 rounded-lg">
                  <Plane className="text-white" size={20} />
                </div>
                <span className="text-white font-bold text-lg">Omnia Travel</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-[#94A3B8]"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Profile */}
            <div className="px-4 py-3 border-b border-[#0D3A52]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#0A8FA8] rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                  {getInitials(profile.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{profile.full_name}</p>
                  <p className="text-xs px-2 py-0.5 rounded-full bg-[#0D3A52] text-[#38BDF8] capitalize inline-block mt-1">
                    {profile.role.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
              {nav.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs font-medium uppercase tracking-widest text-[#4B6B7A] px-3 pb-2">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = getIconComponent(item.icon)
                      const active = isActive(item.href)

                      return (
                        <button
                          key={item.label}
                          onClick={() => {
                            if (!item.locked) {
                              router.push(item.href)
                              setIsOpen(false)
                            }
                          }}
                          disabled={item.locked}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg text-sm font-medium transition-all duration-150 ${
                            item.locked
                              ? 'opacity-50 cursor-not-allowed text-[#4B6B7A]'
                              : active
                                ? 'bg-[#0A8FA8] text-white'
                                : 'text-[#94A3B8] hover:bg-[#0D3A52] hover:text-white'
                          }`}
                        >
                          <Icon size={16} className="flex-shrink-0" />
                          <span className="flex-1 text-left truncate">{item.label}</span>
                          {item.locked ? (
                            <Lock size={12} className="flex-shrink-0" />
                          ) : item.badge ? (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white flex-shrink-0">
                              {item.badge}
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Bottom Section */}
            <div className="border-t border-[#0D3A52] p-2 flex-shrink-0 space-y-1">
              <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#94A3B8] hover:bg-[#0D3A52] hover:text-white transition-all duration-150">
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-950/30 transition-all duration-150"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
