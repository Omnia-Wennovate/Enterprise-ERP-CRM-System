'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Settings, LogOut, Lock, X, Menu } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { getNavForRole } from '@/lib/navigation'
import { OmniaLogo } from '@/components/ui/OmniaLogo'
import type { Profile } from '@/types'
import { resolveUserNames, getInitials } from '@/lib/utils/user-name'

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
    Cpu: LucideIcons.Cpu,
    Code2: LucideIcons.Code2,
    GitBranch: LucideIcons.GitBranch,
    RefreshCw: LucideIcons.RefreshCw,
    KeyRound: LucideIcons.KeyRound,
    Archive: LucideIcons.Archive,
    Inbox: LucideIcons.Inbox,
    PiggyBank: LucideIcons.PiggyBank,
    Wallet: LucideIcons.Wallet,
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

  const handleSignOut = async () => {
    const supabase = (await import('@/lib/supabase/client')).createClient()
    await supabase.auth.signOut()
    setIsOpen(false)
    router.push('/login')
    router.refresh()
  }

  const displayName = resolveUserNames(profile).full_name

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Menu size={24} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-screen w-[260px] bg-sidebar border-r border-sidebar-border z-50 overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-sidebar-border flex items-center justify-between px-5 flex-shrink-0">
              <OmniaLogo variant="full" theme="light" size={52} />
              <button
                onClick={() => setIsOpen(false)}
                className="text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Profile */}
            <div className="px-4 py-3.5 border-b border-sidebar-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 bg-omnia-gold/20 text-omnia-gold border border-omnia-gold/30">
                  {getInitials(displayName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sidebar-accent-foreground text-sm font-medium truncate">{displayName}</p>
                  <p className="text-[10px] px-2 py-0.5 rounded-full bg-omnia-gold/15 text-omnia-gold-light capitalize inline-block mt-0.5 font-medium">
                    {profile.role.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
              {nav.map((section) => (
                <div key={section.title}>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/50 px-3 pb-2">
                    {section.title}
                  </h3>
                  <div className="space-y-0.5">
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
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 relative ${
                            item.locked
                              ? 'opacity-40 cursor-not-allowed text-sidebar-foreground'
                              : active
                                ? 'bg-sidebar-accent text-omnia-gold'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                        >
                          {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-omnia-gold rounded-r-full" />
                          )}
                          <Icon size={16} className="flex-shrink-0" />
                          <span className="flex-1 text-left truncate">{item.label}</span>
                          {item.locked ? (
                            <Lock size={12} className="flex-shrink-0 opacity-50" />
                          ) : item.badge ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-omnia-gold/20 text-omnia-gold font-semibold flex-shrink-0">
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
            <div className="border-t border-sidebar-border p-3 flex-shrink-0 space-y-0.5">
              <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150">
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150"
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
