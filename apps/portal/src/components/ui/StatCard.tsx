import React from 'react'
import clsx from 'clsx'

interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose'
}

const colorMap = {
  blue:    { bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-l-blue-500' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-l-emerald-500' },
  amber:   { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-l-amber-500' },
  purple:  { bg: 'bg-purple-500/15',  text: 'text-purple-400',  border: 'border-l-purple-500' },
  rose:    { bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-l-rose-500' },
}

export function StatCard({ label, value, subtitle, icon: Icon, trend, trendLabel, color = 'blue' }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className={clsx(
      'bg-surface-elevated rounded-xl p-5 border border-slate-700 border-l-4 hover:border-slate-600 transition-colors',
      c.border,
    )}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">{label}</span>
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', c.bg)}>
          <Icon className={clsx('h-4 w-4', c.text)} />
        </div>
      </div>
      <p className="text-3xl font-bold text-text-primary tabular-nums">{value}</p>
      {subtitle && <p className="text-text-muted text-xs mt-1.5">{subtitle}</p>}
      {trendLabel && (
        <p className={clsx('text-xs mt-2 font-medium', trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-text-muted')}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {trendLabel}
        </p>
      )}
    </div>
  )
}
