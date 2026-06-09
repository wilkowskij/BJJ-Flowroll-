import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  BookOpenIcon,
  ShareIcon,
  NewspaperIcon,
  CalendarIcon,
  UsersIcon,
  TrophyIcon,
  MegaphoneIcon,
  CogIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useAuthStore } from '@/store/authStore'
import { useGymStore } from '@/store/gymStore'
import { BeltBadge } from '@/components/ui/Badge'

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: 'Library', path: '/library', icon: BookOpenIcon },
  { label: 'Flowchart Builder', path: '/flowchart', icon: ShareIcon },
  { label: 'Weekly Posts', path: '/posts', icon: NewspaperIcon },
  { label: 'Class Planner', path: '/planner', icon: CalendarIcon },
  { label: 'Students', path: '/students', icon: UsersIcon },
  { label: 'Belt Tracks', path: '/belt-tracks', icon: TrophyIcon },
  { label: 'Announcements', path: '/announcements', icon: MegaphoneIcon },
  { label: 'Settings', path: '/settings', icon: CogIcon },
  { label: 'Billing', path: '/billing', icon: CreditCardIcon },
]

export function Sidebar() {
  const { userName, userBelt, logout } = useAuthStore()
  const { gymName, logoUrl } = useGymStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 min-w-[240px] bg-surface-elevated flex flex-col h-full border-r border-slate-700 flex-shrink-0">
      {/* Logo / Gym Name */}
      <div className="px-4 py-5 border-b border-slate-700">
        {logoUrl ? (
          <img src={logoUrl} alt={gymName} className="h-8 object-contain" />
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FM</span>
            </div>
            <span className="font-bold text-text-primary text-lg tracking-tight">
              FlowMat
            </span>
          </div>
        )}
        <p className="text-text-muted text-xs mt-1 truncate">{gymName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'border-l-2 border-primary text-primary bg-primary/10 pl-[10px]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-card border-l-2 border-transparent',
              )
            }
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div className="px-3 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-semibold text-sm">
              {userName?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text-primary text-sm font-medium truncate">
              {userName ?? 'Instructor'}
            </p>
            {userBelt && <BeltBadge belt={userBelt} className="mt-0.5" />}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg text-sm transition-colors duration-150"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
