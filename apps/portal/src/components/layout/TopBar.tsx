import React from 'react'
import { useAuthStore } from '@/store/authStore'
import { useGymStore } from '@/store/gymStore'

interface TopBarProps {
  title: string
}

export function TopBar({ title }: TopBarProps) {
  const { userName } = useAuthStore()
  const { gymName } = useGymStore()

  return (
    <header className="h-14 bg-surface-elevated border-b border-slate-700 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-text-primary font-semibold text-lg">{title}</h1>
      <div className="flex items-center gap-4">
        <span className="text-text-secondary text-sm hidden sm:block">{gymName}</span>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-primary font-semibold text-sm">
            {userName?.charAt(0).toUpperCase() ?? 'U'}
          </span>
        </div>
      </div>
    </header>
  )
}
